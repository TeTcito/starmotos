// src/components/mobile/gps/GpsViewMobile.tsx
import React, { useState, useMemo } from 'react';
import {
  Menu,
  X,
  Inbox,
  History,
  Building2,
  LogOut,
  Search,
  KeyRound,
  CheckCircle2,
  Clock,
  Radio,
  Bike,
  Smartphone,
  Phone,
  Calendar,
  Copy,
  Check,
  Cpu,
  MapPin,
  MessageCircle,
  Eye,
  EyeOff,
  Camera,
  Save,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GpsRecord, GpsProfile, GpsSection } from '../../../types/customer';
import { GpsCredentialModal } from '../../common/GpsCredentialModal';

interface Props {
  activeSection: GpsSection;
  setActiveSection: (section: GpsSection) => void;
  records: GpsRecord[];
  pendingRequests: GpsRecord[];
  activeRequests: GpsRecord[];
  profile: GpsProfile;
  onUpdateProfile: (updated: GpsProfile) => void;
  onLogout: () => void;
  onAssignCredentials: (recordId: string, user: string, pass: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GpsViewMobile: React.FC<Props> = ({
  activeSection,
  setActiveSection,
  records,
  pendingRequests,
  activeRequests,
  profile,
  onUpdateProfile,
  onLogout,
  onAssignCredentials,
  showToast,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordForReview, setSelectedRecordForReview] = useState<GpsRecord | null>(null);
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<GpsRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswordId, setRevealedPasswordId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Formulario de perfil móvil
  const [profileForm, setProfileForm] = useState<GpsProfile>({
    fullName: profile.fullName || 'Operador GPS Central',
    email: profile.email || 'gps@starmotos.ec',
    phone: profile.phone || '0990000000',
    roleTitle: profile.roleTitle || 'Especialista en Monitoreo Satelital',
    companyName: profile.companyName || 'StarMotos GPS Central',
  });

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    showToast?.('Perfil actualizado exitosamente', 'success');
  };

  // Filtrado de solicitudes pendientes
  const filteredPending = useMemo(() => {
    if (!searchTerm.trim()) return pendingRequests;
    const q = searchTerm.toLowerCase().trim();
    return pendingRequests.filter((r) => {
      const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
      const phones = `${r.celular1} ${r.celular2 || ''} ${r.celular3 || ''}`.toLowerCase();
      return (
        clientFull.includes(q) ||
        r.cedulaRuc.toLowerCase().includes(q) ||
        r.placa.toLowerCase().includes(q) ||
        r.modeloMarca.toLowerCase().includes(q) ||
        r.ticketNumber.toLowerCase().includes(q) ||
        r.serieGps.toLowerCase().includes(q) ||
        r.serieChip.toLowerCase().includes(q) ||
        (r.sede || '').toLowerCase().includes(q) ||
        phones.includes(q)
      );
    });
  }, [pendingRequests, searchTerm]);

  // Filtrado de historial
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return activeRequests;
    const q = searchTerm.toLowerCase().trim();
    return activeRequests.filter((r) => {
      const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
      const phones = `${r.celular1} ${r.celular2 || ''} ${r.celular3 || ''}`.toLowerCase();
      return (
        clientFull.includes(q) ||
        r.cedulaRuc.toLowerCase().includes(q) ||
        r.placa.toLowerCase().includes(q) ||
        r.modeloMarca.toLowerCase().includes(q) ||
        r.ticketNumber.toLowerCase().includes(q) ||
        r.serieGps.toLowerCase().includes(q) ||
        r.serieChip.toLowerCase().includes(q) ||
        (r.gpsUser || '').toLowerCase().includes(q) ||
        (r.sede || '').toLowerCase().includes(q) ||
        phones.includes(q)
      );
    });
  }, [activeRequests, searchTerm]);

  // Enviar mensaje de WhatsApp
  const handleSendWhatsApp = (record: GpsRecord) => {
    const rawPhone = (record.celular1 || record.celular2 || record.celular3 || '').replace(/\D/g, '');
    if (!rawPhone) {
      showToast?.('El cliente no tiene un número celular registrado.', 'error');
      return;
    }
    const cleanPhone = rawPhone.startsWith('593')
      ? rawPhone
      : rawPhone.startsWith('0')
      ? `593${rawPhone.slice(1)}`
      : `593${rawPhone}`;

    const text = encodeURIComponent(
      `Hola *${record.nombres}*, te saludamos de *StarMotos GPS Central*. 🛰️\n\n` +
      `Tu servicio de monitoreo satelital GPS para tu moto *${record.modeloMarca}* (Placa: *${record.placa}*) ya ha sido ACTIVADO.\n\n` +
      `Tus credenciales de acceso son:\n` +
      `👤 *Usuario:* ${record.gpsUser || 'Pendiente'}\n` +
      `🔑 *Contraseña:* ${record.gpsPassword || 'Pendiente'}\n` +
      `📅 *Vigencia hasta:* ${record.fechaVencimiento}\n\n` +
      `Si requieres asistencia técnica de rastreo, comunícate con nosotros.\n¡Gracias por confiar en StarMotos!`
    );

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const menuItems: { id: GpsSection; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'solicitudes_gps',
      label: 'Bandeja de Entrada',
      icon: <Inbox className="w-4 h-4" />,
      badge: pendingRequests.length > 0 ? `${pendingRequests.length}` : undefined,
    },
    {
      id: 'historial_gps',
      label: 'Historial',
      icon: <History className="w-4 h-4" />,
      badge: activeRequests.length > 0 ? `${activeRequests.length}` : undefined,
    },
    {
      id: 'perfil_gps',
      label: 'Mi Perfil',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  const sectionTitles: Record<GpsSection, string> = {
    solicitudes_gps: 'Bandeja de Entrada',
    historial_gps: 'Historial',
    perfil_gps: 'Mi Perfil',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 font-sans antialiased flex flex-col pb-16">
      {/* 1. HEADER MÓVIL ESTILO GARANTE */}
      <header className="sticky top-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-white px-2 py-0.5 rounded-lg shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-5 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-cyan-200 font-mono font-bold uppercase">GPS</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white truncate max-w-[140px]">
            {sectionTitles[activeSection]}
          </span>
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            title="Salir"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. DRAWER LATERAL DE NAVEGACIÓN */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between shadow-2xl z-10 p-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#b8d1ea]">
                <div className="min-w-0 flex-1 pr-2">
                  <span className="text-xs font-bold text-zinc-900 truncate block">
                    {profile.fullName || 'Operador GPS'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0" />
                    <span className="text-[10px] text-cyan-900 font-bold truncate">
                      {profile.roleTitle || 'Soporte GPS Oficial'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg bg-white text-zinc-600 shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="mt-4 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-2 py-0.5 block">
                  Módulos GPS
                </span>
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                      activeSection === item.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-zinc-800 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={activeSection === item.id ? 'text-white' : 'text-blue-700'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && item.badge !== '' && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          activeSection === item.id
                            ? 'bg-white text-blue-700'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-3 border-t border-[#b8d1ea]">
              <button
                type="button"
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100/70 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-600" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. CONTENIDO PRINCIPAL MÓVIL */}
      <div className="p-3.5 space-y-3.5 flex-1">
        {/* MÓDULO 1: BANDEJA DE ENTRADA */}
        {activeSection === 'solicitudes_gps' && (
          <div className="space-y-3">
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, placa, IMEI o sede..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {/* Listado de Solicitudes Pendientes */}
            {filteredPending.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-xs">
                <Inbox className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                <h3 className="text-xs font-bold text-zinc-700">Sin solicitudes pendientes</h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {searchTerm.trim() ? 'No hay coincidencias.' : 'Todas las solicitudes han sido aprobadas.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPending.map((record) => {
                  const hasPhotos = record.fotos && record.fotos.length > 0;
                  return (
                    <div
                      key={record.id}
                      className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs space-y-3"
                    >
                      {/* Cabecera */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-zinc-100">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-bold text-[11px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {record.ticketNumber}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                              <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                              <span>{record.sede || 'Matriz'}</span>
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-zinc-900 mt-1">
                            {record.nombres} {record.apellidos}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            C.I. {record.cedulaRuc}
                          </span>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          Pendiente
                        </span>
                      </div>

                      {/* Teléfonos con enlace a WhatsApp */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-zinc-400 block tracking-wider">
                          Celular Cliente
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <a
                            href={`https://api.whatsapp.com/send?phone=593${record.celular1.replace(/\D/g, '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>📱 {record.celular1}</span>
                          </a>
                          {record.celular2 && (
                            <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                              📞 {record.celular2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Motocicleta y Hardware */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                        <div>
                          <span className="text-zinc-400 text-[9px] uppercase font-bold block">Moto:</span>
                          <strong className="text-zinc-900 block truncate">{record.modeloMarca}</strong>
                          <span className="text-zinc-600 font-mono text-[10px]">Placa: {record.placa}</span>
                        </div>
                        <div>
                          <span className="text-cyan-900 text-[9px] uppercase font-bold block">GPS IMEI:</span>
                          <strong className="text-zinc-900 font-mono text-[10px] block truncate">{record.serieGps}</strong>
                          <span className="text-zinc-500 font-mono text-[10px]">SIM: {record.serieChip}</span>
                        </div>
                      </div>

                      {/* Fotos de Instalación */}
                      {hasPhotos && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-zinc-500 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-cyan-600" />
                            <span>Fotos de Instalación ({record.fotos!.length}):</span>
                          </span>
                          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                            {record.fotos!.map((foto, idx) => (
                              <img
                                key={idx}
                                src={foto}
                                alt={`Evidencia ${idx + 1}`}
                                className="w-11 h-11 rounded-lg object-cover border border-zinc-200 shrink-0"
                                onClick={() => setPreviewImage(foto)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Acciones */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForReview(record)}
                          className="flex-1 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl transition active:scale-95"
                        >
                          Ver Ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForAssign(record)}
                          className="flex-1 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Revisar & Aceptar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MÓDULO 2: HISTORIAL */}
        {activeSection === 'historial_gps' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en el historial..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
              />
            </div>

            {filteredHistory.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center shadow-xs">
                <History className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                <h3 className="text-xs font-bold text-zinc-700">Sin registros en el historial</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((record) => {
                  const isRevealed = revealedPasswordId === record.id;
                  return (
                    <div
                      key={record.id}
                      className="bg-white border border-zinc-200 rounded-2xl p-3.5 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between pb-2 border-b border-zinc-100">
                        <div>
                          <span className="font-mono font-bold text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                            {record.ticketNumber}
                          </span>
                          <h4 className="text-xs font-black text-zinc-900 mt-1">
                            {record.nombres} {record.apellidos}
                          </h4>
                          <span className="text-[10px] text-zinc-500">
                            {record.modeloMarca} • Placa: <strong className="font-mono">{record.placa}</strong>
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                          <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                          <span>{record.sede || 'Matriz'}</span>
                        </span>
                      </div>

                      {/* Credenciales */}
                      <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-200 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500">Usuario Satelital:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-zinc-900">
                            <span>{record.gpsUser || 'Sin usuario'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(record.gpsUser || '', `mu-${record.id}`)}
                              className="p-1 hover:bg-zinc-200 rounded"
                            >
                              {copiedId === `mu-${record.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-zinc-400" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500">Contraseña:</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-zinc-900">
                            <span>{isRevealed ? record.gpsPassword : '••••••••'}</span>
                            <button
                              type="button"
                              onClick={() => setRevealedPasswordId(isRevealed ? null : record.id)}
                              className="p-1 hover:bg-zinc-200 rounded text-zinc-400"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyText(record.gpsPassword || '', `mp-${record.id}`)}
                              className="p-1 hover:bg-zinc-200 rounded"
                            >
                              {copiedId === `mp-${record.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-zinc-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Botón WhatsApp */}
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordForReview(record)}
                          className="flex-1 py-2 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-xl active:scale-95"
                        >
                          Ficha
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWhatsApp(record)}
                          className="flex-2 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MÓDULO 3: MI PERFIL */}
        {activeSection === 'perfil_gps' && (
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-xl bg-cyan-700 text-white font-black text-lg flex items-center justify-center border-2 border-cyan-500 shadow-xs shrink-0">
                {(profileForm.fullName || 'GPS')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-black text-zinc-900">Perfil del Operador</h3>
                <p className="text-[10px] text-zinc-500">Configuración de cuenta satelital</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                  Teléfono / Celular
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-700 mb-1">
                  Cargo Oficial
                </label>
                <input
                  type="text"
                  value={profileForm.roleTitle}
                  onChange={(e) => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Perfil</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL DE FICHA COMPLETA (MÓVIL) */}
      {selectedRecordForReview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setSelectedRecordForReview(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-700 to-cyan-800 text-white p-3.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-[10px] text-cyan-200 bg-white/20 px-1.5 py-0.2 rounded">
                  {selectedRecordForReview.ticketNumber}
                </span>
                <h4 className="text-xs font-black text-white mt-0.5">
                  {selectedRecordForReview.nombres} {selectedRecordForReview.apellidos}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="p-1 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-500 block">Cliente</span>
                <div>C.I.: <strong className="font-mono">{selectedRecordForReview.cedulaRuc}</strong></div>
                <div>Celular: <strong className="font-mono text-emerald-700">{selectedRecordForReview.celular1}</strong></div>
                {selectedRecordForReview.sede && <div>Sede: <strong className="text-cyan-800">{selectedRecordForReview.sede}</strong></div>}
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <span className="text-[9px] font-black uppercase text-blue-900 block">Moto</span>
                <div>Modelo: <strong>{selectedRecordForReview.modeloMarca}</strong></div>
                <div>Placa: <strong className="font-mono">{selectedRecordForReview.placa}</strong></div>
                <div>VIN: <span className="font-mono text-[10px] text-zinc-600">{selectedRecordForReview.chasis}</span></div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <span className="text-[9px] font-black uppercase text-cyan-900 block">Dispositivo GPS</span>
                <div>IMEI: <strong className="font-mono text-cyan-950">{selectedRecordForReview.serieGps}</strong></div>
                <div>SIM: <strong className="font-mono text-zinc-800">{selectedRecordForReview.serieChip}</strong></div>
                <div>Vigencia: <span className="font-mono text-[10px]">{selectedRecordForReview.fechaInicio} al {selectedRecordForReview.fechaVencimiento}</span></div>
              </div>

              {selectedRecordForReview.fotos && selectedRecordForReview.fotos.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-zinc-100">
                  <span className="text-[9px] font-black uppercase text-zinc-500 block">
                    Fotos de Instalación ({selectedRecordForReview.fotos.length}):
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {selectedRecordForReview.fotos.map((foto, idx) => (
                      <img
                        key={idx}
                        src={foto}
                        alt={`Evidencia ${idx + 1}`}
                        className="w-full aspect-square rounded-lg object-cover border border-zinc-200"
                        onClick={() => setPreviewImage(foto)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="flex-1 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl"
              >
                Cerrar
              </button>
              {selectedRecordForReview.estado === 'pendiente' && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedRecordForReview;
                    setSelectedRecordForReview(null);
                    setSelectedRecordForAssign(rec);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl shadow-xs flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Aceptar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN DE CREDENCIALES */}
      <GpsCredentialModal
        isOpen={Boolean(selectedRecordForAssign)}
        onClose={() => setSelectedRecordForAssign(null)}
        record={selectedRecordForAssign}
        onAssign={(recordId, user, pass) => {
          onAssignCredentials(recordId, user, pass);
          setSelectedRecordForAssign(null);
          confetti({
            particleCount: 60,
            spread: 50,
            origin: { y: 0.7 },
          });
        }}
      />

      {/* MODAL VISOR DE FOTO */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-sm max-h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImage}
              alt="Evidencia en tamaño completo"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
