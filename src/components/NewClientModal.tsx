import React, { useState } from 'react';
import { Advisor, Client, TipoSociedadRD } from '../types/client';
import { X, Sparkles, UserPlus, Building2, Phone, MapPin } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: Client) => void;
  advisors: Advisor[];
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [actividad, setActividad] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [direccion, setDireccion] = useState('');
  const [provincia, setProvincia] = useState('Distrito Nacional');
  const [tipoSociedad, setTipoSociedad] = useState<TipoSociedadRD>('Sociedad de Responsabilidad Limitada (S.R.L.)');
  const [rnc, setRnc] = useState('132-88102-4');
  const [tagsInput, setTagsInput] = useState('ONAPI RD, S.R.L.');
  const [initialNote, setInitialNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillDemo = () => {
    const demos = [
      {
        name: 'INVERSIONES CARIBE AZUL S.R.L.',
        position: 'Lic. Andrés Peña Gómez',
        actividad: 'DESARROLLO DE PROYECTOS INMOBILIARIOS TURISTICOS, VENTA DE TERRENOS Y ADMINISTRACION DE FONDOS DE CAPITAL.',
        email: 'info@caribeazul.com.do',
        phone: '(809) 541-9988',
        direccion: 'Av. Winston Churchill No. 1099, Piantini, Distrito Nacional',
        provincia: 'Distrito Nacional',
        tipoSociedad: 'Sociedad de Responsabilidad Limitada (S.R.L.)' as TipoSociedadRD,
        rnc: '132-77441-2',
        tags: 'ONAPI RD, S.R.L., Inmobiliaria',
        note: 'Registrado en Boletín de ONAPI. Ubicado en Piantini.',
      },
      {
        name: 'TECH DOMINICANA SOFTWARE S.A.S.',
        position: 'Ing. Laura Valenzuela',
        actividad: 'DESARROLLO DE PLATAFORMAS WEB, FACTURACION ELECTRONICA DGII Y APLICACIONES MOVILES.',
        email: 'contacto@techdom.com.do',
        phone: '(809) 582-4411',
        direccion: 'Calle Los Cedros No. 22, Los Jardines, Santiago de los Caballeros',
        provincia: 'Santiago',
        tipoSociedad: 'Sociedad Anónima Simplificada (S.A.S.)' as TipoSociedadRD,
        rnc: '132-90123-5',
        tags: 'ONAPI RD, S.A.S., Software',
        note: 'Sede en Santiago. Solicitud de nombre comercial para servicios tecnológicos.',
      },
    ];

    const pick = demos[Math.floor(Math.random() * demos.length)];
    setName(pick.name);
    setPosition(pick.position);
    setActividad(pick.actividad);
    setEmail(pick.email);
    setPhone(pick.phone);
    setDireccion(pick.direccion);
    setProvincia(pick.provincia);
    setTipoSociedad(pick.tipoSociedad);
    setRnc(pick.rnc);
    setTagsInput(pick.tags);
    setInitialNote(pick.note);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Por favor completa la Denominación Comercial.');
      return;
    }

    let siglas: 'S.R.L.' | 'S.A.S.' | 'E.I.R.L.' | 'S.A.' | 'Persona Física' = 'S.R.L.';
    if (tipoSociedad.includes('S.R.L.')) siglas = 'S.R.L.';
    else if (tipoSociedad.includes('S.A.S.')) siglas = 'S.A.S.';
    else if (tipoSociedad.includes('E.I.R.L.')) siglas = 'E.I.R.L.';
    else if (tipoSociedad.includes('S.A.')) siglas = 'S.A.';
    else siglas = 'Persona Física';

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter((t) => t.length > 0);

    const newClient: Client = {
      id: `onapi-${Date.now().toString().slice(-4)}`,
      name: name.trim().toUpperCase(),
      company: name.trim().toUpperCase(),
      position: position.trim() || 'Titular ONAPI',
      email: email.trim() || 'contacto@empresa.com.do',
      phone: phone.trim() || '(809) 000-0000',
      city: provincia,
      country: 'República Dominicana',
      provincia,
      createdAt: new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['ONAPI RD', siglas],
      industry: actividad.trim() || 'Actividad comercial registrada',
      onapi: {
        denominacion: name.trim().toUpperCase(),
        descripcionActividad: actividad.trim() || 'Registro de nombre comercial en boletín oficial',
        solicitante: position.trim() || 'Titular',
        registroNo: `2026-${Math.floor(1000 + Math.random() * 9000)}`,
        fechaPublicacion: new Date().toLocaleDateString('es-DO'),
      },
      places: {
        encontrado: true,
        direccionExacta: direccion.trim() || `${provincia}, República Dominicana`,
        telefonoCorporativo: phone.trim() || '(809) 000-0000',
        municipio: provincia,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${name.trim()}, Republica Dominicana`
        )}`,
      },
      dgii: {
        tipoSociedad,
        siglas,
        rnc: rnc.trim() || 'En Proceso',
        estadoTributario: 'Activo',
      },
      notes: initialNote.trim()
        ? [
            {
              id: `note-${Date.now()}`,
              author: 'Registro Manual',
              content: initialNote.trim(),
              createdAt: new Date().toISOString(),
              type: 'nota',
            },
          ]
        : [],
    };

    onAddClient(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Registrar Nueva Empresa (ONAPI RD)
                </h3>
                <p className="text-xs text-slate-500">
                  Ingreso directo de expediente comercial con datos de ONAPI, Places y DGII
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ejemplo RD</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {errorMsg}
              </div>
            )}

            {/* Row 1: Nombre & Solicitante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Denominación Comercial (ONAPI) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. AGROLOGISTICA DOMINICANA S.R.L."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Solicitante / Representante
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ej. Carlos Ramón Peña Guzmán"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Actividad Comercial */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción de Actividad Comercial (ONAPI)
              </label>
              <textarea
                value={actividad}
                onChange={(e) => setActividad(e.target.value)}
                placeholder="Ej. SERVICIOS INTEGRALES DE TRANSPORTE REFRIGERADO Y DISTRIBUCION..."
                rows={2}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Row 2: Tipo DGII & RNC */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Empresa (DGII)
                </label>
                <select
                  value={tipoSociedad}
                  onChange={(e) => setTipoSociedad(e.target.value as TipoSociedadRD)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="Sociedad de Responsabilidad Limitada (S.R.L.)">Sociedad de Responsabilidad Limitada (S.R.L.)</option>
                  <option value="Sociedad Anónima Simplificada (S.A.S.)">Sociedad Anónima Simplificada (S.A.S.)</option>
                  <option value="Empresa Individual de Responsabilidad Limitada (E.I.R.L.)">Empresa Individual de Responsabilidad Limitada (E.I.R.L.)</option>
                  <option value="Sociedad Anónima (S.A.)">Sociedad Anónima (S.A.)</option>
                  <option value="Pendiente de constitución / Persona Física">Pendiente de constitución / Persona Física</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RNC Estimado
                </label>
                <input
                  type="text"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                  placeholder="132-XXXXX-X"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            {/* Row 3: Teléfono Places & Provincia */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teléfono (Google Places)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(809) 567-4420"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provincia / Zona
                </label>
                <input
                  type="text"
                  value={provincia}
                  onChange={(e) => setProvincia(e.target.value)}
                  placeholder="Distrito Nacional / Santiago / Punta Cana"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@empresa.com.do"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Dirección exacta */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dirección Física Exacta (Places)
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. Luperón No. 102, Herrera, Santo Domingo Oeste"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Guardar Empresa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
