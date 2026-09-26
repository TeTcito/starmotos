// src/components/desktop/taller/AgendamientosTallerDesktop.tsx
import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Calendar,
  Clock,
  Search,
  Filter,
  Trash2,
  Phone,
  MessageCircle,
  CheckCircle2,
  Building2,
  Bike,
  User,
  AlertCircle,
  FileText,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { AgendamientoTicket, Workshop } from '../../../types/customer';

interface Props {
  agendamientos: AgendamientoTicket[];
  onDeleteAgendamiento: (id: string) => void;
  currentWorkshop: Workshop;
  workshops: Workshop[];
  isMatriz?: boolean;
  selectedWorkshopFilter?: string;
  onSelectWorkshopFilter?: (wsId: string) => void;
}

export const AgendamientosTallerDesktop: React.FC<Props> = ({
  agendamientos,
  onDeleteAgendamiento,
  currentWorkshop,
  workshops,
  isMatriz = false,
  selectedWorkshopFilter = 'all',
  onSelectWorkshopFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [ticketToDelete, setTicketToDelete] = useState<AgendamientoTicket | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtrado de agendamientos
  const filteredTickets = useMemo(() => {
    return agendamientos.filter((t) => {
      // 1. Búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchClient = (t.clientName || '').toLowerCase().includes(query);
        const matchCedula = (t.clientCedula || '').toLowerCase().includes(query);
        const matchPlate = (t.motoPlate || '').toLowerCase().includes(query);
        const matchTicket = (t.ticketNumber || '').toLowerCase().includes(query);
        const matchModel = (t.motoModel || '').toLowerCase().includes(query);
        if (!matchClient && !matchCedula && !matchPlate && !matchTicket && !matchModel) {
          return false;
        }
      }

      // 2. Filtro por tipo de servicio
      if (serviceFilter !== 'all') {
        if (serviceFilter === 'pdi' && !t.serviceId.includes('pdi')) return false;
        if (serviceFilter === 'engrasado' && !t.serviceId.includes('engrasado')) return false;
        if (serviceFilter === 'mantenimiento' && !t.serviceId.includes('mantenimiento')) return false;
      }

      // 3. Filtro por fecha
      if (dateFilter === 'today') {
        if (t.scheduledDate !== todayStr) return false;
      } else if (dateFilter === 'week') {
        const itemDate = new Date(t.scheduledDate).getTime();
        const now = new Date(todayStr).getTime();
        const diffDays = (itemDate - now) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      }

      return true;
    });
  }, [agendamientos, searchTerm, serviceFilter, dateFilter, todayStr]);

  // Contadores rápidos
  const countToday = useMemo(() => {
    return agendamientos.filter((t) => t.scheduledDate === todayStr).length;
  }, [agendamientos, todayStr]);

  const countPdi = useMemo(() => {
    return agendamientos.filter((t) => t.serviceId.includes('pdi')).length;
  }, [agendamientos]);

  const countEngrasado = useMemo(() => {
    return agendamientos.filter((t) => t.serviceId.includes('engrasado')).length;
  }, [agendamientos]);

  const countMantenimiento = useMemo(() => {
    return agendamientos.filter((t) => t.serviceId.includes('mantenimiento')).length;
  }, [agendamientos]);

  const handleOpenWhatsApp = (ticket: AgendamientoTicket) => {
    const cleanPhone = (ticket.clientPhone || '').replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = `593${finalPhone.slice(1)}`;
    } else if (!finalPhone.startsWith('593') && finalPhone.length === 9) {
      finalPhone = `593${finalPhone}`;
    }
    const message = encodeURIComponent(
      `Hola estimado(a) ${ticket.clientName}, le saludamos de StarMotos (${ticket.workshopName}). Le confirmamos su cita agendada para su motocicleta ${ticket.motoBrand || ''} ${ticket.motoModel} (Placa: ${ticket.motoPlate}) el día ${ticket.scheduledDate} en el turno de las ${ticket.scheduledTime}. Servicio: ${ticket.serviceTitle}. Por favor confirmar asistencia.`
    );
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-12 font-sans">
      {/* 1. Header con estadísticas y aviso de sincronización */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarClock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                  Agendamientos Técnicos de Clientes
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black">
                  {filteredTickets.length} {filteredTickets.length === 1 ? 'Cita' : 'Citas'}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado Nube
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Tickets emitidos por clientes desde su portal para atención en taller. Las citas se limpian automáticamente tras 24 horas de la fecha programada.
              </p>
            </div>
          </div>

          {/* Selector de sede si es Matriz */}
          {isMatriz && workshops && workshops.length > 0 && (
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-700">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="font-bold text-zinc-500 text-[11px]">Sede:</span>
              <select
                value={selectedWorkshopFilter || 'all'}
                onChange={(e) => onSelectWorkshopFilter?.(e.target.value)}
                className="bg-transparent font-bold text-zinc-900 outline-none cursor-pointer text-xs"
              >
                <option value="all">🏢 Todas las Sedes (Red Nacional)</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tarjetas resumen de métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-100">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Citas para Hoy
            </span>
            <span className="text-xl font-black text-zinc-900">{countToday}</span>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Alistamiento PDI
            </span>
            <span className="text-xl font-black text-blue-800">{countPdi}</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Engrasado General
            </span>
            <span className="text-xl font-black text-amber-800">{countEngrasado}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Mantenimiento
            </span>
            <span className="text-xl font-black text-emerald-800">{countMantenimiento}</span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, cédula, placa, modelo o ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-blue-600 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro de Servicio */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-bold text-zinc-600">
            <button
              onClick={() => setServiceFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                serviceFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setServiceFilter('pdi')}
              className={`px-2.5 py-1 rounded-lg transition ${
                serviceFilter === 'pdi' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              PDI
            </button>
            <button
              onClick={() => setServiceFilter('engrasado')}
              className={`px-2.5 py-1 rounded-lg transition ${
                serviceFilter === 'engrasado' ? 'bg-white text-amber-700 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Engrasado
            </button>
            <button
              onClick={() => setServiceFilter('mantenimiento')}
              className={`px-2.5 py-1 rounded-lg transition ${
                serviceFilter === 'mantenimiento' ? 'bg-white text-emerald-700 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Mantenimiento
            </button>
          </div>

          {/* Filtro de Fecha */}
          <div className="flex items-center bg-zinc-100 p-1 rounded-xl text-xs font-bold text-zinc-600">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Cualquier Fecha
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'today' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === 'week' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-zinc-900'
              }`}
            >
              Esta Semana
            </button>
          </div>
        </div>
      </div>

      {/* 3. Listado de Tickets en Diseño de Voucher Profesional */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-4">
            <CalendarClock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-800">
            No hay agendamientos pendientes encontrados
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1">
            {searchTerm || serviceFilter !== 'all' || dateFilter !== 'all'
              ? 'Prueba modificando tus términos de búsqueda o filtros.'
              : 'Cuando un cliente reserve una cita técnica desde su portal, el ticket aparecerá aquí en tiempo real.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
          {filteredTickets.map((ticket) => {
            const isToday = ticket.scheduledDate === todayStr;
            const isPdi = ticket.serviceId.includes('pdi');
            const isEngrasado = ticket.serviceId.includes('engrasado');
            const isMantenimiento = ticket.serviceId.includes('mantenimiento');

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-zinc-200/90 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Cabecera del Ticket Compacta */}
                <div className="bg-gradient-to-r from-zinc-50 to-zinc-100/60 px-3.5 py-2.5 border-b border-zinc-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-md shrink-0">
                      {ticket.ticketNumber || ticket.id}
                    </span>
                    {isToday ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse shrink-0">
                        ¡Hoy!
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 text-[9px] font-bold uppercase shrink-0">
                        Prog.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 truncate shrink-0 max-w-[120px]" title={ticket.workshopName}>
                    <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="font-bold truncate text-[10px]">
                      {ticket.workshopName}
                    </span>
                  </div>
                </div>

                {/* Contenido Principal Compacto */}
                <div className="p-3 space-y-2.5">
                  {/* Fecha y Turno */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block truncate">
                          Fecha
                        </span>
                        <span className="text-xs font-black text-zinc-900 block truncate">
                          {ticket.scheduledDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-2 border-l border-blue-200 min-w-0">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block truncate">
                          Turno
                        </span>
                        <span className="text-xs font-black text-blue-800 block truncate">
                          {ticket.scheduledTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Datos del Cliente y la Motocicleta */}
                  <div className="space-y-1.5 text-xs">
                    {/* Cliente */}
                    <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-zinc-500 font-bold text-[9px] uppercase">
                          <User className="w-3 h-3 text-zinc-400" />
                          Cliente
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          CI: <strong className="text-zinc-700">{ticket.clientCedula || 'S/N'}</strong>
                        </span>
                      </div>
                      <p className="font-bold text-zinc-900 truncate text-xs">
                        {ticket.clientName}
                      </p>
                      {ticket.clientPhone && (
                        <p className="text-[10px] text-zinc-500">
                          Tel: <span className="font-semibold text-zinc-700">{ticket.clientPhone}</span>
                        </p>
                      )}
                    </div>

                    {/* Moto */}
                    <div className="p-2 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-zinc-500 font-bold text-[9px] uppercase">
                          <Bike className="w-3 h-3 text-zinc-400" />
                          Motocicleta
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-900 font-mono font-black text-[10px] border border-zinc-300">
                          {ticket.motoPlate || 'S/P'}
                        </span>
                      </div>
                      <p className="font-bold text-zinc-900 truncate text-xs">
                        {ticket.motoBrand ? `${ticket.motoBrand} ` : ''}{ticket.motoModel}
                      </p>
                      {ticket.motoChasis && (
                        <p className="text-[9px] text-zinc-400 font-mono truncate">
                          VIN: {ticket.motoChasis}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Servicio Solicitado de Alistamiento */}
                  <div
                    className={`p-2.5 rounded-xl border ${
                      isPdi
                        ? 'bg-blue-50/40 border-blue-200'
                        : isEngrasado
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-emerald-50/40 border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-zinc-400" />
                        Servicio
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                          isPdi
                            ? 'bg-blue-600 text-white'
                            : isEngrasado
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {ticket.serviceCategory || 'Alistamiento'}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-zinc-900 leading-snug">
                      {ticket.serviceTitle}
                    </h4>

                    {ticket.notes && (
                      <p className="text-[10px] text-zinc-600 italic mt-1 bg-white/80 p-1.5 rounded-lg border border-zinc-200/50 line-clamp-2">
                        &quot;{ticket.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer de Acciones Compacto */}
                <div className="bg-zinc-50/90 px-3 py-2 border-t border-zinc-200 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(ticket)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition cursor-pointer"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>

                    {ticket.clientPhone && (
                      <a
                        href={`tel:${ticket.clientPhone}`}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11px] font-bold transition"
                        title="Llamar"
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setTicketToDelete(ticket)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold transition cursor-pointer"
                    title="Eliminar este agendamiento"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Borrar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Borrado */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-zinc-900">
                ¿Eliminar este Agendamiento?
              </h3>
              <p className="text-xs text-zinc-600">
                Se eliminará el ticket <span className="font-bold text-zinc-900">{ticketToDelete.ticketNumber || ticketToDelete.id}</span> correspondiente al cliente <span className="font-bold text-zinc-900">{ticketToDelete.clientName}</span>.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1 text-zinc-700">
              <p>📅 Fecha: <span className="font-bold">{ticketToDelete.scheduledDate} ({ticketToDelete.scheduledTime})</span></p>
              <p>🏍️ Moto: <span className="font-bold">{ticketToDelete.motoModel} ({ticketToDelete.motoPlate || 'S/P'})</span></p>
              <p>🔧 Servicio: <span className="font-bold">{ticketToDelete.serviceTitle}</span></p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2 px-4 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAgendamiento(ticketToDelete.id);
                  setTicketToDelete(null);
                }}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
