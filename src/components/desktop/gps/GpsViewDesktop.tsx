// src/components/desktop/gps/GpsViewDesktop.tsx
import React, { useState, useMemo } from 'react';
import {
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
  ShieldCheck,
  Cpu,
  Mail,
  MapPin,
  ExternalLink,
  MessageCircle,
  Eye,
  EyeOff,
  Sparkles,
  Camera,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  User,
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

export const GpsViewDesktop: React.FC<Props> = ({
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecordForReview, setSelectedRecordForReview] = useState<GpsRecord | null>(null);
  const [selectedRecordForAssign, setSelectedRecordForAssign] = useState<GpsRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswordId, setRevealedPasswordId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Estado del formulario de Perfil
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

  // Filtrado de historial (solicitudes aprobadas/activas)
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

  // Enviar mensaje de WhatsApp al cliente con credenciales
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
      `Tus credenciales oficiales para la aplicación satelital son:\n` +
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
    solicitudes_gps: 'Bandeja de Entrada • Solicitudes GPS Pendientes de Aprobación',
    historial_gps: 'Historial Consolidado de Dispositivos GPS & Monitoreo Activo',
    perfil_gps: 'Mi Perfil de Operador Satelital GPS',
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-zinc-900 overflow-hidden font-sans antialiased selection:bg-cyan-600 selection:text-white">
      {/* 1. HEADER SUPERIOR OFICIAL (ESTILO GARANTE) */}
      <header className="h-16 shrink-0 w-full bg-blue-700 border-b border-blue-800 text-white shadow-md flex items-center justify-between px-6 z-30 select-none">
        <div className="w-72 shrink-0 flex items-center gap-3 pr-4">
          <div className="bg-white px-3 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
            <img
              src="/logoheader.webp"
              alt="StarMotos"
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-[10px] text-cyan-200 font-mono tracking-widest uppercase font-bold">
            GPS Oficial
          </span>
        </div>

        <div className="flex-1 flex items-center justify-between pl-6 border-l border-blue-600/60 min-w-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs text-blue-200 font-mono font-medium">GPS Servicios /</span>
            <h1 className="text-sm lg:text-base font-bold text-white tracking-tight truncate">
              {sectionTitles[activeSection]}
            </h1>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 border border-blue-600 text-xs text-cyan-100 font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                Monitoreo Oficial • {profile.companyName || 'StarMotos GPS'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold shadow-xs" title="Conectado en tiempo real con Supabase Cloud">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BD Nube Activa</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-200 text-white text-xs font-bold transition cursor-pointer border border-white/10"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY PRINCIPAL (SIDEBAR + CONTENIDO) */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* SIDEBAR IZQUIERDO (ESTILO GARANTE CON EXACTAMENTE 3 MÓDULOS) */}
        <aside className="w-72 shrink-0 h-full bg-[#dce8f5] border-r border-[#b8d1ea] flex flex-col justify-between z-20 select-none shadow-xs">
          {/* Info del Operador GPS */}
          <div className="shrink-0 p-4 border-b border-[#b8d1ea] bg-white/40">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-cyan-700 text-white font-black text-xs flex items-center justify-center border-2 border-cyan-600 shadow-xs shrink-0">
                {(profile.fullName || 'GPS')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-zinc-900 truncate" title={profile.fullName}>
                  {profile.fullName || 'Operador GPS Central'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 shrink-0" />
                  <span className="text-[10px] text-cyan-900 font-bold truncate">
                    {profile.roleTitle || 'Soporte GPS Oficial'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Menú de 3 Módulos */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950/70 px-3 py-1 block">
              Módulos GPS Servicios
            </span>
            {menuItems.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                      : 'text-slate-800 hover:bg-white/60 hover:text-blue-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-blue-700'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && item.badge !== '' && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                        active
                          ? 'bg-white text-blue-700'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-3 border-t border-[#b8d1ea] bg-white/20">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100/70 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-600" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          {/* MÓDULO 1: BANDEJA DE ENTRADA (SOLICITUDES PENDIENTES) */}
          {activeSection === 'solicitudes_gps' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Resumen & Buscador */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                    <h2 className="text-base font-black text-zinc-900">
                      Solicitudes de GPS Pendientes de Asignación
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Revise los datos técnicos del equipo instalado, motocicleta y cliente para generar las credenciales de la app satelital.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[280px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por cliente, placa, IMEI, chip o sede..."
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 shrink-0">
                    {filteredPending.length} Pendiente{filteredPending.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              {/* Lista / Cards de Solicitudes Pendientes */}
              {filteredPending.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
                  <Inbox className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                  <h3 className="text-sm font-bold text-zinc-700">No hay solicitudes pendientes en la bandeja</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    {searchTerm.trim()
                      ? 'No hay registros que coincidan con el término de búsqueda.'
                      : 'Todas las solicitudes enviadas por Matriz han sido revisadas y cuentan con credenciales activas.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredPending.map((record) => {
                    const hasPhotos = record.fotos && record.fotos.length > 0;
                    return (
                      <div
                        key={record.id}
                        className="bg-white border border-zinc-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all space-y-4 flex flex-col justify-between"
                      >
                        {/* Cabecera de la Solicitud */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {record.ticketNumber}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                <MapPin className="w-3 h-3 text-cyan-600" />
                                <span>{record.sede || 'Matriz'}</span>
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-zinc-900 mt-1.5">
                              {record.nombres} {record.apellidos}
                            </h3>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              C.I. {record.cedulaRuc} • Fecha: {record.fechaSolicitud}
                            </span>
                          </div>

                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pendiente</span>
                          </span>
                        </div>

                        {/* Teléfonos y Contacto (3 números) */}
                        <div className="bg-zinc-50/80 rounded-xl p-3 border border-zinc-100 space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">
                            Números de Celular del Cliente
                          </span>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={`https://api.whatsapp.com/send?phone=593${record.celular1.replace(/\D/g, '').replace(/^0/, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition"
                              title="Chatear por WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>📱 {record.celular1} (Principal)</span>
                            </a>
                            {record.celular2 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-white px-2 py-0.5 rounded-lg border border-zinc-200">
                                <span>📞 {record.celular2}</span>
                              </span>
                            )}
                            {record.celular3 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-700 bg-white px-2 py-0.5 rounded-lg border border-zinc-200">
                                <span>📞 {record.celular3}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detalles de la Motocicleta & Hardware GPS */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          {/* Moto */}
                          <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-200/80 space-y-1">
                            <span className="text-[10px] font-black uppercase text-blue-900 block flex items-center gap-1">
                              <Bike className="w-3 h-3 text-blue-600" />
                              <span>Motocicleta</span>
                            </span>
                            <div className="font-bold text-zinc-900 truncate">{record.modeloMarca}</div>
                            <div className="text-[11px] text-zinc-600">
                              Placa: <strong className="font-mono text-zinc-800">{record.placa}</strong>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono truncate" title={record.chasis}>
                              VIN: {record.chasis}
                            </div>
                          </div>

                          {/* Hardware GPS */}
                          <div className="bg-cyan-50/50 rounded-xl p-3 border border-cyan-200/80 space-y-1">
                            <span className="text-[10px] font-black uppercase text-cyan-900 block flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-cyan-600" />
                              <span>Dispositivo GPS</span>
                            </span>
                            <div className="text-[11px]">
                              <span className="text-zinc-500 text-[10px]">IMEI:</span>{' '}
                              <strong className="font-mono text-cyan-950 font-bold">{record.serieGps}</strong>
                            </div>
                            <div className="text-[11px]">
                              <span className="text-zinc-500 text-[10px]">SIM:</span>{' '}
                              <strong className="font-mono text-zinc-800">{record.serieChip}</strong>
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Vigencia: {record.fechaInicio} al {record.fechaVencimiento}
                            </div>
                          </div>
                        </div>

                        {/* Evidencias fotográficas / Instalación */}
                        {hasPhotos && (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-cyan-600" />
                                <span>Fotos de Instalación ({record.fotos!.length}):</span>
                              </span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {record.fotos!.map((foto, idx) => (
                                <img
                                  key={idx}
                                  src={foto}
                                  alt={`Evidencia ${idx + 1}`}
                                  className="w-12 h-12 rounded-lg object-cover border border-zinc-200 cursor-pointer hover:scale-105 transition shadow-2xs shrink-0"
                                  onClick={() => setPreviewImage(foto)}
                                  title="Clic para ver en tamaño completo"
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Botón de Acción Principal: Revisar y Aceptar */}
                        <div className="pt-2 flex items-center gap-2 border-t border-zinc-100">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordForReview(record)}
                            className="flex-1 py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-600" />
                            <span>Revisar Ficha Completa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedRecordForAssign(record)}
                            className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
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

          {/* MÓDULO 2: HISTORIAL (SOLICITUDES APROBADAS / ACTIVAS) */}
          {activeSection === 'historial_gps' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Cabecera del Historial */}
              <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-black text-zinc-900">
                      Historial Consolidado de Dispositivos GPS
                    </h2>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Consulte los accesos satelitales asignados, reenvíe credenciales por WhatsApp y revise la auditoría de cada unidad.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative min-w-[280px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar en el historial..."
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shrink-0">
                    {filteredHistory.length} Activo{filteredHistory.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              {/* Listado del Historial */}
              {filteredHistory.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
                  <Radio className="w-12 h-12 mx-auto text-zinc-300 mb-3 animate-pulse" />
                  <h3 className="text-sm font-bold text-zinc-700">No se encontraron dispositivos en el historial</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    Los dispositivos aprobados desde la Bandeja de Entrada aparecerán aquí con sus credenciales oficiales.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Ticket / Fecha</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">Motocicleta</th>
                          <th className="px-4 py-3">Sede</th>
                          <th className="px-4 py-3">Hardware GPS / SIM</th>
                          <th className="px-4 py-3">Usuario & Clave</th>
                          <th className="px-4 py-3 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 text-zinc-800">
                        {filteredHistory.map((record) => {
                          const isRevealed = revealedPasswordId === record.id;
                          return (
                            <tr key={record.id} className="hover:bg-blue-50/40 transition">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-max">
                                  {record.ticketNumber}
                                </span>
                                <span className="text-[10px] text-zinc-400 block mt-0.5">
                                  Aprobado: {record.fechaAprobacion || record.fechaSolicitud}
                                </span>
                              </td>

                              <td className="px-4 py-3 max-w-[180px]">
                                <span className="font-bold text-zinc-900 block truncate">
                                  {record.nombres} {record.apellidos}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono block">
                                  C.I. {record.cedulaRuc}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-mono block">
                                  📱 {record.celular1}
                                </span>
                              </td>

                              <td className="px-4 py-3 max-w-[180px]">
                                <span className="font-semibold text-zinc-900 block truncate">
                                  {record.modeloMarca}
                                </span>
                                <span className="font-mono font-bold text-zinc-700 text-[11px] block">
                                  Placa: {record.placa}
                                </span>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-900 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                                  <MapPin className="w-3 h-3 text-cyan-600" />
                                  <span>{record.sede || 'Matriz'}</span>
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                <div className="text-[11px]">
                                  <span className="text-zinc-400 text-[9px] uppercase font-bold">IMEI:</span>{' '}
                                  <span className="font-mono font-bold text-zinc-800">{record.serieGps}</span>
                                </div>
                                <div className="text-[11px]">
                                  <span className="text-zinc-400 text-[9px] uppercase font-bold">SIM:</span>{' '}
                                  <span className="font-mono text-zinc-600">{record.serieChip}</span>
                                </div>
                              </td>

                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-zinc-800 font-mono bg-zinc-100 px-2 py-0.5 rounded">
                                    👤 {record.gpsUser || 'Sin usuario'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(record.gpsUser || '', `u-${record.id}`)}
                                    className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                                    title="Copiar usuario"
                                  >
                                    {copiedId === `u-${record.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="text-[11px] font-mono text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
                                    🔑 {isRevealed ? record.gpsPassword : '••••••••'}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setRevealedPasswordId(isRevealed ? null : record.id)}
                                    className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                                    title={isRevealed ? 'Ocultar' : 'Ver clave'}
                                  >
                                    {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(record.gpsPassword || '', `p-${record.id}`)}
                                    className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                                    title="Copiar contraseña"
                                  >
                                    {copiedId === `p-${record.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendWhatsApp(record)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    title="Reenviar credenciales por WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedRecordForReview(record)}
                                    className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition cursor-pointer"
                                    title="Ver ficha técnica"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MÓDULO 3: MI PERFIL (EDITOR OFICIAL DE OPERADOR SATELITAL) */}
          {activeSection === 'perfil_gps' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-zinc-100">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-700 text-white font-black text-xl flex items-center justify-center border-2 border-cyan-500 shadow-sm shrink-0">
                    {(profileForm.fullName || 'GPS')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-zinc-900">Perfil del Operador GPS</h2>
                    <p className="text-xs text-zinc-500">
                      Configuración de la cuenta oficial para emisión y asignación de credenciales satelitales.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Nombre Completo del Operador
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      required
                      className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Teléfono / Celular
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Cargo / Título Oficial
                      </label>
                      <input
                        type="text"
                        value={profileForm.roleTitle}
                        onChange={(e) => setProfileForm({ ...profileForm, roleTitle: e.target.value })}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                        Empresa / Departamento
                      </label>
                      <input
                        type="text"
                        value={profileForm.companyName}
                        onChange={(e) => setProfileForm({ ...profileForm, companyName: e.target.value })}
                        className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Información de Perfil</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE REVISIÓN COMPLETA DE FICHA (SIN PRECIOS) */}
      {selectedRecordForReview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRecordForReview(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-blue-700 to-cyan-800 text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-cyan-200 bg-white/20 px-2 py-0.5 rounded">
                    {selectedRecordForReview.ticketNumber}
                  </span>
                  <span className="text-xs text-blue-200">
                    Sede: {selectedRecordForReview.sede || 'Matriz'}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  Ficha Técnica GPS: {selectedRecordForReview.nombres} {selectedRecordForReview.apellidos}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Sección Cliente */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-zinc-500 block tracking-wider">
                  Datos del Propietario
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Cédula / RUC</span>
                    <strong className="font-mono text-zinc-900">{selectedRecordForReview.cedulaRuc}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Celular Principal</span>
                    <strong className="font-mono text-emerald-700">{selectedRecordForReview.celular1}</strong>
                  </div>
                  {selectedRecordForReview.celular2 && (
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Celular Secundario</span>
                      <strong className="font-mono text-zinc-800">{selectedRecordForReview.celular2}</strong>
                    </div>
                  )}
                  {selectedRecordForReview.celular3 && (
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Celular Adicional</span>
                      <strong className="font-mono text-zinc-800">{selectedRecordForReview.celular3}</strong>
                    </div>
                  )}
                  {selectedRecordForReview.direccion && (
                    <div className="col-span-2">
                      <span className="text-zinc-400 block text-[10px]">Dirección</span>
                      <span className="text-zinc-700">{selectedRecordForReview.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Motocicleta */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-blue-900 block tracking-wider">
                  Datos de la Motocicleta
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Modelo / Marca</span>
                    <strong className="text-zinc-900">{selectedRecordForReview.modeloMarca}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Placa</span>
                    <strong className="font-mono text-zinc-900">{selectedRecordForReview.placa}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Chasis (VIN)</span>
                    <span className="font-mono text-zinc-700">{selectedRecordForReview.chasis}</span>
                  </div>
                  {selectedRecordForReview.numeroMotor && (
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Número de Motor</span>
                      <span className="font-mono text-zinc-700">{selectedRecordForReview.numeroMotor}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Dispositivo GPS & Vigencia */}
              <div className="bg-cyan-50/50 rounded-2xl p-4 border border-cyan-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-cyan-900 block tracking-wider">
                  Hardware GPS & Vigencia
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Serie GPS (IMEI)</span>
                    <strong className="font-mono text-cyan-950 font-bold">{selectedRecordForReview.serieGps}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Serie SIM (Chip)</span>
                    <strong className="font-mono text-zinc-900">{selectedRecordForReview.serieChip}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Fecha de Inicio</span>
                    <span className="font-mono text-zinc-700">{selectedRecordForReview.fechaInicio}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-[10px]">Fecha de Vencimiento</span>
                    <span className="font-mono text-zinc-700">{selectedRecordForReview.fechaVencimiento}</span>
                  </div>
                  {selectedRecordForReview.tecnicoResponsable && (
                    <div className="col-span-2">
                      <span className="text-zinc-400 block text-[10px]">Técnico Instalador Encargado</span>
                      <span className="font-semibold text-zinc-800">{selectedRecordForReview.tecnicoResponsable}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fotografías / Evidencias */}
              {selectedRecordForReview.fotos && selectedRecordForReview.fotos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block tracking-wider">
                    Fotografías Adjuntas ({selectedRecordForReview.fotos.length})
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedRecordForReview.fotos.map((foto, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-zinc-200 aspect-square group cursor-pointer"
                        onClick={() => setPreviewImage(foto)}
                      >
                        <img
                          src={foto}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/60 text-white px-1 rounded">
                          Foto #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForReview(null)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-200 transition cursor-pointer"
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
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Aceptar & Asignar Credenciales</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN DE CREDENCIALES (ACEPTAR SOLICITUD) */}
      <GpsCredentialModal
        isOpen={Boolean(selectedRecordForAssign)}
        onClose={() => setSelectedRecordForAssign(null)}
        record={selectedRecordForAssign}
        onAssign={(recordId, user, pass) => {
          onAssignCredentials(recordId, user, pass);
          setSelectedRecordForAssign(null);
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.7 },
          });
        }}
      />

      {/* MODAL VISOR DE FOTO EN TAMAÑO COMPLETO */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer z-10"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Evidencia en tamaño completo"
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
