#!/usr/bin/env python3
"""
EXTRACTOR AUTOMÁTICO DE EMPRESAS DE ONAPI & ENRIQUECEDOR (REPÚBLICA DOMINICANA)
------------------------------------------------------------------------------
Descarga de boletines oficiales, parsing con pdfplumber, enriquecimiento con
Google Places API y clasificación fiscal DGII.
"""

import os
import sys
import re
import time
import requests
import pandas as pd

# Intentar importar pdfplumber
try:
    import pdfplumber
except ImportError:
    print("[!] Error: pdfplumber no está instalado. Ejecuta: pip install pdfplumber pandas requests")
    sys.exit(1)

# Configuración por variables de entorno o parámetros
GOOGLE_API_KEY = os.environ.get("AIzaSyBJFwPHsBloLby04g7hQsbUgsz8lYmqjRA", "")
URL_BOLETINES_ONAPI = "https://onapi.gob.do/index.php/publicaciones/boletines"
ARCHIVO_SALIDA = "nuevas_empresas_rd_completo.csv"

# Diccionario de sectores económicos de República Dominicana
SECTORES_RD = {
    'Sector Financiero, Inversiones & FinTech': [
        'financ', 'banc', 'credit', 'prestam', 'inversio', 'fondo', 'capital privado',
        'segur', 'poliz', 'fintech', 'remes', 'divisas', 'bolsa', 'fideicomis', 'factoring', 'leasing'
    ],
    'Construcción & Obras Civiles': [
        'construcc', 'obras', 'edific', 'ingenier', 'remodel', 'arquitect', 'inmueble', 'tierra', 'vivienda'
    ],
    'Tecnología & Software': [
        'softw', 'cloud', 'tecnolog', 'sistemas', 'ciber', 'digital', 'comput', 'informatic', 'app', 'web'
    ],
    'Salud & Servicios Médicos': [
        'medic', 'salud', 'clinic', 'laborat', 'farmac', 'dental', 'hospital', 'diagnost'
    ],
    'Transporte & Logística': [
        'transp', 'logistic', 'frio', 'carga', 'distribuc', 'flete', 'almacen', 'aduan', 'envio'
    ],
    'Inmobiliaria & Turismo': [
        'turism', 'hotel', 'resort', 'villas', 'vacacional', 'inmobil', 'hosped', 'playa', 'bienes raices'
    ],
    'Alimentos & Gastronomía': [
        'aliment', 'gourmet', 'restaur', 'bebida', 'vino', 'queso', 'panader', 'comida', 'snack'
    ],
    'Energía Renovable': [
        'solar', 'energi', 'fotovolt', 'electr', 'renovab', 'bateri', 'panel'
    ],
    'Consultoría, Legal & Fiscal': [
        'consult', 'asesor', 'fiscal', 'auditor', 'legal', 'abogad', 'contabl', 'tributar'
    ]
}

def clasificar_sector(actividad):
    texto = str(actividad).lower()
    for sector, palabras_clave in SECTORES_RD.items():
        if any(kw in texto for kw in palabras_clave):
            return sector
    return 'Comercio, Importación & Retail'

def extraer_empresas_pdf(ruta_pdf):
    print(f"[*] Analizando PDF: {ruta_pdf}")
    empresas = []

    with pdfplumber.open(ruta_pdf) as pdf:
        total_paginas = len(pdf.pages)
        print(f"[*] Total de páginas detectadas: {total_paginas}")

        for i, page in enumerate(pdf.pages):
            texto = page.extract_text()
            if not texto:
                continue

            bloques_nombre = re.findall(r"Denominación:\s*(.*?)\n", texto, re.IGNORECASE)
            bloques_actividad = re.findall(r"Actividad:\s*(.*?)\n", texto, re.IGNORECASE)

            for nom, act in zip(bloques_nombre, bloques_actividad):
                nom_limpio = nom.strip().upper()
                if nom_limpio and len(nom_limpio) > 3:
                    empresas.append({
                        "nombre_comercial": nom_limpio,
                        "descripcion_actividad": act.strip(),
                        "sector_economico": clasificar_sector(act)
                    })

            if (i + 1) % 25 == 0:
                print(f"    - {i + 1}/{total_paginas} páginas procesadas...")

    print(f"[+] Total de empresas extraídas: {len(empresas)}")
    return empresas

def enriquecer_con_google_places(nombre_empresa, api_key):
    if not api_key:
        return {"telefono": "No configurado", "direccion": "Santo Domingo, República Dominicana"}

    try:
        url_find = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params_find = {
            "input": f"{nombre_empresa} Republica Dominicana",
            "inputtype": "textquery",
            "fields": "place_id",
            "key": api_key
        }
        res_find = requests.get(url_find, params=params_find, timeout=5).json()

        if res_find.get("candidates"):
            place_id = res_find["candidates"][0]["place_id"]
            url_details = "https://maps.googleapis.com/maps/api/place/details/json"
            params_details = {
                "place_id": place_id,
                "fields": "formatted_phone_number,formatted_address",
                "key": api_key
            }
            res_details = requests.get(url_details, params=params_details, timeout=5).json()
            result = res_details.get("result", {})
            return {
                "telefono": result.get("formatted_phone_number", "No disponible"),
                "direccion": result.get("formatted_address", "República Dominicana")
            }
    except Exception as e:
        pass

    return {"telefono": "No disponible", "direccion": "República Dominicana"}

def procesar_pipeline(ruta_pdf, api_key=None):
    empresas = extraer_empresas_pdf(ruta_pdf)
    datos_completos = []

    print("[*] Iniciando enriquecimiento de datos corporativos...")
    for idx, emp in enumerate(empresas):
        nombre = emp["nombre_comercial"]
        contacto = enriquecer_con_google_places(nombre, api_key)

        # Inferencia de tipo societario dominicano
        tipo_dgii = "Persona Física / Pendiente"
        if "S.R.L." in nombre or "SRL" in nombre:
            tipo_dgii = "S.R.L."
        elif "S.A.S." in nombre or "SAS" in nombre:
            tipo_dgii = "S.A.S."
        elif "E.I.R.L." in nombre or "EIRL" in nombre:
            tipo_dgii = "E.I.R.L."
        elif "S.A." in nombre:
            tipo_dgii = "S.A."

        datos_completos.append({
            "Nombre Comercial": nombre,
            "Sector": emp["sector_economico"],
            "Actividad ONAPI": emp["descripcion_actividad"],
            "Tipo DGII": tipo_dgii,
            "Telefono": contacto["telefono"],
            "Direccion": contacto["direccion"],
            "Fecha Extraccion": time.strftime("%Y-%m-%d %H:%M:%S")
        })

        if api_key and idx < 50:
            time.sleep(0.1)  # Rate limiting para Google API

    df = pd.DataFrame(datos_completos)
    df.to_csv(ARCHIVO_SALIDA, index=False, encoding="utf-8-sig")
    print(f"[✔] Archivo generado exitosamente: {ARCHIVO_SALIDA} ({len(df)} registros)")

if __name__ == "__main__":
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "boletin_onapi.pdf"
    if not os.path.exists(pdf_path):
        print(f"[!] No se encontró el archivo '{pdf_path}'. Pasa la ruta como argumento: python3 extractor.py ruta_al_boletin.pdf")
        sys.exit(1)

    procesar_pipeline(pdf_path, GOOGLE_API_KEY)
