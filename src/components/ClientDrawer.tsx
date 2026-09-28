import React, { useState } from 'react';
import { Advisor, Client, ClientActivityNote } from '../types/client';
import {
  X,
  Building2,
  Mail,
  Phone,
  MapPin,
  Trash2,
  ExternalLink,
  FileText,
  Building,
  Send,
  MessageSquare,
} from 'lucide-react';

interface ClientDrawerProps {
  client: Client | null;
  onClose: () => void;
  onUpdateClient: (updated: Client) => void;
  onDeleteClient: (id: string) => void;
  advisors: Advisor[];
}

export const ClientDrawer: React.FC<ClientDrawerProps> = ({
  client,
  onClose,
  onUpdateClient,
  onDeleteClient,
}) => {
  if (!client) return null;

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteType, setNewNoteType] = useState<ClientActivityNote['type']>('llamada');
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: ClientActivityNote = {
      id: 'note-' + Date.now(),
      author: 'Usuario',
      content: newNoteText.trim(),
      createdAt: new Date().toISOString(),
      type: newNoteType,
    };

    const updated: Client = {
      ...client,
      notes: [newNote, ...client.notes],
    };

    onUpdateClient(updated);
    setNewNoteText('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!client.tags.includes(cleanTag)) {
        onUpdateClient({
          ...client,
          tags: [...client.tags, cleanTag],
        });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateClient({
      ...client,
      tags: client.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar a la empresa ${client.name}?`)) {
      onDeleteClient(client.id);
      onClose();
    }
  };

  const phoneValid = client.phone && client.phone !== 'No disponible';
  const cleanPhone = phoneValid ? client.phone.replace(/[^0-9]/g, '') : '';
  const whatsappPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;

  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
    `Saludos cordiales, le escribo respecto al registro de ${client.name} en el boletín de ONAPI. Quisiéramos presentarle nuestros servicios de apoyo corporativo.`
  )}`;

  const mapsUrl =
    client.places?.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${client.name}, Republica Dominicana`
    )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  {client.dgii?.siglas || 'S.R.L.'}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-mono text-slate-500">
                  {client.onapi?.registroNo ? `Solicitud ONAPI: ${client.onapi.registroNo}` : `ID: ${client.id}`}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {client.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">
                  {client.position || 'Titular del Registro'}
                </span>
                <span className="text-slate-300">·</span>
                <span>{client.provincia || client.city}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action CTA Bar */}
          <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {phoneValid && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}

              {phoneValid && (
                <a
                  href={`tel:${client.phone}`}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Llamar</span>
                </a>
              )}

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Google Maps</span>
              </a>
            </div>

            <button
              onClick={handleDelete}
              title="Eliminar empresa"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* SECCIÓN 1: Datos Extraídos de ONAPI */}
            <div className="p-4 bg-amber-50/40 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Etapa 1: Datos del Boletín ONAPI</span>
              </div>

              <div className="text-xs space-y-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold uppercase block mb-1">
                    Actividad Comercial Declarada:
                  </span>
                  <p className="text-slate-800 bg-white p-3 rounded-lg border border-amber-100 leading-relaxed font-sans">
                    {client.onapi?.descripcionActividad || client.industry || 'No especificada'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                  <span>Solicitante: <strong>{client.position}</strong></span>
                  <span>Boletín: <strong>{client.onapi?.fechaPublicacion || 'Ordinario 2026'}</strong></span>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: Contacto Google Places */}
            <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-blue-700" />
                <span>Etapa 2: Contacto Google Places (RD)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-white border border-blue-100 rounded-lg">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Teléfono Corporativo</span>
                  <span className="font-mono text-slate-900 font-bold">
                    {client.phone}
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-blue-100 rounded-lg">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Municipio / Provincia</span>
                  <span className="text-slate-800 font-medium">
                    {client.provincia || client.city}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-blue-100 rounded-lg text-xs">
                <span className="text-[11px] text-slate-400 block mb-0.5">Dirección Física Exacta</span>
                <span className="text-slate-800 leading-snug">
                  {client.places?.direccionExacta || `${client.city}, República Dominicana`}
                </span>
              </div>
            </div>

            {/* SECCIÓN 3: Clasificación Fiscal DGII */}
            <div className="p-4 bg-purple-50/40 border border-purple-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wide">
                <Building className="w-4 h-4 text-purple-700" />
                <span>Etapa 3: Clasificación Fiscal DGII</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-white border border-purple-100 rounded-lg">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Tipo de Sociedad</span>
                  <span className="font-semibold text-slate-900">
                    {client.dgii?.tipoSociedad || 'Sociedad de Responsabilidad Limitada (S.R.L.)'}
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-purple-100 rounded-lg">
                  <span className="text-[11px] text-slate-400 block mb-0.5">RNC Estimado</span>
                  <span className="font-mono font-bold text-slate-900">
                    {client.dgii?.rnc || 'En Proceso'}
                  </span>
                </div>
              </div>
            </div>

            {/* Etiquetas */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Etiquetas / Categorías
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="+ Agregar tag (Enter)"
                  className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
                />
              </div>
            </div>

            {/* Activity History & Note Logging */}
            <div className="pt-3 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Notas y Registro ({client.notes.length})
              </h3>

              {/* Note Composer */}
              <form onSubmit={handleAddNote} className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[11px] text-slate-500 mr-1">Tipo:</span>
                  {(['llamada', 'whatsapp', 'correo', 'reunion', 'nota'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewNoteType(type)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer capitalize ${
                        newNoteType === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder={`Registrar nota o acuerdo sobre ${client.name}...`}
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Guardar nota</span>
                  </button>
                </div>
              </form>

              {/* Timeline Items */}
              <div className="space-y-2.5">
                {client.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-white border border-slate-200 rounded-lg text-xs relative pl-4 border-l-4 border-l-indigo-500"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800 capitalize">
                        {note.type} · {note.author}
                      </span>
                      <span className="font-mono tabular-nums">
                        {new Date(note.createdAt).toLocaleString('es-DO', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
