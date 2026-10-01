import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Download, Bot, Server } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  apiKey = 'AIzaSyBJFwPHsBloLby04g7hQsbUgsz8lYmqjRA',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'python' | 'github' | 'vps'>('python');
  const [copied, setCopied] = useState(false);
  const [customKey, setCustomKey] = useState(apiKey);

  const pythonScript = `import os
import sys
import re
import time
import requests
import pandas as pd

# Intentar importar pdfplumber
try:
    import pdfplumber
except ImportError:
    print("[!] Error: pdfplumber no instalado. Ejecuta: pip install pdfplumber pandas requests")
    sys.exit(1)

# ==========================================
# CONFIGURACIÓN Y CREDENCIALES
# ==========================================
GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "${customKey || 'TU_API_KEY_DE_GOOGLE_AQUI'}")
ARCHIVO_PDF = sys.argv[1] if len(sys.argv) > 1 else "boletin_onapi.pdf"
ARCHIVO_SALIDA = "nuevas_empresas_rd_completo.csv"

# Diccionario de sectores dominicanos
SECTORES_RD = {
    'Sector Financiero, Inversiones & FinTech': [
        'financ', 'banc', 'credit', 'prestam', 'inversio', 'fondo', 'capital', 'segur', 'poliz', 'fintech', 'remes', 'bolsa'
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
        'turism', 'hotel', 'resort', 'villas', 'vacacional', 'inmobil', 'hosped', 'playa'
    ],
    'Alimentos & Gastronomía': [
        'aliment', 'gourmet', 'restaur', 'bebida', 'vino', 'queso', 'panader', 'comida', 'snack'
    ]
}

def clasificar_sector(actividad):
    texto = str(actividad).lower()
    for sector, palabras_clave in SECTORES_RD.items():
        if any(kw in texto for kw in palabras_clave):
            return sector
    return 'Comercio, Importación & Retail'

def extraer_datos_onapi(ruta_pdf):
    empresas_extraidas = []
    print(f"[*] Abriendo boletín oficial: {ruta_pdf}...")
    with pdfplumber.open(ruta_pdf) as pdf:
        for i, pagina in enumerate(pdf.pages):
            texto = pagina.extract_text()
            if not texto:
                continue
                
            bloques_nombre = re.findall(r"Denominación:\\s*(.*?)\\n", texto, re.IGNORECASE)
            bloques_actividad = re.findall(r"Actividad:\\s*(.*?)\\n", texto, re.IGNORECASE)
            
            for nombre, actividad in zip(bloques_nombre, bloques_actividad):
                nombre_limpio = nombre.strip().upper()
                if nombre_limpio:
                    empresas_extraidas.append({
                        "nombre_comercial": nombre_limpio,
                        "descripcion_actividad": actividad.strip(),
                        "sector_economico": clasificar_sector(actividad)
                    })
    return empresas_extraidas

def buscar_en_google_places(nombre_empresa, api_key):
    if not api_key or api_key == "TU_API_KEY_DE_GOOGLE_AQUI":
        return {"telefono": "No configurado", "direccion": "Santo Domingo, República Dominicana"}
    try:
        url_find = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params_find = {
            "input": f"{nombre_empresa} Republica Dominicana",
            "inputtype": "textquery",
            "fields": "place_id",
            "key": api_key
        }
        res_find = requests.get(url_find, params=params_find, timeout=6).json()
        if res_find.get("candidates"):
            place_id = res_find["candidates"][0]["place_id"]
            url_details = "https://maps.googleapis.com/maps/api/place/details/json"
            params_details = {
                "place_id": place_id,
                "fields": "formatted_phone_number,formatted_address",
                "key": api_key
            }
            res_details = requests.get(url_details, params=params_details, timeout=6).json()
            result = res_details.get("result", {})
            return {
                "telefono": result.get("formatted_phone_number", "No disponible"),
                "direccion": result.get("formatted_address", "República Dominicana")
            }
    except Exception:
        pass
    return {"telefono": "No disponible", "direccion": "República Dominicana"}

if __name__ == "__main__":
    if not os.path.exists(ARCHIVO_PDF):
        print(f"[!] Archivo '{ARCHIVO_PDF}' no encontrado.")
        sys.exit(1)
        
    empresas = extraer_datos_onapi(ARCHIVO_PDF)
    dataset_final = []
    
    for emp in empresas:
        contacto = buscar_en_google_places(emp["nombre_comercial"], GOOGLE_API_KEY)
        dataset_final.append({
            "Nombre Comercial": emp["nombre_comercial"],
            "Sector": emp["sector_economico"],
            "Actividad": emp["descripcion_actividad"],
            "Telefono": contacto["telefono"],
            "Direccion": contacto["direccion"]
        })
        time.sleep(0.05)
        
    df = pd.DataFrame(dataset_final)
    df.to_csv(ARCHIVO_SALIDA, index=False, encoding="utf-8-sig")
    print(f"[✔] Archivo '{ARCHIVO_SALIDA}' generado con {len(df)} empresas.")
`;

  const githubActionsWorkflow = `name: Extractor Quincenal ONAPI (República Dominicana)

on:
  # Se ejecuta automáticamente el 1 y el 16 de cada mes a las 3:00 PM hora RD (19:00 UTC)
  schedule:
    - cron: '0 19 1,16 * *'

  # Permite ejecutarlo manualmente en cualquier momento desde GitHub
  workflow_dispatch:

permissions:
  contents: write

jobs:
  extract-and-enrich:
    runs-on: ubuntu-latest
    steps:
      - name: 1. Descargar repositorio
        uses: actions/checkout@v4

      - name: 2. Configurar Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: 3. Instalar librerías
        run: |
          pip install pdfplumber pandas requests

      - name: 4. Ejecutar Pipeline Extractor
        env:
          GOOGLE_PLACES_API_KEY: \${{ secrets.GOOGLE_PLACES_API_KEY }}
        run: |
          python scripts/extractor_onapi_auto.py

      - name: 5. Guardar CSV como archivo descargable
        uses: actions/upload-artifact@v4
        with:
          name: nuevas-empresas-rd-\${{ github.run_id }}
          path: nuevas_empresas_rd_completo.csv
          retention-days: 30

      - name: 6. Guardar CSV actualizado en el repositorio
        run: |
          git config --global user.name 'GitHub Actions Bot'
          git config --global user.email 'bot@kairo.com.do'
          git add nuevas_empresas_rd_completo.csv
          git commit -m "Auto: Nuevas empresas ONAPI extraídas [\$(date +'%Y-%m-%d')]" || exit 0
          git push
`;

  const vpsCronGuide = `# ========================================================
# GUÍA DE CONFIGURACIÓN EN SERVIDOR VPS (Linux Ubuntu/Debian)
# ========================================================

# 1. Conéctate a tu servidor por SSH:
ssh usuario@tu-ip-o-servidor.com

# 2. Instala Python y las librerías necesarias:
sudo apt update
sudo apt install -y python3 python3-pip
pip3 install pdfplumber pandas requests

# 3. Clona o sube tu script a una carpeta (ej: /opt/onapi):
mkdir -p /opt/onapi
cd /opt/onapi

# 4. Configura la tarea programada con crontab:
crontab -e

# 5. Pega la siguiente línea al final del archivo crontab:
# (Se ejecutará a las 3:00 PM hora dominicana los días 1 y 16 de cada mes)
0 15 1,16 * * /usr/bin/python3 /opt/onapi/extractor.py /opt/onapi/boletin_onapi.pdf >> /opt/onapi/scraper.log 2>&1
`;

  const getCurrentContent = () => {
    if (activeTab === 'python') return pythonScript;
    if (activeTab === 'github') return githubActionsWorkflow;
    return vpsCronGuide;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let filename = 'extractor_onapi.py';
    let mime = 'text/x-python';
    if (activeTab === 'github') {
      filename = 'onapi_scraper.yml';
      mime = 'text/yaml';
    } else if (activeTab === 'vps') {
      filename = 'configuracion_vps_cron.sh';
      mime = 'text/x-sh';
    }

    const blob = new Blob([getCurrentContent()], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Código de Extracción & Automatización (ONAPI + Places + DGII)
                </h3>
                <p className="text-xs text-slate-400">
                  Script de Python, configuración para GitHub Actions y cron para servidor VPS
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 bg-slate-850 border-b border-slate-800 flex items-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'python'
                  ? 'bg-slate-950 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>1. Script Python (extractor.py)</span>
            </button>

            <button
              onClick={() => setActiveTab('github')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'github'
                  ? 'bg-slate-950 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              <span>2. GitHub Actions (Automático Gratis)</span>
            </button>

            <button
              onClick={() => setActiveTab('vps')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'vps'
                  ? 'bg-slate-950 text-white border-t-2 border-indigo-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Servidor VPS (Linux Cron)</span>
            </button>
          </div>

          {/* Actions Toolbar */}
          <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {activeTab === 'python' ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Google API Key:</span>
                <input
                  type="text"
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="Ingresa tu clave de Google Places"
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-emerald-400 w-64 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                {activeTab === 'github' && (
                  <span>
                    Archivo: <code className="text-indigo-400 font-mono">.github/workflows/onapi_scraper.yml</code>
                  </span>
                )}
                {activeTab === 'vps' && (
                  <span>
                    Frecuencia: <code className="text-amber-400 font-mono">Días 1 y 16 de cada mes (3:00 PM)</code>
                  </span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'python' && 'Descargar .py'}
                  {activeTab === 'github' && 'Descargar .yml'}
                  {activeTab === 'vps' && 'Descargar .sh'}
                </span>
              </button>
            </div>
          </div>

          {/* Code block */}
          <div className="p-6 bg-slate-950 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
            <pre className="whitespace-pre">{getCurrentContent()}</pre>
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            {activeTab === 'python' && <span>Requisitos: pip install pdfplumber requests pandas</span>}
            {activeTab === 'github' && <span>GitHub te da 2,000 minutos gratis mensuales para tareas programadas</span>}
            {activeTab === 'vps' && <span>Compatible con cualquier VPS Ubuntu, Debian, Centos o Fedora</span>}
            <span>Salida automática: nuevas_empresas_rd_completo.csv</span>
          </div>
        </div>
      </div>
    </div>
  );
};
