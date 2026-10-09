import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, ArrowLeft, Wrench, ShieldCheck, Users, 
  Package, Clock, CheckCircle2, MapPin, Phone, TrendingUp, User,
  Star, MessageSquare, DollarSign, Key, Eye, EyeOff, Edit2,
  Lock, Unlock, X, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { 
  Workshop, WarrantyRequest, AlistamientoFullRecord, 
  TallerClient, Technician, TallerOrder, InventoryItem, AdminInvoice,
  OrderRating
} from '../../../types/customer';
import { matchRecordToWorkshop, isPdiOnlyRecord, matchOrderToWorkshop, calculateWorkshopFinances } from '../../common/AlistamientoWizard';
import { 
  getStoredRatings,
  getStoredWorkshops,
  saveStoredWorkshops,
  getStoredWorkshopManagers,
  saveStoredWorkshopManagers
} from '../../../data/mockMultiRoleData';
import { ModalPortal } from '../../common/ModalPortal';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  technicians: Technician[];
  orders: TallerOrder[];
  inventory: InventoryItem[];
  invoices: AdminInvoice[];
}

const getStatusLabel = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    'en_revision': { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-800' },
    'enviada_matriz': { label: 'En Revisión', bg: 'bg-amber-50', text: 'text-amber-800' },
    'creada': { label: 'Creada', bg: 'bg-zinc-100', text: 'text-zinc-700' },
    'en_proceso': { label: 'En Proceso', bg: 'bg-blue-50', text: 'text-blue-800' },
    'validada_matriz': { label: 'Validada', bg: 'bg-blue-50', text: 'text-blue-800' },
    'enviada_garante': { label: 'En Garante', bg: 'bg-indigo-50', text: 'text-indigo-800' },
    'aceptada': { label: 'Aceptada', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'aprobada': { label: 'Aprobada', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'denegada': { label: 'Denegada', bg: 'bg-red-50', text: 'text-red-800' },
    'rechazada': { label: 'Rechazada', bg: 'bg-red-50', text: 'text-red-800' },
    'completada': { label: 'Completada', bg: 'bg-green-50', text: 'text-green-800' },
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

const getOrderStatusLabel = (status: string) => {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    'recepcion': { label: 'Recepción', bg: 'bg-zinc-100', text: 'text-zinc-800' },
    'diagnostico': { label: 'Diagnóstico', bg: 'bg-amber-50', text: 'text-amber-800' },
    'cotizacion_pendiente': { label: 'Cotización', bg: 'bg-orange-50', text: 'text-orange-800' },
    'en_reparacion': { label: 'En Reparación', bg: 'bg-blue-50', text: 'text-blue-800' },
    'control_calidad': { label: 'Control Calidad', bg: 'bg-purple-50', text: 'text-purple-800' },
    'lista_retiro': { label: 'Lista Retiro', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'entregada': { label: 'Entregada', bg: 'bg-green-50', text: 'text-green-800' },
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

const matchRatingToWorkshop = (r: OrderRating, wsId: string, wsName: string) => {
  if (!r) return false;
  const normName = (wsName || '').toLowerCase().trim();
  const rTaller = (r.workshopName || '').toLowerCase().trim();
  const rWsId = r.workshopId || '';

  // Coincidencia exacta de ID
  if (rWsId && rWsId === wsId) return true;

  // Coincidencia exacta o contenida por nombre
  if (rTaller && normName && (rTaller === normName || normName.includes(rTaller) || rTaller.includes(normName))) {
    return true;
  }

  // Coincidencia por palabra clave de sede
  const keywords = ['mocache', 'buena fe', 'balzar', 'el carmen', 'quevedo', 'ventanas', 'quinzaloma', 'moraspungo', 'empalme', 'la mana', 'la maná', 'ricaurte', 'milagro', 'san luis', 'san-luis'];
  for (const kw of keywords) {
    if ((wsId.includes(kw) || normName.includes(kw)) && (rWsId.includes(kw) || rTaller.includes(kw))) {
      return true;
    }
  }

  // Sede matriz
  const isMatrizTarget = wsId === 'matriz-la-mana' || normName.includes('matriz');
  if (isMatrizTarget && (rWsId === 'matriz-la-mana' || rTaller.includes('matriz'))) {
    return true;
  }

  return false;
};

export const TalleresMobile: React.FC<Props> = ({
  workshops,
  warranties,
  fullAlistamientos,
  clients,
  technicians,
  orders,
  inventory,
  invoices
}) => {
  const [localWorkshops, setLocalWorkshops] = useState<Workshop[]>(() => {
    const stored = getStoredWorkshops();
    return stored.length > 0 ? stored : workshops;
  });

  useEffect(() => {
    const handleSync = () => setLocalWorkshops(getStoredWorkshops());
    window.addEventListener('storage', handleSync);
    window.addEventListener('starmotos_workshops_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('starmotos_workshops_updated', handleSync);
    };
  }, []);

  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<OrderRating[]>(() => getStoredRatings());

  // Modal de estado Operativo / Inoperativo
  const [statusModalWs, setStatusModalWs] = useState<Workshop | null>(null);
  const [inoperativoReason, setInoperativoReason] = useState<string>('');

  // Contraseña de sede (ver / editar)
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');

  const handleOpenStatusModal = (ws: Workshop) => {
    setStatusModalWs(ws);
    setInoperativoReason(ws.inoperativoMotivo || '');
  };

  const handleConfirmStatusChange = () => {
    if (!statusModalWs) return;
    const isGoingInoperativo = statusModalWs.status !== 'inoperativo';
    const updated = localWorkshops.map((w) => {
      if (w.id === statusModalWs.id) {
        return {
          ...w,
          status: isGoingInoperativo ? 'inoperativo' : 'operativo',
          inoperativoMotivo: isGoingInoperativo
            ? (inoperativoReason.trim() || 'A usted se le ha suspendido sus actividades, para más información acérquese o contáctese a la matriz.')
            : undefined,
          inoperativoFecha: isGoingInoperativo ? new Date().toISOString() : undefined,
        };
      }
      return w;
    });
    setLocalWorkshops(updated);
    saveStoredWorkshops(updated);
    setStatusModalWs(null);
    setInoperativoReason('');
  };

  const handleSavePassword = (wsId: string, pwd: string) => {
    if (!pwd.trim()) return;
    const cleanPwd = pwd.trim();
    const updated = localWorkshops.map((w) => (w.id === wsId ? { ...w, password: cleanPwd } : w));
    setLocalWorkshops(updated);
    saveStoredWorkshops(updated);

    try {
      const managers = getStoredWorkshopManagers();
      const updatedMgrs = managers.map((m) => (m.workshopId === wsId ? { ...m, password: cleanPwd } : m));
      saveStoredWorkshopManagers(updatedMgrs);
    } catch (_) {}

    setIsEditingPassword(false);
  };

  useEffect(() => {
    const handleUpdate = () => {
      setRatings(getStoredRatings());
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('starmotos_ratings_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('starmotos_ratings_updated', handleUpdate);
    };
  }, []);

  // Unificar calificaciones con las órdenes
  const allRatings = useMemo(() => {
    const list: OrderRating[] = [...ratings];
    for (const ord of orders) {
      const r = (ord as any).rating;
      if (r && r.stars && !list.some(existing => existing.id === r.id || existing.orderId === (r.orderId || ord.id))) {
        list.push(r);
      }
    }
    return list.filter(r => r && !r.id.startsWith('rat-matriz-') && !r.id.startsWith('rat-suc-'));
  }, [ratings, orders]);

  const getWorkshopRatings = (wsId: string, wsName: string) => {
    return allRatings.filter((r) => matchRatingToWorkshop(r, wsId, wsName));
  };

  const getWorkshopRatingStats = (wsRatings: OrderRating[]) => {
    if (wsRatings.length === 0) return { avg: 0, count: 0 };
    const sum = wsRatings.reduce((acc, r) => acc + (Number(r.stars) || 0), 0);
    return {
      avg: Number((sum / wsRatings.length).toFixed(1)),
      count: wsRatings.length
    };
  };

  // 6 Métricas Globales Solicitadas
  const globalPdi = useMemo(() => {
    return fullAlistamientos.filter(
      (a) => a.serviciosRealizados?.includes('alistamiento_pdi') || isPdiOnlyRecord(a)
    ).length;
  }, [fullAlistamientos]);

  const globalEngrasados = useMemo(() => {
    return fullAlistamientos.filter((a) => a.serviciosRealizados?.includes('engrasado')).length;
  }, [fullAlistamientos]);

  const globalMantenimientos = useMemo(() => {
    return fullAlistamientos.filter((a) => a.serviciosRealizados?.includes('mantenimiento')).length;
  }, [fullAlistamientos]);

  const globalClientesTotales = useMemo(() => {
    return clients.length;
  }, [clients]);

  const globalOrdenesActivas = useMemo(() => {
    const active = orders.filter(
      (o) => o.status !== 'entregada' && o.status !== 'entregado' && o.status !== 'cancelada'
    ).length;
    return active > 0 ? active : localWorkshops.reduce((acc, ws) => acc + ws.activeOrders, 0);
  }, [orders, localWorkshops]);

  const globalGarantias = useMemo(() => {
    const inProcess = warranties.filter(
      (w) => !['completada', 'denegada', 'rechazada'].includes(w.status)
    ).length;
    return inProcess || warranties.length;
  }, [warranties]);

  const renderSixKpiCardsMobile = (metrics: {
    pdi: number;
    engrasados: number;
    mantenimientos: number;
    clientesTotales: number;
    ordenesActivas: number;
    garantias: number;
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {/* 1. PDI */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">PDI</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.pdi}</div>
        <div className="text-[9px] text-zinc-400">Pre-Entrega</div>
      </div>

      {/* 2. ENGRASADOS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-800">ENGRASADOS</span>
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.engrasados}</div>
        <div className="text-[9px] text-zinc-400">Lubricación</div>
      </div>

      {/* 3. MANTENIMIENTOS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">MANTENIMIENTOS</span>
          <Wrench className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.mantenimientos}</div>
        <div className="text-[9px] text-zinc-400">Preventivos</div>
      </div>

      {/* 4. CLIENTES TOTALES */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-800">CLIENTES TOTALES</span>
          <Users className="w-3.5 h-3.5 text-purple-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.clientesTotales}</div>
        <div className="text-[9px] text-zinc-400">Registrados</div>
      </div>

      {/* 5. ORDENES ACTIVAS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800">ORDENES ACTIVAS</span>
          <Clock className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.ordenesActivas}</div>
        <div className="text-[9px] text-zinc-400">En Proceso</div>
      </div>

      {/* 6. GARANTIAS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-2.5 flex flex-col justify-between shadow-2xs">
        <div className="flex items-center justify-between text-zinc-500 mb-0.5">
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-800">GARANTIAS</span>
          <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
        </div>
        <div className="text-lg font-black text-zinc-900 font-mono">{metrics.garantias}</div>
        <div className="text-[9px] text-zinc-400">Casos Gestión</div>
      </div>
    </div>
  );

  const statusModalElement = statusModalWs && (
    <ModalPortal
      isOpen={Boolean(statusModalWs)}
      onClose={() => {
        setStatusModalWs(null);
        setInoperativoReason('');
      }}
      maxWidth="max-w-sm"
    >
      {/* Header */}
      <div className={`p-3.5 flex items-center justify-between text-white ${
        statusModalWs.status === 'inoperativo' ? 'bg-emerald-600' : 'bg-rose-600'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg">
            {statusModalWs.status === 'inoperativo' ? <Unlock className="w-4 h-4 text-white" /> : <Lock className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-xs leading-tight">
              {statusModalWs.status === 'inoperativo' ? 'Reactivar Sede' : 'Suspender Operatividad'}
            </h3>
            <p className="text-[10px] text-white/80">{statusModalWs.name} ({statusModalWs.code})</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatusModalWs(null);
            setInoperativoReason('');
          }}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 text-xs text-zinc-600">
        {statusModalWs.status === 'inoperativo' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-900 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>¿Reactivar acceso a esta sede?</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              El Jefe de Taller podrá ingresar nuevamente a su portal de trabajo con total normalidad.
            </p>
            {statusModalWs.inoperativoMotivo && (
              <div className="mt-0.5 p-1.5 bg-white/80 rounded border border-emerald-200/60 text-[10px]">
                <span className="font-semibold text-emerald-800">Motivo previo:</span> {statusModalWs.inoperativoMotivo}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-rose-900 flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="font-bold text-rose-800">Bloqueo inmediato:</strong> El Jefe de Taller no podrá operar en su portal hasta ser reactivado por Matriz.
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Motivo / Mensaje para el Jefe de Taller:
              </label>
              <textarea
                value={inoperativoReason}
                onChange={(e) => setInoperativoReason(e.target.value)}
                placeholder="Ej: Sede temporalmente suspendida por disposición administrativa de Matriz."
                rows={3}
                className="w-full text-xs p-2 border border-zinc-300 rounded-xl focus:ring-1 focus:ring-rose-500 focus:outline-none placeholder:text-zinc-400 bg-zinc-50 focus:bg-white resize-none"
              />
              <p className="text-[9px] text-zinc-400 mt-0.5">Se mostrará en la pantalla de bloqueo del jefe de taller.</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setStatusModalWs(null);
            setInoperativoReason('');
          }}
          className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-xl transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmStatusChange}
          className={`px-3.5 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
            statusModalWs.status === 'inoperativo'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          {statusModalWs.status === 'inoperativo' ? (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>Reactivar Sede</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>Confirmar Inoperativo</span>
            </>
          )}
        </button>
      </div>
    </ModalPortal>
  );

  if (selectedWorkshopId) {
    const ws = localWorkshops.find(w => w.id === selectedWorkshopId);
    if (!ws) {
      setSelectedWorkshopId(null);
      return null;
    }

    const wsOrders = orders.filter(o => matchOrderToWorkshop(o, ws.id, localWorkshops));
    const wsWarranties = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id);
    const allWsAlistamientos = fullAlistamientos.filter(a => matchRecordToWorkshop(a, ws.id, localWorkshops));
    const wsAlistamientos = allWsAlistamientos.slice(0, 5);
    const wsTechnicians = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name);
    const allWsClients = clients.filter(c => c.workshopId === ws.id || c.workshopName === ws.name);
    const wsClients = allWsClients.slice(0, 5);

    // Métricas específicas de esta sede para los 6 cuadros
    const wsPdi = allWsAlistamientos.filter((a) => a.serviciosRealizados?.includes('alistamiento_pdi') || isPdiOnlyRecord(a)).length;
    const wsEngrasados = allWsAlistamientos.filter((a) => a.serviciosRealizados?.includes('engrasado')).length;
    const wsMantenimientos = allWsAlistamientos.filter((a) => a.serviciosRealizados?.includes('mantenimiento')).length;
    const wsClientesTotales = allWsClients.length;
    const wsOrdenesActivas = wsOrders.filter((o) => o.status !== 'entregada' && o.status !== 'entregado' && o.status !== 'cancelada').length || ws.activeOrders;
    const wsGarantias = wsWarranties.filter((w) => !['completada', 'denegada', 'rechazada'].includes(w.status)).length || wsWarranties.length;

    const { totalFacturado, totalCobrado, totalPendiente } = calculateWorkshopFinances(allWsAlistamientos, wsOrders);

    const wsRatings = getWorkshopRatings(ws.id, ws.name);
    const wsRatingStats = getWorkshopRatingStats(wsRatings);
    const wsRatingsWithComments = wsRatings.filter((r) => r.comment && r.comment.trim() !== '');

    return (
      <div className="flex flex-col space-y-4 pb-6 w-full">
        {/* Back Button */}
        <button 
          onClick={() => setSelectedWorkshopId(null)}
          className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 w-fit cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Volver
        </button>

        {/* Primer Bloque: Información de la Sede con Calificación y Comentarios */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-3">
          {/* Header info + Estrellas en esquina derecha */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono">
                  {ws.code}
                </span>
                <h2 className="text-base font-bold text-zinc-900 truncate">{ws.name}</h2>
              </div>
              <p className="text-xs text-zinc-500 flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1 shrink-0 text-zinc-400" />
                <span className="truncate">{ws.city}{ws.address ? ` - ${ws.address}` : ''}</span>
              </p>

              {/* Clave de la sede: Ver y Editar abajo de la dirección */}
              <div className="mt-2.5 pt-2 border-t border-zinc-100 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-zinc-700 font-bold">
                    <Key className="w-3 h-3 text-blue-600" />
                    <span>Clave del Taller:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-zinc-800 text-[11px] flex items-center gap-1 p-0.5 rounded cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span className="text-[10px]">{showPassword ? 'Ocultar' : 'Ver'}</span>
                    </button>
                    {!isEditingPassword && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPassword(ws.password || 'taller123');
                          setIsEditingPassword(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-[11px] flex items-center gap-1 p-0.5 rounded cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span className="text-[10px]">Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {isEditingPassword ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="px-2 py-1 text-xs border border-zinc-300 rounded-lg font-mono flex-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nueva clave"
                    />
                    <button
                      type="button"
                      onClick={() => handleSavePassword(ws.id, newPassword)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingPassword(false)}
                      className="px-2.5 py-1 bg-zinc-200 text-zinc-700 rounded-lg text-[10px] font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-zinc-700 bg-zinc-50 px-2 py-1 rounded border border-zinc-200/80 flex items-center justify-between">
                    <span>{showPassword ? (ws.password || 'taller123') : '••••••••'}</span>
                    <span className="text-[9px] text-zinc-400 font-sans">Acceso Jefe Taller</span>
                  </div>
                )}
              </div>
            </div>

            {/* Esquina superior derecha: Calificación promedio con estrellas */}
            <div className={`text-right shrink-0 border rounded-lg px-2.5 py-1.5 flex flex-col items-end ${
              wsRatingStats.avg > 0 ? 'bg-amber-50/80 border-amber-200/80' : 'bg-zinc-50 border-zinc-200/60'
            }`}>
              <div className="flex items-center gap-1">
                <Star className={`w-4 h-4 ${wsRatingStats.avg > 0 ? 'fill-amber-400 text-amber-500' : 'text-zinc-300'}`} />
                <span className={`text-base font-black ${wsRatingStats.avg > 0 ? 'text-amber-950' : 'text-zinc-500'}`}>
                  {wsRatingStats.avg > 0 ? wsRatingStats.avg.toFixed(1) : 'S/C'}
                </span>
                {wsRatingStats.avg > 0 && <span className="text-[10px] text-zinc-500 font-semibold">/ 5.0</span>}
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-2.5 h-2.5 ${
                      wsRatingStats.avg > 0 && star <= Math.round(wsRatingStats.avg)
                        ? 'text-amber-500 fill-amber-400'
                        : 'text-zinc-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[9px] font-medium mt-0.5 ${wsRatingStats.avg > 0 ? 'text-amber-800' : 'text-zinc-400'}`}>
                {wsRatings.length === 0 ? '0 opiniones' : `${wsRatings.length} ${wsRatings.length === 1 ? 'opinión' : 'opiniones'}`}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 pt-2.5">
            <div className="flex items-center text-zinc-600">
              <User className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
              <span className="truncate">{ws.manager || 'Sin gerente'}</span>
            </div>
            <div className="flex items-center text-zinc-600">
              <Phone className="w-3.5 h-3.5 mr-1 text-zinc-400 shrink-0" />
              <span className="truncate">{ws.phone || 'Sin teléfono'}</span>
            </div>
            <div className="col-span-2 flex items-center justify-between mt-0.5">
              <button
                type="button"
                onClick={() => handleOpenStatusModal(ws)}
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border transition cursor-pointer flex items-center gap-1 ${
                  ws.status === 'inoperativo'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : ws.status === 'mantenimiento'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title={ws.status === 'inoperativo' ? 'Sede Inoperativa - Click para reactivar' : 'Sede Operativa - Click para inoperativizar'}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${ws.status === 'inoperativo' ? 'bg-rose-500 animate-pulse' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="capitalize">{ws.status === 'inoperativo' ? 'Inoperativo' : 'Operativo'}</span>
              </button>
              {ws.reference && (
                <span className="text-[11px] text-zinc-500 italic truncate max-w-[200px]">
                  Ref: {ws.reference}
                </span>
              )}
            </div>
          </div>

          {/* Abajo: Bloque contenedor de hasta 3 comentarios visibles con scroll vertical */}
          <div className="mt-1 pt-2.5 border-t border-zinc-100">
            <div className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                Comentarios de Clientes
              </span>
              <span className="text-[10px] font-semibold text-zinc-400">
                {wsRatingsWithComments.length} {wsRatingsWithComments.length === 1 ? 'reseña' : 'reseñas'}
              </span>
            </div>

            {wsRatingsWithComments.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-400 bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
                No hay comentarios registrados para esta sede.
              </div>
            ) : (
              <div 
                className="space-y-1.5 overflow-y-auto pr-1 max-h-[195px]"
                style={{ maxHeight: '195px' }}
              >
                {wsRatingsWithComments.map((r) => (
                  <div
                    key={r.id}
                    className="p-2 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-zinc-900 text-[11px] truncate">
                        {r.clientName || 'Cliente'}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-2.5 h-2.5 ${
                              s <= (r.stars || 5) ? 'text-amber-500 fill-amber-400' : 'text-zinc-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-600 italic leading-snug">
                      "{r.comment}"
                    </p>
                    <div className="text-[9px] text-zinc-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI Grid (6 métricas solicitadas) */}
        {renderSixKpiCardsMobile({
          pdi: wsPdi,
          engrasados: wsEngrasados,
          mantenimientos: wsMantenimientos,
          clientesTotales: wsClientesTotales,
          ordenesActivas: wsOrdenesActivas,
          garantias: wsGarantias,
        })}

        {/* Finanzas Rápidas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col">
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Facturado</span>
            <span className="text-xs font-bold text-blue-950 font-mono mt-0.5">${totalFacturado.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col">
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Cobrado</span>
            <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5">${totalCobrado.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col">
            <span className="text-[9px] font-bold text-zinc-500 uppercase">Pendiente</span>
            <span className="text-xs font-bold text-amber-700 font-mono mt-0.5">${totalPendiente.toFixed(2)}</span>
          </div>
        </div>

        {/* Órdenes de Trabajo */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <Wrench className="w-4 h-4 mr-2 text-zinc-500" />
            Órdenes de Trabajo
          </h3>
          {wsOrders.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay órdenes registradas.</p>
          ) : (
            <div className="space-y-2">
              {wsOrders.slice(0, 5).map(o => {
                const sLabel = getOrderStatusLabel(o.status);
                return (
                  <div key={o.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{o.otNumber} - {o.clientName}</div>
                      <div className="text-[10px] text-zinc-500">{o.plate || 'Sin Placa'}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sLabel.bg} ${sLabel.text}`}>
                      {sLabel.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Garantías */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-zinc-500" />
            Garantías
          </h3>
          {wsWarranties.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay garantías registradas.</p>
          ) : (
            <div className="space-y-2">
              {wsWarranties.slice(0, 5).map(w => {
                const sLabel = getStatusLabel(w.status);
                return (
                  <div key={w.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{w.requestNumber || w.motorcycleVin?.substring(0, 8)}</div>
                      <div className="text-[10px] text-zinc-500">{new Date(w.createdAt).toLocaleDateString()} • {w.motorcycleBrand}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${sLabel.bg} ${sLabel.text}`}>
                      {sLabel.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alistamientos */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <CheckCircle2 className="w-4 h-4 mr-2 text-zinc-500" />
            Últimos Alistamientos
          </h3>
          {wsAlistamientos.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay alistamientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {wsAlistamientos.map(a => (
                <div key={a.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-bold text-zinc-800">{a.nombres} {a.apellidos}</div>
                    <div className="text-[10px] text-zinc-500">{new Date(a.createdAt || a.fechaServicio).toLocaleDateString()} • {a.modeloMarca}</div>
                  </div>
                  <div className="text-[11px] font-medium text-emerald-700">
                    USD {a.valorServicio || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Técnicos */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2 text-zinc-500" />
            Técnicos
          </h3>
          {wsTechnicians.length === 0 ? (
            <p className="text-xs text-zinc-500 italic text-center py-2">No hay técnicos asignados.</p>
          ) : (
            <div className="space-y-2">
              {wsTechnicians.map(t => (
                <div key={t.id} className="p-2 border border-zinc-100 rounded bg-zinc-50 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                      {t.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zinc-800">{t.name}</div>
                      <div className="text-[10px] text-zinc-500 capitalize">{t.specialty}</div>
                    </div>
                  </div>
                  <div className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                    {t.activeOrdersCount || 0} OTs
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {statusModalElement}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-6 w-full">
      {/* 6 Métricas Globales Solicitadas */}
      {renderSixKpiCardsMobile({
        pdi: globalPdi,
        engrasados: globalEngrasados,
        mantenimientos: globalMantenimientos,
        clientesTotales: globalClientesTotales,
        ordenesActivas: globalOrdenesActivas,
        garantias: globalGarantias,
      })}

      {/* Workshop List */}
      <div className="space-y-3">
        {localWorkshops.map(ws => {
          const wsOrders = orders.filter(o => matchOrderToWorkshop(o, ws.id, localWorkshops));
          const wsOrdersCount = wsOrders.filter(o => o.status !== 'entregada').length || ws.activeOrders;
          const wsWarrantiesCount = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id).length || ws.pendingWarranties;
          const wsTechsCount = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name).length || ws.mechanics;

          // Financial metrics
          const wsAls = fullAlistamientos.filter(a => matchRecordToWorkshop(a, ws.id, localWorkshops));
          const { totalFacturado, totalCobrado, totalPendiente } = calculateWorkshopFinances(wsAls, wsOrders);

          // Ratings
          const wsRatings = getWorkshopRatings(ws.id, ws.name);
          const wsRatingStats = getWorkshopRatingStats(wsRatings);

          return (
            <div 
              key={ws.id}
              onClick={() => setSelectedWorkshopId(ws.id)}
              className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-mono">
                      {ws.code}
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-zinc-900">{ws.name}</h3>
                      <p className="text-[10px] text-zinc-500">{ws.city}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStatusModal(ws);
                    }}
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 transition cursor-pointer ${
                      ws.status === 'inoperativo'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : ws.status === 'mantenimiento'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title={ws.status === 'inoperativo' ? 'Sede Inoperativa - Click para reactivar' : 'Sede Operativa - Click para inoperativizar'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ws.status === 'inoperativo' ? 'bg-rose-500 animate-pulse' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="capitalize">{ws.status === 'inoperativo' ? 'Inoperativo' : 'Operativo'}</span>
                  </button>
                </div>

                {/* Calificación de la sede */}
                <div className={`flex items-center justify-between border rounded-lg px-2 py-1 mb-2 ${
                  wsRatingStats.avg > 0 ? 'bg-amber-50/80 border-amber-200/70' : 'bg-zinc-50 border-zinc-200/60'
                }`}>
                  <div className="flex items-center gap-1">
                    <Star className={`w-3.5 h-3.5 ${wsRatingStats.avg > 0 ? 'fill-amber-400 text-amber-500' : 'text-zinc-300'}`} />
                    <span className={`text-xs font-bold ${wsRatingStats.avg > 0 ? 'text-amber-900' : 'text-zinc-500'}`}>
                      {wsRatingStats.avg > 0 ? wsRatingStats.avg.toFixed(1) : 'S/C'}
                    </span>
                    {wsRatingStats.avg > 0 && (
                      <span className="text-[10px] text-amber-700 font-medium">/ 5.0</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${wsRatingStats.avg > 0 ? 'text-amber-800' : 'text-zinc-400'}`}>
                    {wsRatingStats.count === 0 ? '0 opiniones' : `${wsRatingStats.count} ${wsRatingStats.count === 1 ? 'opinión' : 'opiniones'}`}
                  </span>
                </div>

                {/* Valores apilados uno encima del otro: Cobros, Pendientes, Total Facturado */}
                <div className="flex flex-col gap-1 text-[11px] mb-2 bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-1.5">
                  <div className="flex items-center justify-between px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-semibold text-emerald-800">Cobros:</span>
                    <span className="font-bold text-emerald-700 font-mono text-[11px]">
                      ${totalCobrado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-0.5 rounded bg-amber-50 border border-amber-100">
                    <span className="text-[10px] font-semibold text-amber-800">Pendientes:</span>
                    <span className="font-bold text-amber-700 font-mono text-[11px]">
                      ${totalPendiente.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-900">Total Facturado:</span>
                    <span className="font-extrabold text-blue-950 font-mono text-[11px]">
                      ${totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2 border-t border-zinc-100">
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <Wrench className="w-3 h-3 mr-1 text-zinc-400" /> {wsOrdersCount}
                </div>
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 mr-1 text-zinc-400" /> {wsWarrantiesCount}
                </div>
                <div className="flex items-center text-[10px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 rounded">
                  <Users className="w-3 h-3 mr-1 text-zinc-400" /> {wsTechsCount}
                </div>
              </div>
            </div>
          );
        })}
        {localWorkshops.length === 0 && (
          <div className="text-center p-6 text-zinc-500 text-sm">
            No hay talleres registrados.
          </div>
        )}
      </div>

      {statusModalElement}
    </div>
  );
};
