import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, ArrowLeft, Wrench, ShieldCheck, Users, Package, Clock, 
  CheckCircle2, AlertTriangle, MapPin, Phone, TrendingUp, DollarSign, 
  FileText, ChevronRight, User, Search, ChevronDown, Star, MessageSquare,
  Key, Eye, EyeOff, Edit2, Lock, Unlock, X, ShieldAlert
} from 'lucide-react';
import { Workshop, WarrantyRequest, AlistamientoFullRecord, TallerClient, Technician, TallerOrder, InventoryItem, AdminInvoice, OrderRating } from '../../../types/customer';
import { matchRecordToWorkshop, isPdiOnlyRecord, getRecordTimestamp, matchOrderToWorkshop, calculateWorkshopFinances } from '../../common/AlistamientoWizard';
import { saveStoredOrders, getStoredOrders, getStoredRatings, saveStoredWorkshops, getStoredWorkshops, getStoredWorkshopManagers, saveStoredWorkshopManagers } from '../../../data/mockMultiRoleData';
import { ModalPortal } from '../../common/ModalPortal';
import { cloudSaveWorkshopStatus } from '../../../services/supabaseService';

interface Props {
  workshops: Workshop[];
  warranties: WarrantyRequest[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  technicians: Technician[];
  orders: TallerOrder[];
  inventory: InventoryItem[];
  invoices: AdminInvoice[];
  onUpdateOrderStatus?: (orderId: string, newStatus: string) => void;
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
    'inicio': { label: 'Inicio', bg: 'bg-zinc-100', text: 'text-zinc-800' },
    'en_proceso': { label: 'En Proceso', bg: 'bg-blue-50', text: 'text-blue-800' },
    'trabajando': { label: 'Trabajando', bg: 'bg-amber-50', text: 'text-amber-800' },
    'listo_para_entregar': { label: 'Listo Retiro', bg: 'bg-emerald-50', text: 'text-emerald-800' },
    'entregado': { label: 'Entregado', bg: 'bg-green-50', text: 'text-green-800' },
  };
  return map[status] || { label: status, bg: 'bg-zinc-100', text: 'text-zinc-700' };
};

export const TalleresDesktop: React.FC<Props> = ({
  workshops,
  warranties,
  fullAlistamientos,
  clients,
  technicians,
  orders,
  inventory,
  invoices,
  onUpdateOrderStatus,
}) => {
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');
  const [searchWorkshop, setSearchWorkshop] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'inicio' | 'entregado'>('inicio');
  const [orderSearch, setOrderSearch] = useState('');
  const [ratings, setRatings] = useState<OrderRating[]>(getStoredRatings);

  useEffect(() => {
    const handleRatingsUpdate = () => setRatings(getStoredRatings());
    window.addEventListener('starmotos_ratings_updated', handleRatingsUpdate);
    window.addEventListener('storage', handleRatingsUpdate);
    return () => {
      window.removeEventListener('starmotos_ratings_updated', handleRatingsUpdate);
      window.removeEventListener('storage', handleRatingsUpdate);
    };
  }, []);

  // Unificar calificaciones de almacenamiento local con calificaciones adjuntas a las órdenes
  const allRatings = useMemo(() => {
    const list: OrderRating[] = [...ratings];
    for (const ord of orders) {
      const r = (ord as any).rating;
      if (r && r.stars && !list.some(existing => existing.id === r.id || existing.orderId === (r.orderId || ord.id))) {
        list.push(r);
      }
    }
    // Descartar calificaciones de prueba/ficticias
    return list.filter(r => r && !r.id.startsWith('rat-matriz-') && !r.id.startsWith('rat-suc-'));
  }, [ratings, orders]);

  const matchRatingToWorkshop = (r: OrderRating, wsId: string, wsName: string) => {
    if (!r) return false;
    const normWsName = (wsName || '').toLowerCase().trim();
    const rTaller = (r.workshopName || '').toLowerCase().trim();
    const rWsId = r.workshopId || '';

    // Coincidencia exacta de ID
    if (rWsId && rWsId === wsId) return true;

    // Coincidencia exacta o contenida por nombre
    if (rTaller && normWsName && (rTaller === normWsName || normWsName.includes(rTaller) || rTaller.includes(normWsName))) {
      return true;
    }

    // Coincidencia por palabra clave de sede
    const keywords = ['mocache', 'buena fe', 'balzar', 'el carmen', 'quevedo', 'ventanas', 'quinzaloma', 'moraspungo', 'empalme', 'la mana', 'la maná', 'ricaurte', 'milagro', 'san luis', 'san-luis'];
    for (const kw of keywords) {
      if ((wsId.includes(kw) || normWsName.includes(kw)) && (rWsId.includes(kw) || rTaller.includes(kw))) {
        return true;
      }
    }

    // Sede matriz
    const isMatrizTarget = wsId === 'matriz-la-mana' || normWsName.includes('matriz');
    if (isMatrizTarget && (rWsId === 'matriz-la-mana' || rTaller.includes('matriz'))) {
      return true;
    }

    return false;
  };

  const getWorkshopRatings = (wsId: string, wsName: string) => {
    return allRatings.filter((r) => matchRatingToWorkshop(r, wsId, wsName));
  };

  const getWorkshopRatingStats = (wsRatings: OrderRating[]) => {
    if (wsRatings.length === 0) {
      return { avg: 0, count: 0, hasRatings: false };
    }
    const sum = wsRatings.reduce((acc, curr) => acc + (curr.stars || 5), 0);
    const avg = Number((sum / wsRatings.length).toFixed(1));
    return { avg, count: wsRatings.length, hasRatings: true };
  };

  const handleOrderStatusChange = (orderId: string, newStatus: string) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    } else {
      const stored = getStoredOrders();
      const updated = stored.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o);
      saveStoredOrders(updated);
    }
  };

  // Helpers and Memos
  const getWorkshopOrders = (wsId: string) => orders.filter(o => matchOrderToWorkshop(o, wsId, workshops));
  
  const [localWorkshops, setLocalWorkshops] = useState<Workshop[]>(workshops);

  useEffect(() => {
    setLocalWorkshops(workshops);
  }, [workshops]);

  useEffect(() => {
    const handleWsUpdate = () => {
      setLocalWorkshops(getStoredWorkshops());
    };
    window.addEventListener('starmotos_workshops_updated', handleWsUpdate);
    window.addEventListener('storage', handleWsUpdate);
    return () => {
      window.removeEventListener('starmotos_workshops_updated', handleWsUpdate);
      window.removeEventListener('storage', handleWsUpdate);
    };
  }, []);

  // Modal para Bloqueo / Inoperativización y Reactivación
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
    const newStatus = isGoingInoperativo ? 'inoperativo' : 'operativo';
    const newMotivo = isGoingInoperativo
      ? (inoperativoReason.trim() || 'A usted se le ha suspendido sus actividades, para más información acérquese o contáctese a la matriz.')
      : undefined;
    const newFecha = isGoingInoperativo ? new Date().toISOString() : undefined;

    const updated = localWorkshops.map((w) => {
      if (w.id === statusModalWs.id) {
        return {
          ...w,
          status: newStatus,
          inoperativoMotivo: newMotivo,
          inoperativoFecha: newFecha,
        };
      }
      return w;
    });
    setLocalWorkshops(updated);
    saveStoredWorkshops(updated);

    // Sincronizar con Supabase en la nube para propagar en tiempo real a todas las sedes
    cloudSaveWorkshopStatus(statusModalWs.id, newStatus, newMotivo, newFecha, statusModalWs.name);

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

  const provinces = useMemo(() => {
    const provs = Array.from(new Set(localWorkshops.map((w) => w.province).filter(Boolean) as string[]));
    return ['Todas', ...provs.sort()];
  }, [localWorkshops]);

  const getWorkshopLatestActivity = (wsId: string): number => {
    let latest = 0;
    // 1. Alistamientos del taller
    const wsAls = fullAlistamientos.filter((a) => matchRecordToWorkshop(a, wsId, localWorkshops));
    for (const a of wsAls) {
      const ts = getRecordTimestamp(a);
      if (ts > latest) latest = ts;
    }
    // 2. Órdenes del taller
    const wsOrds = orders.filter((o) => (o as any).workshopId === wsId || (o as any).tallerId === wsId);
    for (const o of wsOrds) {
      const dateStr = o.createdAt || o.entryDate;
      if (dateStr) {
        const ts = new Date(dateStr).getTime();
        if (!isNaN(ts) && ts > latest) latest = ts;
      }
    }
    // 3. Garantías del taller
    const wsWarrs = warranties.filter((w) => w.tallerOriginId === wsId || (w as any).tallerOrigin === wsId);
    for (const w of wsWarrs) {
      if (w.createdAt) {
        const ts = new Date(w.createdAt).getTime();
        if (!isNaN(ts) && ts > latest) latest = ts;
      }
    }
    return latest;
  };

  const filteredWorkshops = useMemo(() => {
    let result = localWorkshops;
    if (selectedProvince !== 'Todas') {
      result = result.filter((w) => w.province === selectedProvince);
    }
    if (searchWorkshop.trim() !== '') {
      const q = searchWorkshop.toLowerCase();
      result = result.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.city.toLowerCase().includes(q) ||
          w.code.toLowerCase().includes(q) ||
          w.manager.toLowerCase().includes(q)
      );
    }
    // Siempre poner el más reciente primero que tenga algún cambio o actividad
    return [...result].sort((a, b) => {
      const actA = getWorkshopLatestActivity(a.id);
      const actB = getWorkshopLatestActivity(b.id);
      if (actA !== actB) return actB - actA;
      return a.name.localeCompare(b.name);
    });
  }, [localWorkshops, selectedProvince, searchWorkshop, fullAlistamientos, orders, warranties]);

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

  const renderSixKpiCards = (metrics: {
    pdi: number;
    engrasados: number;
    mantenimientos: number;
    clientesTotales: number;
    ordenesActivas: number;
    garantias: number;
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. PDI */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-blue-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">PDI</span>
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.pdi}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Pre-Entrega</div>
      </div>

      {/* 2. ENGRASADOS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-indigo-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">ENGRASADOS</span>
          <TrendingUp className="w-4 h-4 text-indigo-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.engrasados}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Lubricación</div>
      </div>

      {/* 3. MANTENIMIENTOS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-emerald-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">MANTENIMIENTOS</span>
          <Wrench className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.mantenimientos}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Preventivos</div>
      </div>

      {/* 4. CLIENTES TOTALES */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-purple-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">CLIENTES TOTALES</span>
          <Users className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.clientesTotales}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Registrados</div>
      </div>

      {/* 5. ORDENES ACTIVAS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-amber-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">ORDENES ACTIVAS</span>
          <Clock className="w-4 h-4 text-amber-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.ordenesActivas}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">En Proceso</div>
      </div>

      {/* 6. GARANTIAS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2xs hover:border-rose-300 transition-all">
        <div className="flex items-center justify-between text-zinc-500 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">GARANTIAS</span>
          <ShieldCheck className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-black text-zinc-900 font-mono">{metrics.garantias}</div>
        <div className="text-[10px] text-zinc-400 mt-0.5">Casos Gestión</div>
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
      maxWidth="max-w-md"
    >
      {/* Header */}
      <div className={`p-4 flex items-center justify-between text-white ${
        statusModalWs.status === 'inoperativo' ? 'bg-emerald-600' : 'bg-rose-600'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/20 rounded-xl">
            {statusModalWs.status === 'inoperativo' ? <Unlock className="w-5 h-5 text-white" /> : <Lock className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">
              {statusModalWs.status === 'inoperativo' ? 'Reactivar Sede Operativa' : 'Suspender Operatividad de Sede'}
            </h3>
            <p className="text-[11px] text-white/80">{statusModalWs.name} ({statusModalWs.code})</p>
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
      <div className="p-5 flex flex-col gap-4 text-xs text-zinc-600">
        {statusModalWs.status === 'inoperativo' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-emerald-900 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¿Desea reactivar esta sede autorizada?</span>
            </div>
            <p className="text-[11.5px] text-emerald-700 leading-relaxed">
              Al marcar la sede como <strong>Operativo</strong>, el Jefe de Taller podrá ingresar nuevamente a su portal de trabajo con total normalidad.
            </p>
            {statusModalWs.inoperativoMotivo && (
              <div className="mt-1 p-2 bg-white/80 rounded border border-emerald-200/60 text-[11px]">
                <span className="font-semibold text-emerald-800">Motivo previo de suspensión:</span> {statusModalWs.inoperativoMotivo}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-[11.5px] leading-relaxed">
                <strong className="font-bold text-rose-800">Bloqueo de acceso al Jefe de Taller:</strong> Al marcar como <strong>Inoperativo</strong>, el acceso al portal de esta sucursal quedará restringido de inmediato hasta nueva disposición de Matriz.
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Motivo / Comentario de la suspensión:
              </label>
              <textarea
                value={inoperativoReason}
                onChange={(e) => setInoperativoReason(e.target.value)}
                placeholder="Ej: Sede temporalmente fuera de servicio por mantenimiento preventivo general. Comunicarse con Matriz para más detalles."
                rows={3}
                className="w-full text-xs p-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none placeholder:text-zinc-400 bg-zinc-50 focus:bg-white resize-none"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Este comentario se le mostrará al jefe de taller al momento de intentar acceder a su portal.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setStatusModalWs(null);
            setInoperativoReason('');
          }}
          className="px-3.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-xl transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirmStatusChange}
          className={`px-4 py-1.5 text-xs font-bold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ${
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
              <span>Suspender y Bloquear Sede</span>
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

    const wsOrders = getWorkshopOrders(ws.id);
    const activeWsOrders = wsOrders.length > 0 ? wsOrders.filter(o => o.status !== 'entregada' && o.status !== 'entregado').length : ws.activeOrders;
    
    let filteredWsOrders = wsOrders;
    if (orderStatusFilter === 'inicio') {
      filteredWsOrders = filteredWsOrders.filter(
        (o) => o.status !== 'entregada' && o.status !== 'entregado' && o.status !== 'cancelada'
      );
    } else if (orderStatusFilter === 'entregado') {
      filteredWsOrders = filteredWsOrders.filter(
        (o) => o.status === 'entregada' || o.status === 'entregado'
      );
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      filteredWsOrders = filteredWsOrders.filter(o => 
        o.otNumber.toLowerCase().includes(q) || 
        o.clientName.toLowerCase().includes(q) || 
        o.plate.toLowerCase().includes(q)
      );
    }
    filteredWsOrders = [...filteredWsOrders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.entryDate ? new Date(a.entryDate).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.entryDate ? new Date(b.entryDate).getTime() : 0);
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });

    const wsWarranties = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id);
    const warrantiesInProcess = wsWarranties.filter(w => !['completada', 'denegada', 'rechazada'].includes(w.status)).length;
    
    const wsAlistamientos = fullAlistamientos.filter(a => matchRecordToWorkshop(a, ws.id, localWorkshops));
    const sortedWsAlistamientos = [...wsAlistamientos].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));
    const wsClients = clients.filter(c => c.workshopId === ws.id || c.workshopName === ws.name);
    const wsTechnicians = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name);
    
    const wsInventory = inventory.filter(i => (i as any).workshopId === ws.id || (i as any).sedeId === ws.id);
    const wsInventoryCount = wsInventory.length;
    const wsLowStockCount = wsInventory.filter(i => i.stock <= (i.minStock || 5)).length;

    const { totalFacturado, totalCobrado, totalPendiente } = calculateWorkshopFinances(wsAlistamientos, wsOrders);
    const totalIngresos = totalFacturado;

    const wsRatings = getWorkshopRatings(ws.id, ws.name);
    const wsRatingStats = getWorkshopRatingStats(wsRatings);
    const wsRatingsWithComments = wsRatings.filter((r) => r.comment && r.comment.trim() !== '');

    return (
      <div className="flex flex-col gap-6 animate-fade-in pb-10">
        <button 
          onClick={() => setSelectedWorkshopId(null)}
          className="flex items-center gap-2 text-zinc-500 hover:text-blue-700 transition-colors w-fit font-medium text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Red de Talleres
        </button>

        {/* Workshop Header Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold text-zinc-800">{ws.name}</h2>
              <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-xs font-mono">{ws.code}</span>
              <button
                type="button"
                onClick={() => handleOpenStatusModal(ws)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition cursor-pointer ${
                  ws.status === 'inoperativo'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : ws.status === 'mantenimiento'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                }`}
                title={ws.status === 'inoperativo' ? 'Sede Inoperativa - Click para reactivar' : 'Sede Operativa - Click para inoperativizar'}
              >
                <span className={`w-2 h-2 rounded-full ${ws.status === 'inoperativo' ? 'bg-rose-500 animate-pulse' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="capitalize">{ws.status === 'inoperativo' ? 'Inoperativo' : 'Operativo'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-2 text-sm text-zinc-600">
                  <MapPin className="w-4 h-4 mt-0.5 text-zinc-400 shrink-0" />
                  <div>
                    <p>{ws.address}</p>
                    <p className="text-xs text-zinc-500">{[ws.city, ws.parroquia, ws.canton, ws.province].filter(Boolean).join(', ')}</p>
                    {ws.reference && <p className="text-xs text-zinc-400 italic mt-0.5">Ref: {ws.reference}</p>}
                  </div>
                </div>

                {/* Contraseña de la sede: Ver y Editar justo abajo de la dirección */}
                <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-semibold">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      <span>Contraseña de la Sede:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-500 hover:text-zinc-800 text-xs flex items-center gap-1 cursor-pointer p-0.5 rounded hover:bg-zinc-100 transition"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[11px] font-medium">{showPassword ? 'Ocultar' : 'Ver'}</span>
                      </button>
                      {!isEditingPassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewPassword(ws.password || 'taller123');
                            setIsEditingPassword(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 cursor-pointer p-0.5 rounded hover:bg-blue-50 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">Editar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingPassword ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="px-2.5 py-1 text-xs border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-mono flex-1 max-w-[200px]"
                        placeholder="Nueva contraseña"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePassword(ws.id, newPassword)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPassword(false)}
                        className="px-2 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-medium rounded-lg cursor-pointer transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="font-mono text-xs bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-lg w-fit text-zinc-800 select-all font-semibold">
                      {showPassword ? (ws.password || 'taller123') : '••••••••••••'}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <User className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Gerente: <span className="font-medium text-zinc-800">{ws.manager}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>{ws.phone}</span>
                </div>
                {ws.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                    <span>{ws.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque derecho: Calificación promedio y contenedor de hasta 3 comentarios con scroll si hay más */}
          <div className="w-full lg:w-96 shrink-0 bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            {/* Esquina superior derecha: Estrellas de calificación y promedio */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <Star className={`w-5 h-5 ${wsRatingStats.avg > 0 ? 'text-amber-500 fill-amber-400' : 'text-zinc-300'}`} />
                  <span className="text-2xl font-black text-zinc-900">
                    {wsRatingStats.avg > 0 ? wsRatingStats.avg.toFixed(1) : 'S/C'}
                  </span>
                  {wsRatingStats.avg > 0 && <span className="text-xs text-zinc-500 font-semibold">/ 5.0</span>}
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3.5 h-3.5 ${
                        wsRatingStats.avg > 0 && star <= Math.round(wsRatingStats.avg)
                          ? 'text-amber-500 fill-amber-400'
                          : 'text-zinc-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                  wsRatingStats.avg > 0 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}>
                  Calificación Sede
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                  {wsRatings.length === 0 
                    ? 'Sin opiniones registradas' 
                    : `${wsRatings.length} ${wsRatings.length === 1 ? 'opinión registrada' : 'opiniones registradas'}`}
                </p>
              </div>
            </div>

            {/* Abajo: Bloque contenedor de hasta 3 comentarios (con scroll si hay más en el espacio de 3) */}
            <div className="flex flex-col">
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
                <div className="p-4 text-center text-xs text-zinc-400 bg-white rounded-lg border border-dashed border-zinc-200">
                  No hay comentarios registrados para esta sede.
                </div>
              ) : (
                <div 
                  className="space-y-2 overflow-y-auto pr-1 max-h-[215px] scrollbar-thin"
                  style={{ maxHeight: '215px' }}
                >
                  {wsRatingsWithComments.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs text-xs space-y-1"
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
                                s <= r.stars
                                  ? 'text-amber-500 fill-amber-400'
                                  : 'text-zinc-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-600 italic leading-snug line-clamp-3">
                        "{r.comment}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-100">
                        <span className="truncate max-w-[170px]">
                          {r.motorcycleInfo || r.plate || r.serviceSummary || 'Servicio de Taller'}
                        </span>
                        <span className="shrink-0">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('es-EC') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Segunda Sección: 6 Cuadros de la Sede Solicitados */}
        {renderSixKpiCards({
          pdi: wsAlistamientos.filter((a) => a.serviciosRealizados?.includes('alistamiento_pdi') || isPdiOnlyRecord(a)).length,
          engrasados: wsAlistamientos.filter((a) => a.serviciosRealizados?.includes('engrasado')).length,
          mantenimientos: wsAlistamientos.filter((a) => a.serviciosRealizados?.includes('mantenimiento')).length,
          clientesTotales: wsClients.length,
          ordenesActivas: activeWsOrders,
          garantias: warrantiesInProcess,
        })}

        {/* Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-6">
            {/* Órdenes */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex flex-col gap-3 bg-zinc-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-zinc-500" />
                    Órdenes de Trabajo
                  </h3>
                  <div className="relative">
                    <input type="text" value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Buscar orden..." className="pl-8 pr-3 py-1.5 bg-white border border-zinc-200 rounded-md text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
                  </div>
                </div>
                <div className="flex gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('inicio')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderStatusFilter === 'inicio'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Inicio
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('entregado')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      orderStatusFilter === 'entregado'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    Entregado
                  </button>
                </div>
              </div>
              <div className="p-0 overflow-auto max-h-[300px]">
                {filteredWsOrders.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 border-b border-zinc-200">
                      <tr>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">OT #</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">Cliente</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase">Estado</th>
                        <th className="py-2 px-4 text-[11px] font-semibold text-zinc-500 uppercase text-right">Costo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredWsOrders.map(o => {
                        const stat = getOrderStatusLabel(o.status);
                        const isSetA = ['recepcion', 'diagnostico', 'cotizacion_pendiente', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada'].includes(o.status);
                        const flow = isSetA
                          ? ['recepcion', 'diagnostico', 'cotizacion_pendiente', 'en_reparacion', 'control_calidad', 'lista_retiro', 'entregada']
                          : ['inicio', 'en_proceso', 'trabajando', 'listo_para_entregar', 'entregado'];
                        const idx = flow.indexOf(o.status);
                        const nextStatuses = idx !== -1 && idx < flow.length - 1 ? flow.slice(idx + 1) : [];
                        const isDelivered = o.status === 'entregada' || o.status === 'entregado' || nextStatuses.length === 0;
                        return (
                          <tr key={o.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="py-3 px-4 text-sm font-medium text-blue-700">{o.otNumber}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-zinc-800">{o.clientName}</div>
                              <div className="text-xs text-zinc-500">{o.motorcycleInfo} | {o.plate}</div>
                            </td>
                            <td className="py-3 px-4">
                              {isDelivered ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                                  {stat.label}
                                </span>
                              ) : (
                                <div className="relative group inline-block">
                                  <button className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                                    {stat.label}
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                  <div className="absolute left-0 top-full mt-1 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg hidden group-hover:block z-10">
                                    {nextStatuses.map(ns => {
                                      const nextStat = getOrderStatusLabel(ns);
                                      return (
                                        <button 
                                          key={ns} 
                                          onClick={() => handleOrderStatusChange(o.id, ns)}
                                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 ${nextStat.text}`}
                                        >
                                          {nextStat.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-zinc-800 text-right">
                              USD {o.totalCost.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-sm">Sin órdenes de trabajo registradas</div>
                )}
              </div>
            </div>

            {/* Alistamientos */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-500" />
                  Alistamientos Recientes
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px] flex flex-col gap-3">
                {sortedWsAlistamientos.length > 0 ? (
                  sortedWsAlistamientos.slice(0, 10).map(a => (
                    <div key={a.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl hover:border-emerald-200 transition-colors bg-white">
                      <div>
                        <div className="text-sm font-medium text-zinc-800">{a.nombres} {a.apellidos}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">{a.modeloMarca} | {a.placa}</div>
                        <span className="inline-block mt-1 px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-medium">
                          {a.serviciosRealizados?.join(', ') || 'Alistamiento'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-zinc-400 mb-1">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-bold text-emerald-700">
                          {((a.serviciosRealizados?.length === 1 && a.serviciosRealizados[0] === 'alistamiento_pdi') || Number(a.valorServicio || 0) === 0) ? '-' : `USD ${(a.valorServicio || 0).toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin alistamientos recientes</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* Garantías */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  Garantías Recientes
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px] flex flex-col gap-3">
                {wsWarranties.length > 0 ? (
                  wsWarranties.map(w => {
                    const stat = getStatusLabel(w.status);
                    return (
                      <div key={w.id} className="flex items-center justify-between p-3 border border-zinc-100 rounded-xl hover:border-blue-200 transition-colors bg-white">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-700">{w.requestNumber || w.id.substring(0, 8)}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${stat.bg} ${stat.text}`}>
                              {stat.label}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-zinc-800 mt-1">{w.clientName}</div>
                          <div className="text-xs text-zinc-500">{(w as any).motorcycleBrand} {(w as any).motorcycleModel}</div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(w.createdAt).toLocaleDateString()}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin solicitudes de garantía</div>
                )}
              </div>
            </div>

            {/* Técnicos */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Técnicos Asignados
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px]">
                {wsTechnicians.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wsTechnicians.map(t => (
                      <div key={t.id} className="flex flex-col p-3 border border-purple-100 bg-purple-50/30 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm text-zinc-800">{t.name}</div>
                          <span className={`w-2 h-2 rounded-full mt-1.5 ${t.status === 'activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        </div>
                        <div className="text-xs text-purple-700 font-medium mt-1">{t.specialty || 'Mecánico General'}</div>
                        <div className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {t.phone || 'No registrado'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin técnicos asignados</div>
                )}
              </div>
            </div>

            {/* Clientes Registrados */}
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
                <h3 className="font-bold text-sm text-zinc-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  Clientes Recientes ({wsClients.length})
                </h3>
              </div>
              <div className="p-4 overflow-auto max-h-[300px]">
                {wsClients.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {wsClients.slice(0, 5).map(c => (
                      <div key={c.id} className="flex justify-between items-center p-3 border border-zinc-100 rounded-xl hover:border-blue-200 transition-colors bg-white">
                        <div>
                          <div className="font-medium text-sm text-zinc-800">{c.fullName}</div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">{c.motorcycleBrand} {c.motorcycleModel}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded">
                          <Phone className="w-3 h-3" />
                          {c.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-zinc-500 text-sm">Sin clientes registrados</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {statusModalElement}
      </div>
    );
  }

  // Part 1: Compact Grid View
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Red Oficial de Talleres & Sucursales StarMotos
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Gestión consolidada de sucursales y puntos de servicio autorizado.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
             <input type="text" value={searchWorkshop} onChange={e => setSearchWorkshop(e.target.value)} placeholder="Buscar taller..." className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />
             <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Provinces filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {provinces.map(prov => (
          <button
            key={prov}
            onClick={() => setSelectedProvince(prov)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedProvince === prov 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      {/* 6 Métricas Globales Solicitadas */}
      {renderSixKpiCards({
        pdi: globalPdi,
        engrasados: globalEngrasados,
        mantenimientos: globalMantenimientos,
        clientesTotales: globalClientesTotales,
        ordenesActivas: globalOrdenesActivas,
        garantias: globalGarantias,
      })}

      {/* Grid of Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredWorkshops.map(ws => {
          const isMatriz = ws.id === 'matriz-la-mana' || ws.name.toLowerCase().includes('matriz');
          
          const wsOrders = getWorkshopOrders(ws.id);
          const wsOrdersCount = wsOrders.length || ws.activeOrders;
          const wsWarrantiesCount = warranties.filter(w => w.tallerOriginId === ws.id || w.tallerOrigin === ws.name || (w as any).tallerOrigin === ws.id).length || ws.pendingWarranties;
          const wsMechanicsCount = technicians.filter(t => t.workshopId === ws.id || t.workshopName === ws.name).length || ws.mechanics;

          // Financial metrics
          const wsAls = fullAlistamientos.filter(a => matchRecordToWorkshop(a, ws.id, workshops));
          const { totalFacturado, totalCobrado, totalPendiente } = calculateWorkshopFinances(wsAls, wsOrders);

          // Ratings
          const wsRatings = getWorkshopRatings(ws.id, ws.name);
          const wsRatingStats = getWorkshopRatingStats(wsRatings);

          return (
            <div 
              key={ws.id}
              onClick={() => setSelectedWorkshopId(ws.id)}
              className={`bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all flex flex-col justify-between ${
                isMatriz ? 'border-blue-400 ring-1 ring-blue-400/20' : 'border-zinc-200 hover:border-blue-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-1.5">
                  <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[9px] font-mono tracking-wider font-semibold">
                    {ws.code}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenStatusModal(ws);
                    }}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                      ws.status === 'inoperativo'
                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        : ws.status === 'mantenimiento'
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title={ws.status === 'inoperativo' ? 'Sede Inoperativa - Click para reactivar' : 'Sede Operativa - Click para inoperativizar'}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${ws.status === 'inoperativo' ? 'bg-rose-500 animate-pulse' : ws.status === 'mantenimiento' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span className="capitalize">{ws.status === 'inoperativo' ? 'Inoperativo' : 'Operativo'}</span>
                  </button>
                </div>
                
                <h3 className="text-[13px] font-bold text-zinc-800 line-clamp-1">{ws.name}</h3>
                <div className="text-[10px] text-zinc-500 mt-0.5 mb-2.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
                  <span className="truncate">{ws.city}</span>
                </div>

                {/* Calificación de la sede */}
                <div className={`flex items-center justify-between border rounded-lg px-2 py-1 mb-2.5 ${
                  wsRatingStats.avg > 0 ? 'bg-amber-50/80 border-amber-200/70' : 'bg-zinc-50 border-zinc-200/60'
                }`}>
                  <div className="flex items-center gap-1">
                    <Star className={`w-3.5 h-3.5 shrink-0 ${wsRatingStats.avg > 0 ? 'fill-amber-400 text-amber-500' : 'text-zinc-300'}`} />
                    <span className={`text-xs font-bold ${wsRatingStats.avg > 0 ? 'text-amber-900' : 'text-zinc-500'}`}>
                      {wsRatingStats.avg > 0 ? wsRatingStats.avg.toFixed(1) : 'S/C'}
                    </span>
                    {wsRatingStats.avg > 0 && (
                      <span className="text-[10px] text-amber-700/80 font-medium">/ 5.0</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${wsRatingStats.avg > 0 ? 'text-amber-800' : 'text-zinc-400'}`}>
                    {wsRatingStats.count === 0 ? '0 opiniones' : `${wsRatingStats.count} ${wsRatingStats.count === 1 ? 'reseña' : 'reseñas'}`}
                  </span>
                </div>

                {/* Valores apilados uno encima del otro: Cobros, Pendientes, Total Facturado */}
                <div className="flex flex-col gap-1 text-[11px] mb-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-lg p-1.5">
                  {/* Cobros */}
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-emerald-50 border border-emerald-100/90">
                    <span className="text-[10px] font-semibold text-emerald-800">Cobros:</span>
                    <span className="font-bold text-emerald-700 font-mono text-[11px]">
                      ${totalCobrado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Pendientes */}
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-50 border border-amber-100/90">
                    <span className="text-[10px] font-semibold text-amber-800">Pendientes:</span>
                    <span className="font-bold text-amber-700 font-mono text-[11px]">
                      ${totalPendiente.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Total Facturado */}
                  <div className="flex items-center justify-between px-2 py-1 rounded bg-blue-50 border border-blue-100/90">
                    <span className="text-[10px] font-bold text-blue-900">Total Facturado:</span>
                    <span className="font-extrabold text-blue-950 font-mono text-[11px]">
                      ${totalFacturado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas operativas en footer */}
              <div className="flex items-center justify-between gap-1 pt-2 border-t border-zinc-100 text-zinc-600">
                <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded text-[9px]" title="Órdenes">
                  <Wrench className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsOrdersCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded text-[9px]" title="Garantías">
                  <ShieldCheck className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsWarrantiesCount}</span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-50 px-1.5 py-0.5 rounded text-[9px]" title="Mecánicos">
                  <Users className="w-2.5 h-2.5 text-zinc-400" />
                  <span className="font-semibold">{wsMechanicsCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWorkshops.length === 0 && (
        <div className="py-12 text-center bg-white border border-zinc-200 rounded-xl">
          <Building2 className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No se encontraron talleres en esta provincia.</p>
        </div>
      )}

      {statusModalElement}
    </div>
  );
};
