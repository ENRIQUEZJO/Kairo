#!/usr/bin/env python3
"""
EXTRACTOR AUTOMÁTICO DE EMPRESAS DE ONAPI & ENRIQUECEDOR (REPÚBLICA DOMINICANA)
------------------------------------------------------------------------------
1. Descarga automática del último boletín oficial PDF desde onapi.gob.do (si no se pasa PDF local)
2. Extracción multi-formato con pdfplumber (Etiquetas, Códigos INID, E/YYYY-NNNNN, S.R.L./S.A.S.)
3. Enriquecimiento opcional con Google Places API y clasificación fiscal DGII
4. Exportación a CSV (nuevas_empresas_rd_completo.csv) y JSON para sincronización directa con la plataforma Web (public/data/boletin_actual.json)
"""

import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urljoin

import pandas as pd
import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

try:
    import pdfplumber
except ImportError:
    print("[!] Error: pdfplumber no está instalado. Ejecuta: pip install pdfplumber pandas requests beautifulsoup4")
    sys.exit(1)

GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "AIzaSyBJFwPHsBloLby04g7hQsbUgsz8lYmqjRA")
URL_BOLETINES_ONAPI = "https://onapi.gob.do/index.php/publicaciones/boletines"
ARCHIVO_SALIDA_CSV = "nuevas_empresas_rd_completo.csv"
ARCHIVO_SALIDA_JSON = os.path.join("public", "data", "boletin_actual.json")
PDF_DESCARGADO = "/tmp/boletin_onapi_latest.pdf"

HEADERS_HTTP = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
}

SECTORES_RD = {
    "Sector Financiero, Inversiones & FinTech": [
        "financ", "banc", "credit", "prestam", "inversio", "fondo", "capital privado",
        "segur", "poliz", "fintech", "remes", "divisas", "bolsa", "fideicomis", "factoring", "leasing",
    ],
    "Construcción & Obras Civiles": [
        "construcc", "obras", "edific", "ingenier", "remodel", "arquitect", "inmueble", "tierra", "vivienda",
    ],
    "Tecnología & Software": [
        "softw", "cloud", "tecnolog", "sistemas", "ciber", "digital", "comput", "informatic", "app", "web",
    ],
    "Salud & Servicios Médicos": [
        "medic", "salud", "clinic", "laborat", "farmac", "dental", "hospital", "diagnost",
    ],
    "Transporte & Logística": [
        "transp", "logistic", "frio", "carga", "distribuc", "flete", "almacen", "aduan", "envio",
    ],
    "Inmobiliaria & Turismo": [
        "turism", "hotel", "resort", "villas", "vacacional", "inmobil", "hosped", "playa", "bienes raices",
    ],
    "Alimentos & Gastronomía": [
        "aliment", "gourmet", "restaur", "bebida", "vino", "queso", "panader", "comida", "snack",
    ],
    "Energía Renovable": [
        "solar", "energi", "fotovolt", "electr", "renovab", "bateri", "panel",
    ],
    "Consultoría, Legal & Fiscal": [
        "consult", "asesor", "fiscal", "auditor", "legal", "abogad", "contabl", "tributar",
    ],
}

CORP_SUFFIX_RE = re.compile(
    r"\b(?:S\.?\s*R\.?\s*L\.?|S\.?\s*A\.?\s*S\.?|E\.?\s*I\.?\s*R\.?\s*L\.?|S\.\s*A\.?|C\.\s*(?:POR|X)\s*A\.?)(?=\s|$|[,\.;\)])",
    re.IGNORECASE,
)


def clasificar_sector(actividad: str) -> str:
    texto = str(actividad).lower()
    for sector, palabras_clave in SECTORES_RD.items():
        if any(kw in texto for kw in palabras_clave):
            return sector
    return "Comercio, Importación & Retail"


def inferir_tipo_dgii(nombre: str) -> tuple[str, str]:
    n = nombre.lower()
    if "s.r.l" in n or "srl" in n:
        return "Sociedad de Responsabilidad Limitada (S.R.L.)", "S.R.L."
    if "s.a.s" in n or "sas" in n:
        return "Sociedad Anónima Simplificada (S.A.S.)", "S.A.S."
    if "e.i.r.l" in n or "eirl" in n:
        return "Empresa Individual de Responsabilidad Limitada (E.I.R.L.)", "E.I.R.L."
    if "s.a" in n or " sa " in n:
        return "Sociedad Anónima (S.A.)", "S.A."
    return "Pendiente de constitución / Persona Física", "Persona Física"


def fetch_con_reintento(url: str, timeout: int = 30, stream: bool = False) -> requests.Response:
    try:
        resp = requests.get(url, headers=HEADERS_HTTP, timeout=timeout, stream=stream)
        resp.raise_for_status()
        return resp
    except requests.exceptions.SSLError:
        resp = requests.get(url, headers=HEADERS_HTTP, timeout=timeout, stream=stream, verify=False)
        resp.raise_for_status()
        return resp


def buscar_y_descargar_ultimo_boletin(destino_pdf: str) -> tuple[str | None, str | None]:
    """
    Rastrea https://onapi.gob.do/index.php/publicaciones/boletines para encontrar el enlace PDF
    más reciente (priorizando boletines 'Internet ONAPI' / 'Nombres Comerciales' / 'Boletín').
    """
    print(f"[*] Consultando portal oficial ONAPI: {URL_BOLETINES_ONAPI}")
    try:
        resp = fetch_con_reintento(URL_BOLETINES_ONAPI, timeout=25)
    except Exception as e:
        print(f"[!] No se pudo conectar a ONAPI ({e})")
        return None, None

    soup = BeautifulSoup(resp.text, "html.parser")
    candidatos_pdf: list[tuple[int, str, str]] = []
    subpaginas: list[str] = []

    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        full_url = urljoin(URL_BOLETINES_ONAPI, href)
        label = (a.get_text(" ", strip=True) or "").strip()
        combined = f"{label} {full_url}".lower()

        if ".pdf" in full_url.lower() or "download" in combined:
            score = 0
            if "internet" in combined:
                score += 40
            if "nombre" in combined or "boletin" in combined:
                score += 30
            if str(datetime.now().year) in combined:
                score += 20
            candidatos_pdf.append((score, full_url, label or os.path.basename(full_url)))
        elif "boletin" in combined and "onapi.gob.do" in full_url.lower() and full_url != URL_BOLETINES_ONAPI:
            subpaginas.append(full_url)

    # Si los PDFs están en una subpágina reciente de boletines, explorar las primeras 3
    if not candidatos_pdf and subpaginas:
        for sub_url in subpaginas[:3]:
            try:
                sub_resp = fetch_con_reintento(sub_url, timeout=20)
                sub_soup = BeautifulSoup(sub_resp.text, "html.parser")
                for a in sub_soup.find_all("a", href=True):
                    full_url = urljoin(sub_url, a["href"].strip())
                    label = (a.get_text(" ", strip=True) or "").strip()
                    if ".pdf" in full_url.lower():
                        candidatos_pdf.append((25, full_url, label or os.path.basename(full_url)))
            except Exception:
                continue

    if not candidatos_pdf:
        print("[!] No se encontraron enlaces PDF en la página de boletines de ONAPI.")
        return None, None

    candidatos_pdf.sort(key=lambda item: item[0], reverse=True)
    _, pdf_url, titulo = candidatos_pdf[0]
    print(f"[*] Descargando boletín detectado: {titulo} ({pdf_url})")

    try:
        pdf_resp = fetch_con_reintento(pdf_url, timeout=60, stream=True)
        with open(destino_pdf, "wb") as f:
            for chunk in pdf_resp.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
        size_kb = os.path.getsize(destino_pdf) / 1024.0
        print(f"[✔] PDF descargado en '{destino_pdf}' ({size_kb:.1f} KB)")
        return destino_pdf, titulo
    except Exception as e:
        print(f"[!] Error descargando PDF desde {pdf_url}: {e}")
        return None, None


def extraer_empresas_texto(texto: str) -> list[dict]:
    if not texto or not texto.strip():
        return []

    empresas: list[dict] = []
    vistos: set[str] = set()

    def agregar(nombre: str, actividad: str, solicitante: str = "Representante Legal", registro: str = ""):
        clean = re.sub(r"\s+", " ", nombre).strip()
        clean = re.sub(r"^(?:E\/\d{4}-\d{3,7}|\d{4}-\d{4,7})\s+(?:\d{1,2}\/\d{1,2}\/\d{2,4}\s+)?", "", clean, flags=re.I)
        clean = re.sub(
            r"^(?:REGISTRO|REG\.?|SOLICITUD|EXPEDIENTE)\s*(?:N[ºo°]?|NO\.?|NUMERO)?\s*[:\-]?\s*[A-Z]?\/?[0-9\-\/]*\s*",
            "",
            clean,
            flags=re.I,
        )
        clean = clean.strip(" .:;,-*#()").upper()

        if len(clean) < 3 or len(clean) > 110:
            return
        if re.match(r"^(?:SOLICITUD|DENOMINACI[OÓ]N|ACTIVIDAD|BOLET[IÍ]N|OFICINA\s+NACIONAL|P[ÁA]GINA|INDICE)", clean, re.I):
            return

        key = clean.lower()
        if key not in vistos:
            vistos.add(key)
            empresas.append({
                "nombre_comercial": clean,
                "descripcion_actividad": re.sub(r"\s+", " ", actividad).strip() or "Actividad comercial registrada en ONAPI",
                "solicitante": re.sub(r"\s+", " ", solicitante).strip() or "Representante Legal",
                "registroNo": registro.strip() or f"2026-{8100 + len(empresas)}",
                "sector_economico": clasificar_sector(actividad),
            })

    # Estrategia 1: Formato etiquetado por bloques ("Denominación:", "Actividad:", "Solicitante:")
    if re.search(r"(?:Denominaci[oó]n|Nombre\s+Comercial|Signo\s+Distintivo)\s*[:\-]", texto, re.I):
        bloques = re.split(
            r"(?=(?:^|\n)\s*(?:SOLICITUD|EXPEDIENTE|(?:Denominaci[oó]n|Nombre\s+Comercial)\s*[:\-]))",
            texto,
            flags=re.I | re.M,
        )
        for b in bloques:
            m_nom = re.search(
                r"(?:Denominaci[oó]n|Nombre\s+Comercial|Signo\s+Distintivo)\s*[:\-]\s*(.+?)(?=\n\s*(?:Actividad|Objeto|Solicitante|Titular|Fecha|SOLICITUD|$))",
                b,
                flags=re.I | re.S,
            )
            if not m_nom:
                continue
            m_act = re.search(
                r"(?:Actividad(?:\s+Comercial)?|Objeto(?:\s+Social)?)\s*[:\-]\s*(.+?)(?=\n\s*(?:Solicitante|Titular|Fecha|SOLICITUD|$))",
                b,
                flags=re.I | re.S,
            )
            m_sol = re.search(r"(?:Solicitante|Titular)\s*[:\-]\s*([^\r\n]+)", b, flags=re.I)
            m_reg = re.search(r"(?:SOLICITUD|REGISTRO|EXPEDIENTE)\s*(?:N[ºo°]?|NO\.?)?\s*[:\-]?\s*([A-Z]?\/?[0-9\-\/]+)", b, flags=re.I)
            agregar(
                m_nom.group(1),
                m_act.group(1) if m_act else "Actividad comercial registrada en ONAPI",
                m_sol.group(1) if m_sol else "Representante Legal",
                m_reg.group(1) if m_reg else "",
            )

    # Estrategia 2: Formato oficial "Internet ONAPI" (E/YYYY-NNNNN DD/MM/YY ...)
    if re.search(r"(?:^|[\s\n])E\/\d{4}-\d{3,7}\b", texto, re.I):
        bloques_exp = re.split(r"(?=(?:^|[\s\n])E\/\d{4}-\d{3,7}\b)", texto, flags=re.I)
        for blk in bloques_exp:
            m_hdr = re.match(r"^(E\/\d{4}-\d{3,7})\s*(?:\d{1,2}\/\d{1,2}\/\d{2,4})?\s*(.+)$", blk.strip(), flags=re.I | re.S)
            if not m_hdr:
                continue
            exp_no = m_hdr.group(1).strip()
            rest = m_hdr.group(2).strip()

            m_lema = re.match(
                r"^(.+?)\(\s*LEMA\s+COMERCIAL\s*\)\s*LEMA\s+COMERCIAL\s+ASOCIADO\s+AL\s+NOMBRE\s+COMERCIAL:\s*([^;\n]+);?\s*(?:REG\.?\s*N[Oº°]?\.?\s*(\d+))?\s*(.*)$",
                rest,
                flags=re.I | re.S,
            )
            if m_lema:
                titular = m_lema.group(4).strip()
                nombre_asoc = m_lema.group(2).strip()
                empresa_final = titular if (CORP_SUFFIX_RE.search(titular) and len(titular) <= 95) else nombre_asoc
                agregar(
                    empresa_final,
                    f"Lema comercial: \"{m_lema.group(1).strip()}\" · Titular: {titular or nombre_asoc}",
                    titular or nombre_asoc,
                    m_lema.group(3) or exp_no,
                )
                continue

            before_reg = rest
            reg_no = exp_no
            titular = ""
            m_reg_tail = re.match(r"^(.+?)(?:;\s*|\s+)REG\.?\s*N[Oº°]?\.?\s*(\d{4,8})\b\s*(.*)$", rest, flags=re.I | re.S)
            if m_reg_tail:
                before_reg = m_reg_tail.group(1).strip()
                reg_no = m_reg_tail.group(2).strip()
                titular = m_reg_tail.group(3).strip()

            m_corp = re.match(
                rf"^(.{{2,95}}?{CORP_SUFFIX_RE.pattern})(?=[\s,;\)]|$)(.*)$",
                before_reg,
                flags=re.I | re.S,
            )
            if m_corp:
                agregar(
                    m_corp.group(1),
                    m_corp.group(2).strip(" .,-;") or f"Titular: {titular or 'ONAPI'}",
                    titular or "Titular ONAPI",
                    reg_no,
                )
            else:
                first_line = before_reg.split("\n")[0].strip()
                if len(first_line) <= 95:
                    agregar(
                        first_line,
                        before_reg[len(first_line):].strip() or f"Titular: {titular or 'ONAPI'}",
                        titular or "Titular ONAPI",
                        reg_no,
                    )

    # Estrategia 3: Filas con sufijo societario dominicano
    if not empresas:
        for linea in texto.splitlines():
            l = linea.strip()
            if CORP_SUFFIX_RE.search(l) and len(l) >= 4:
                m_corp = re.match(rf"^(.{{2,95}}?{CORP_SUFFIX_RE.pattern})(.*)$", l, flags=re.I)
                if m_corp:
                    agregar(m_corp.group(1), m_corp.group(2).strip(" .,-;") or "Actividad comercial ONAPI")

    return empresas


def extraer_empresas_pdf(ruta_pdf: str) -> list[dict]:
    print(f"[*] Analizando PDF: {ruta_pdf}")
    texto_total = []

    with pdfplumber.open(ruta_pdf) as pdf:
        total_paginas = len(pdf.pages)
        print(f"[*] Total de páginas detectadas: {total_paginas}")

        for i, page in enumerate(pdf.pages):
            texto = page.extract_text()
            if texto:
                texto_total.append(texto)
            if (i + 1) % 25 == 0:
                print(f"    - {i + 1}/{total_paginas} páginas procesadas...")

    empresas = extraer_empresas_texto("\n".join(texto_total))
    print(f"[+] Total de empresas extraídas: {len(empresas)}")
    return empresas


def enriquecer_con_google_places(nombre_empresa: str, api_key: str) -> dict:
    if not api_key:
        return {"telefono": "No disponible", "direccion": "Santo Domingo, República Dominicana"}

    try:
        url_find = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params_find = {
            "input": f"{nombre_empresa} Republica Dominicana",
            "inputtype": "textquery",
            "fields": "place_id",
            "key": api_key,
        }
        res_find = requests.get(url_find, params=params_find, timeout=5).json()

        if res_find.get("candidates"):
            place_id = res_find["candidates"][0]["place_id"]
            url_details = "https://maps.googleapis.com/maps/api/place/details/json"
            params_details = {
                "place_id": place_id,
                "fields": "formatted_phone_number,formatted_address",
                "key": api_key,
            }
            res_details = requests.get(url_details, params=params_details, timeout=5).json()
            result = res_details.get("result", {})
            return {
                "telefono": result.get("formatted_phone_number", "No disponible"),
                "direccion": result.get("formatted_address", "República Dominicana"),
            }
    except Exception:
        pass

    return {"telefono": "No disponible", "direccion": "República Dominicana"}


def procesar_pipeline(ruta_pdf: str, api_key: str | None = None, titulo_boletin: str | None = None):
    empresas = extraer_empresas_pdf(ruta_pdf)
    datos_completos = []
    json_records = []

    print("[*] Iniciando enriquecimiento de datos corporativos...")
    for idx, emp in enumerate(empresas):
        nombre = emp["nombre_comercial"]
        contacto = enriquecer_con_google_places(nombre, api_key) if idx < 50 else {
            "telefono": "No disponible",
            "direccion": "República Dominicana",
        }
        tipo_dgii, siglas = inferir_tipo_dgii(nombre)

        datos_completos.append({
            "Nombre Comercial": nombre,
            "Sector": emp["sector_economico"],
            "Actividad ONAPI": emp["descripcion_actividad"],
            "Tipo DGII": tipo_dgii,
            "Telefono": contacto["telefono"],
            "Direccion": contacto["direccion"],
            "Solicitante": emp.get("solicitante", "Representante Legal"),
            "Registro ONAPI": emp.get("registroNo", ""),
            "Fecha Extraccion": time.strftime("%Y-%m-%d %H:%M:%S"),
        })

        json_records.append({
            "nombre_comercial": nombre,
            "descripcion_actividad": emp["descripcion_actividad"],
            "solicitante": emp.get("solicitante", "Representante Legal"),
            "registroNo": emp.get("registroNo", ""),
            "sector": emp["sector_economico"],
            "siglas": siglas,
            "telefono": contacto["telefono"],
            "direccion": contacto["direccion"],
        })

        if api_key and idx < 50:
            time.sleep(0.08)

    df = pd.DataFrame(datos_completos)
    df.to_csv(ARCHIVO_SALIDA_CSV, index=False, encoding="utf-8-sig")
    print(f"[✔] CSV generado exitosamente: {ARCHIVO_SALIDA_CSV} ({len(df)} registros)")

    os.makedirs(os.path.dirname(ARCHIVO_SALIDA_JSON), exist_ok=True)
    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "bulletinTitle": titulo_boletin or os.path.basename(ruta_pdf),
        "totalRecords": len(json_records),
        "records": json_records,
    }
    with open(ARCHIVO_SALIDA_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"[✔] JSON sincronizado para la plataforma web: {ARCHIVO_SALIDA_JSON} ({len(json_records)} registros)")


if __name__ == "__main__":
    pdf_arg = sys.argv[1] if len(sys.argv) > 1 else None
    titulo = None

    if pdf_arg and os.path.exists(pdf_arg):
        pdf_path = pdf_arg
    elif os.path.exists("boletin_onapi.pdf"):
        pdf_path = "boletin_onapi.pdf"
    else:
        pdf_path, titulo = buscar_y_descargar_ultimo_boletin(PDF_DESCARGADO)
        if not pdf_path:
            print("[!] No se encontró un PDF local ni se pudo descargar el boletín desde onapi.gob.do.")
            sys.exit(1)

    procesar_pipeline(pdf_path, GOOGLE_API_KEY, titulo)
