// src/components/mobile/taller/AgendamientosTallerMobile.tsx
import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  Calendar,
  Clock,
  Search,
  Trash2,
  Phone,
  MessageCircle,
  Building2,
  Bike,
  User,
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

export const AgendamientosTallerMobile: React.FC<Props> = ({
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
  const [ticketToDelete, setTicketToDelete] = useState<AgendamientoTicket | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const filteredTickets = useMemo(() => {
    return agendamientos.filter((t) => {
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

      if (serviceFilter !== 'all') {
        if (serviceFilter === 'pdi' && !t.serviceId.includes('pdi')) return false;
        if (serviceFilter === 'engrasado' && !t.serviceId.includes('engrasado')) return false;
        if (serviceFilter === 'mantenimiento' && !t.serviceId.includes('mantenimiento')) return false;
      }

      return true;
    });
  }, [agendamientos, searchTerm, serviceFilter]);

  const handleOpenWhatsApp = (ticket: AgendamientoTicket) => {
    const cleanPhone = (ticket.clientPhone || '').replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (finalPhone.startsWith('0')) {
      finalPhone = `593${finalPhone.slice(1)}`;
    } else if (!finalPhone.startsWith('593') && finalPhone.length === 9) {
      finalPhone = `593${finalPhone}`;
    }
    const message = encodeURIComponent(
      `Hola estimado(a) ${ticket.clientName}, le saludamos de StarMotos (${ticket.workshopName}). Le confirmamos su cita agendada para su motocicleta ${ticket.motoBrand || ''} ${ticket.motoModel} (Placa: ${ticket.motoPlate}) el día ${ticket.scheduledDate} a las ${ticket.scheduledTime}. Servicio: ${ticket.serviceTitle}.`
    );
    window.open(`https://wa.me/${finalPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="w-full space-y-4 p-3 pb-20 font-sans">
      {/* Header móvil */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarClock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-zinc-900 truncate">
              Agendamientos
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-blue-700 font-bold">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
              </span>
              <span className="text-[10px] text-zinc-400">• Sincronizado</span>
            </div>
          </div>
        </div>

        {/* Selector de sede si es Matriz */}
        {isMatriz && workshops && workshops.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedWorkshopFilter || 'all'}
              onChange={(e) => onSelectWorkshopFilter?.(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 text-xs font-bold text-zinc-800"
            >
              <option value="all">🏢 Todas las Sedes</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Buscador y Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, placa o ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setServiceFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              serviceFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            Todos ({agendamientos.length})
          </button>
          <button
            onClick={() => setServiceFilter('pdi')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              serviceFilter === 'pdi'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            PDI
          </button>
          <button
            onClick={() => setServiceFilter('engrasado')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              serviceFilter === 'engrasado'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            Engrasado
          </button>
          <button
            onClick={() => setServiceFilter('mantenimiento')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              serviceFilter === 'mantenimiento'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-zinc-700 border border-zinc-200'
            }`}
          >
            Mantenimiento
          </button>
        </div>
      </div>

      {/* Tickets móviles */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center">
          <CalendarClock className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-zinc-600">No hay tickets de agendamiento</p>
          <p className="text-[11px] text-zinc-400 mt-1">Los agendamientos aparecerán automáticamente aquí.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isToday = ticket.scheduledDate === todayStr;

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs space-y-3"
              >
                {/* Cabecera del ticket */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    {ticket.ticketNumber || ticket.id}
                  </span>
                  {isToday ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-black uppercase">
                      ¡Hoy!
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[9px] font-bold uppercase">
                      Programada
                    </span>
                  )}
                </div>

                {/* Fecha y Turno */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-black text-zinc-900">{ticket.scheduledDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-black text-blue-800">{ticket.scheduledTime}</span>
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-900 font-bold">
                    <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{ticket.clientName}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 pl-5">
                    CI: <span className="font-semibold text-zinc-700">{ticket.clientCedula || 'S/N'}</span> • Tel: <span className="font-semibold text-zinc-700">{ticket.clientPhone || 'S/N'}</span>
                  </div>
                </div>

                {/* Moto */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Bike className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="font-bold text-zinc-800 truncate">
                      {ticket.motoBrand ? `${ticket.motoBrand} ` : ''}{ticket.motoModel}
                    </span>
                  </div>
                  <span className="font-mono font-black text-[11px] bg-zinc-200 px-1.5 py-0.5 rounded border border-zinc-300 shrink-0">
                    {ticket.motoPlate || 'S/P'}
                  </span>
                </div>

                {/* Servicio */}
                <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-zinc-400" />
                      Servicio Solicitado
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                      {ticket.serviceCategory || 'Alistamiento'}
                    </span>
                  </div>
                  <p className="font-black text-zinc-900 text-xs">{ticket.serviceTitle}</p>
                  {ticket.notes && (
                    <p className="text-[10px] text-zinc-600 italic bg-white p-1.5 rounded border border-zinc-100">
                      &quot;{ticket.notes}&quot;
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(ticket)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {ticket.clientPhone && (
                    <a
                      href={`tel:${ticket.clientPhone}`}
                      className="py-2 px-3 rounded-xl bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setTicketToDelete(ticket)}
                    className="py-2 px-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal móvil de borrado */}
      {ticketToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 className="text-sm font-black text-zinc-900 text-center">
              ¿Eliminar este Agendamiento?
            </h3>
            <p className="text-xs text-zinc-600 text-center">
              Se eliminará el ticket <span className="font-bold">{ticketToDelete.ticketNumber || ticketToDelete.id}</span> de {ticketToDelete.clientName}.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTicketToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAgendamiento(ticketToDelete.id);
                  setTicketToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
