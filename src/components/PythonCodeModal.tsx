import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2, Download } from 'lucide-react';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey?: string;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  apiKey = 'TU_API_KEY_DE_GOOGLE_AQUI',
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const [customKey, setCustomKey] = useState(apiKey);

  const pythonScript = `import pdfplumber
import re
import requests
import pandas as pd
import time

# ==========================================
# CONFIGURACIÓN Y CREDENCIALES
# ==========================================
GOOGLE_API_KEY = "${customKey || 'TU_API_KEY_DE_GOOGLE_AQUI'}"
ARCHIVO_PDF = "boletin_onapi.pdf"

# ==========================================
# ETAPA 1: EXTRACCIÓN DEL PDF DE ONAPI
# ==========================================
def extraer_datos_onapi(ruta_pdf):
    empresas_extraidas = []
    
    print("[+] Abriendo boletín de ONAPI...")
    with pdfplumber.open(ruta_pdf) as pdf:
        # Iteramos por las páginas del boletín
        for i, pagina in enumerate(pdf.pages):
            texto = pagina.extract_text()
            if not texto:
                continue
                
            # Expresiones regulares adaptadas a la estructura estándar de ONAPI
            bloques_nombre = re.findall(r"Denominación:\\s*(.*?)\\n", texto, re.IGNORECASE)
            bloques_actividad = re.findall(r"Actividad:\\s*(.*?)\\n", texto, re.IGNORECASE)
            
            # Sincronizamos las capturas de la página
            for nombre, actividad in zip(bloques_nombre, bloques_actividad):
                nombre_limpio = nombre.strip().upper()
                if nombre_limpio:
                    empresas_extraidas.append({
                        "nombre_comercial": nombre_limpio,
                        "descripcion_actividad": actividad.strip()
                    })
            
            if i % 10 == 0 and i > 0:
                print(f"    - Procesadas {i} páginas...")
                
    print(f"[✓] Extracción de ONAPI completada. Se encontraron {len(empresas_extraidas)} registros.")
    return empresas_extraidas

# ==========================================
# ETAPA 2: ENRIQUECIMIENTO CON GOOGLE PLACES (Teléfono y Ubicación)
# ==========================================
def obtener_contacto_google(nombre_empresa):
    # Restringimos la búsqueda a República Dominicana (DO)
    url_busqueda = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    parametros = {
        "query": f"{nombre_empresa}, Republica Dominicana",
        "key": GOOGLE_API_KEY
    }
    
    try:
        respuesta = requests.get(url_busqueda, params=parametros).json()
        resultados = respuesta.get("results", [])
        
        if resultados:
            primer_resultado = resultados[0]
            place_id = primer_resultado.get("place_id")
            direccion = primer_resultado.get("formatted_address", "No disponible")
            
            # Place Details para extraer teléfono corporativo
            url_detalles = "https://maps.googleapis.com/maps/api/place/details/json"
            parametros_detalles = {
                "place_id": place_id,
                "fields": "international_phone_number,formatted_phone_number",
                "key": GOOGLE_API_KEY
            }
            res_detalles = requests.get(url_detalles, params=parametros_detalles).json()
            datos_empresa = res_detalles.get("result", {})
            
            telefono = datos_empresa.get("formatted_phone_number", "No disponible")
            return direccion, telefono
            
    except Exception as e:
        print(f"[-] Error consultando Google Places para {nombre_empresa}: {e}")
        
    return "No disponible", "No disponible"

# ==========================================
# ETAPA 3: ENRIQUECIMIENTO FISCAL (Tipo de Empresa vía RNC / DGII)
# ==========================================
def obtener_tipo_empresa_dgii(nombre_empresa):
    nombre_lower = nombre_empresa.lower()
    
    if "s.r.l" in nombre_lower or "srl" in nombre_lower:
        return "Sociedad de Responsabilidad Limitada (S.R.L.)"
    elif "s.a.s" in nombre_lower or "sas" in nombre_lower:
        return "Sociedad Anónima Simplificada (S.A.S.)"
    elif "e.i.r.l" in nombre_lower or "eirl" in nombre_lower:
        return "Empresa Individual de Responsabilidad Limitada (E.I.R.L.)"
    elif "s.a" in nombre_lower or " sa " in nombre_lower:
        return "Sociedad Anónima (S.A.)"
    else:
        return "Pendiente de constitución / Persona Física"

# ==========================================
# EJECUCIÓN PRINCIPAL DEL PIPELINE
# ==========================================
if __name__ == "__main__":
    # 1. Extraer datos base de ONAPI
    lista_empresas = extraer_datos_onapi(ARCHIVO_PDF)
    
    datos_finales = []
    print("[+] Iniciando fase de enriquecimiento externo...")
    
    for empresa in lista_empresas:
        nombre = empresa["nombre_comercial"]
        print(f"    -> Enriqueciendo: {nombre}")
        
        # Consultar ubicación y teléfono en Google Maps
        direccion, telefono = obtener_contacto_google(nombre)
        
        # Consultar tipo de sociedad legal
        tipo_sociedad = obtener_tipo_empresa_dgii(nombre)
        
        datos_finales.append({
            "Nombre Comercial": nombre,
            "Tipo de Empresa": tipo_sociedad,
            "Descripción Actividad": empresa["descripcion_actividad"],
            "Teléfono": telefono,
            "Dirección": direccion
        })
        
        time.sleep(0.5) # Rate limiting
        
    # 2. Exportar resultados consolidados a CSV para el negocio
    df = pd.DataFrame(datos_finales)
    df.to_csv("nuevas_empresas_rd_completo.csv", index=False, encoding="utf-8-sig")
    print("[✓] ¡Proceso terminado con éxito! Guardado en 'nuevas_empresas_rd_completo.csv'")
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pipeline_onapi_rd.py';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <Code2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Código Python del Pipeline (pdfplumber + Places + DGII)
                </h3>
                <p className="text-xs text-slate-400">
                  Script ejecutable localmente para procesar boletines PDF masivos de ONAPI
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

          {/* Configuration toolbar */}
          <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>

              <button
                onClick={handleDownloadPy}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .py</span>
              </button>
            </div>
          </div>

          {/* Code block */}
          <div className="p-6 bg-slate-950 max-h-[60vh] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
            <pre className="whitespace-pre">{pythonScript}</pre>
          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Requisitos: pip install pdfplumber requests pandas</span>
            <span>Salida automática: nuevas_empresas_rd_completo.csv</span>
          </div>
        </div>
      </div>
    </div>
  );
};
