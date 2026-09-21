// src/components/common/ClientesModule.tsx
import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  Bike,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
  Wrench,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  X,
  Building2,
  ChevronRight,
  Filter,
  Eye,
  DollarSign,
  Clock,
  Camera,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  TallerClient,
  Workshop,
  WarrantyRequest,
  UnifiedClient,
} from '../../types/customer';

export interface ClientRowData {
  nombre: string;
  apellido: string;
  origen: string;
  sede: string;
  fecha: string;
  servicio: string;
  valor: number;
  factura: string;
  isPaid: boolean;
  estado: 'iniciado' | 'pendiente' | 'referente';
  observaciones: string;
}

export function getClientRowData(client: UnifiedClient): ClientRowData {
  const rec = client.records[0];
  const nombre = client.nombres || client.fullName.split(' ')[0] || 'Cliente';
  const apellido = client.apellidos || client.fullName.split(' ').slice(1).join(' ') || '';
  const origen = client.origin || rec?.origen || 'Almacén Oficial';
  const sede = client.workshopName || rec?.sede || 'StarMotos Sede';
  const fecha = client.lastVisitDate || rec?.fechaServicio || 'Reciente';

  // Servicio realizado
  let servicio = client.lastServiceType || 'Alistamiento';
  if (rec?.serviciosRealizados && rec.serviciosRealizados.length > 0) {
    const list: string[] = [];
    if (rec.serviciosRealizados.includes('alistamiento_pdi')) list.push('Alistamiento PDI');
    if (rec.serviciosRealizados.includes('engrasado')) list.push('Engrasado');
    if (rec.serviciosRealizados.includes('mantenimiento')) list.push('Mantenimiento');
    servicio = list.join(' + ') || 'Servicio';
  }

  // Valor
  const valor = rec ? (rec.montoPagado || rec.valorServicio || 0) : (client.totalSpent || 35.0);

  // Factura
  const factura = rec?.numeroFactura || rec?.numeroTicket || `FAC-${client.cedulaRuc.slice(-4)}`;

  // ¿Pagada?
  const isPaid = rec
    ? (rec.montoPagado ?? 0) >= (rec.valorServicio ?? 0) || !!rec.metodoPago
    : true;

  // Estado: iniciado | pendiente | referente
  let estado: 'iniciado' | 'pendiente' | 'referente' = 'iniciado';
  if (client.maintenanceCount >= 2 || (client.pdiCompleted && client.engrasadoCompleted)) {
    estado = 'referente';
  } else if (!isPaid || (!client.pdiCompleted && client.records.length === 0)) {
    estado = 'pendiente';
  } else {
    estado = 'iniciado';
  }

  // Observaciones
  const observaciones = rec?.observaciones || 'Registro en sistema StarMotos';

  return {
    nombre,
    apellido,
    origen,
    sede,
    fecha,
    servicio,
    valor,
    factura,
    isPaid,
    estado,
    observaciones,
  };
}

interface Props {
  role: 'admin' | 'taller' | 'garante';
  currentWorkshopId?: string;
  workshops: Workshop[];
  fullAlistamientos: AlistamientoFullRecord[];
  clients: TallerClient[];
  warranties?: WarrantyRequest[];
  onNavigateToAlistamiento?: (clientCedula?: string) => void;
}

export const ClientesModule: React.FC<Props> = ({
  role,
  currentWorkshopId,
  workshops,
  fullAlistamientos = [],
  clients = [],
  warranties = [],
  onNavigateToAlistamiento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<
    'all' | 'iniciado' | 'pendiente' | 'referente' | 'pagada' | 'pdi_ok' | 'warranties'
  >('all');
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<UnifiedClient | null>(null);
  const [copiedCedula, setCopiedCedula] = useState<string | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Unificación de clientes entre fullAlistamientos y clients
  const unifiedClients = useMemo<UnifiedClient[]>(() => {
    const map = new Map<string, UnifiedClient>();

    // 1. Procesar todos los registros de Alistamiento
    fullAlistamientos.forEach((rec) => {
      const cedula = rec.cedulaRuc.trim();
      if (!cedula) return;

      const ws = workshops.find((w) => w.id === rec.sedeId || w.name === rec.sede);
      const isPdi = rec.serviciosRealizados?.includes('alistamiento_pdi') || false;
      const isEngrasado = rec.serviciosRealizados?.includes('engrasado') || false;
      const isMant = rec.serviciosRealizados?.includes('mantenimiento') || false;
      const cost = rec.montoPagado || rec.valorServicio || 0;

      if (!map.has(cedula)) {
        const matchingWarranties = warranties.filter(
          (w) =>
            w.clientIdNumber === cedula ||
            w.clientName.toLowerCase().includes(rec.nombres.toLowerCase()) ||
            (w.motorcyclePlate && rec.placa && w.motorcyclePlate.toLowerCase() === rec.placa.toLowerCase()) ||
            (w.motorcycleVin && rec.chasis && w.motorcycleVin.toLowerCase() === rec.chasis.toLowerCase())
        );

        map.set(cedula, {
          id: cedula,
          fullName: `${rec.nombres} ${rec.apellidos}`.trim(),
          nombres: rec.nombres,
          apellidos: rec.apellidos,
          cedulaRuc: cedula,
          phone: rec.celular1,
          phone2: rec.celular2,
          email: rec.email,
          address: rec.direccion,
          origin: rec.origen,
          workshopId: rec.sedeId || ws?.id || 'taller-quevedo',
          workshopName: rec.sede || ws?.name || 'Sede Quevedo',
          motorcycles: [
            {
              model: rec.modeloMarca,
              plate: rec.placa,
              chasis: rec.chasis,
              lastMileage: rec.kilometraje,
            },
          ],
          pdiCompleted: isPdi,
          engrasadoCompleted: isEngrasado,
          maintenanceCount: isMant ? 1 : 0,
          totalSpent: cost,
          lastVisitDate: rec.fechaServicio || rec.createdAt,
          lastServiceType: rec.serviciosRealizados?.join(', ') || 'Alistamiento',
          warrantiesCount: matchingWarranties.length,
          records: [rec],
        });
      } else {
        const existing = map.get(cedula)!;
        existing.records.push(rec);
        existing.totalSpent += cost;
        if (isPdi) existing.pdiCompleted = true;
        if (isEngrasado) existing.engrasadoCompleted = true;
        if (isMant) existing.maintenanceCount += 1;

        // Comprobar si es una nueva moto o fecha más reciente
        const hasMoto = existing.motorcycles.some(
          (m) => (m.chasis && m.chasis === rec.chasis) || (m.plate && m.plate === rec.placa)
        );
        if (!hasMoto && (rec.chasis || rec.placa)) {
          existing.motorcycles.push({
            model: rec.modeloMarca,
            plate: rec.placa,
            chasis: rec.chasis,
            lastMileage: rec.kilometraje,
          });
        }

        // Actualizar última visita si esta fecha es más reciente
        if (rec.fechaServicio && rec.fechaServicio > existing.lastVisitDate) {
          existing.lastVisitDate = rec.fechaServicio;
          existing.lastServiceType = rec.serviciosRealizados?.join(', ') || 'Mantenimiento';
        }
      }
    });

    // 2. Incorporar clientes de la base TallerClient si no existen aún
    clients.forEach((c) => {
      const cedula = c.idNumber.trim();
      if (!cedula) return;

      if (!map.has(cedula)) {
        const parts = c.fullName.split(' ');
        const matchingWarranties = warranties.filter(
          (w) =>
            w.clientName.toLowerCase().includes(c.fullName.toLowerCase()) ||
            w.motorcyclePlate?.toLowerCase() === c.motorcyclePlate?.toLowerCase()
        );

        map.set(cedula, {
          id: cedula,
          fullName: c.fullName,
          nombres: parts[0] || c.fullName,
          apellidos: parts.slice(1).join(' ') || '',
          cedulaRuc: cedula,
          phone: c.phone,
          email: c.email,
          workshopId: c.workshopId || currentWorkshopId || 'taller-quevedo',
          workshopName: c.workshopName || 'Sede Quevedo',
          motorcycles: [
            {
              model: `${c.motorcycleBrand} ${c.motorcycleModel}`.trim(),
              brand: c.motorcycleBrand,
              plate: c.motorcyclePlate,
              chasis: 'S/N',
            },
          ],
          pdiCompleted: false,
          engrasadoCompleted: false,
          maintenanceCount: c.totalVisits || 1,
          totalSpent: (c.totalVisits || 1) * 35.0,
          lastVisitDate: c.lastVisit || 'Reciente',
          lastServiceType: 'Mantenimiento',
          warrantiesCount: matchingWarranties.length,
          records: [],
        });
      }
    });

    return Array.from(map.values());
  }, [fullAlistamientos, clients, workshops, warranties, currentWorkshopId]);

  // Filtrado según rol, sede, tab y búsqueda
  const filteredClients = useMemo(() => {
    return unifiedClients.filter((client) => {
      // Filtro de alcance por rol
      if (role === 'taller' && currentWorkshopId) {
        const matchesWorkshop =
          client.workshopId === currentWorkshopId ||
          client.records.some((r) => r.sedeId === currentWorkshopId);
        if (!matchesWorkshop) return false;
      }

      if (role === 'admin' && selectedWorkshopFilter !== 'all') {
        const matchesSelected =
          client.workshopId === selectedWorkshopFilter ||
          client.records.some((r) => r.sedeId === selectedWorkshopFilter);
        if (!matchesSelected) return false;
      }

      // Filtro de Tabs
      if (activeFilterTab === 'iniciado' && getClientRowData(client).estado !== 'iniciado') return false;
      if (activeFilterTab === 'pendiente' && getClientRowData(client).estado !== 'pendiente') return false;
      if (activeFilterTab === 'referente' && getClientRowData(client).estado !== 'referente') return false;
      if (activeFilterTab === 'pagada' && !getClientRowData(client).isPaid) return false;
      if (activeFilterTab === 'pdi_ok' && !client.pdiCompleted) return false;
      if (activeFilterTab === 'warranties' && client.warrantiesCount === 0) return false;

      // Buscador multi-campo
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const data = getClientRowData(client);
        const matchName = data.nombre.toLowerCase().includes(term);
        const matchApellido = data.apellido.toLowerCase().includes(term);
        const matchCedula = client.cedulaRuc.toLowerCase().includes(term);
        const matchPhone = client.phone?.toLowerCase().includes(term);
        const matchOrigen = data.origen.toLowerCase().includes(term);
        const matchSede = data.sede.toLowerCase().includes(term);
        const matchServicio = data.servicio.toLowerCase().includes(term);
        const matchFactura = data.factura.toLowerCase().includes(term);
        const matchObservaciones = data.observaciones.toLowerCase().includes(term);
        const matchMoto = client.motorcycles.some(
          (m) =>
            m.model.toLowerCase().includes(term) ||
            m.plate.toLowerCase().includes(term) ||
            m.chasis.toLowerCase().includes(term)
        );
        return (
          matchName ||
          matchApellido ||
          matchCedula ||
          matchPhone ||
          matchOrigen ||
          matchSede ||
          matchServicio ||
          matchFactura ||
          matchObservaciones ||
          matchMoto
        );
      }

      return true;
    });
  }, [unifiedClients, role, currentWorkshopId, selectedWorkshopFilter, activeFilterTab, searchTerm]);

  // Conteos por estado para los tabs
  const iniciadosCount = useMemo(
    () => unifiedClients.filter((c) => getClientRowData(c).estado === 'iniciado').length,
    [unifiedClients]
  );
  const pendientesCount = useMemo(
    () => unifiedClients.filter((c) => getClientRowData(c).estado === 'pendiente').length,
    [unifiedClients]
  );
  const referentesCount = useMemo(
    () => unifiedClients.filter((c) => getClientRowData(c).estado === 'referente').length,
    [unifiedClients]
  );
  const pagadasCount = useMemo(
    () => unifiedClients.filter((c) => getClientRowData(c).isPaid).length,
    [unifiedClients]
  );
  const pdiOkCount = useMemo(
    () => unifiedClients.filter((c) => c.pdiCompleted).length,
    [unifiedClients]
  );

  // Métricas rápidas
  const totalMotos = useMemo(
    () => filteredClients.reduce((acc, c) => acc + c.motorcycles.length, 0),
    [filteredClients]
  );
  const totalPdiOk = useMemo(
    () => filteredClients.filter((c) => c.pdiCompleted).length,
    [filteredClients]
  );
  const totalSpentAll = useMemo(
    () => filteredClients.reduce((acc, c) => acc + getClientRowData(c).valor, 0),
    [filteredClients]
  );

  const toggleRowExpand = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportCsv = () => {
    const headers = [
      '#',
      'Cédula/RUC',
      'Nombre',
      'Apellido',
      'Origen',
      'Sede',
      'Fecha',
      'Servicio',
      'Valor ($)',
      'Factura',
      'Pagada',
      'Estado',
      'Observaciones',
      'Teléfono',
      'Motocicleta',
      'Placa',
      'Chasis'
    ];

    const rows = filteredClients.map((client, idx) => {
      const data = getClientRowData(client);
      const moto = client.motorcycles[0];
      return [
        idx + 1,
        `"${client.cedulaRuc}"`,
        `"${data.nombre}"`,
        `"${data.apellido}"`,
        `"${data.origen}"`,
        `"${data.sede}"`,
        `"${data.fecha}"`,
        `"${data.servicio}"`,
        data.valor.toFixed(2),
        `"${data.factura}"`,
        data.isPaid ? 'Pagada' : 'Pendiente',
        data.estado.toUpperCase(),
        `"${data.observaciones.replace(/"/g, '""')}"`,
        `"${client.phone || ''}"`,
        `"${moto?.model || ''}"`,
        `"${moto?.plate || ''}"`,
        `"${moto?.chasis || ''}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_starmotos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCedula = (cedula: string) => {
    navigator.clipboard.writeText(cedula);
    setCopiedCedula(cedula);
    setTimeout(() => setCopiedCedula(null), 1800);
  };

  const getCleanWhatsappUrl = (phone: string, clientName: string) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos desde el Taller Oficial StarMotos. ¿En qué podemos ayudarle con su motocicleta?`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  return (
    <div className="h-full w-full flex flex-col overflow-hidden gap-2.5 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. BARRA SUPERIOR COMPACTA: TÍTULO, MÉTRICAS & ACCIONES                   */}
      {/* ========================================================================= */}
      <div className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 shadow-2xs space-y-2 shrink-0">
        {/* Fila 1: Título + Métricas compactas + Botones */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight whitespace-nowrap">
              {role === 'admin'
                ? 'Fichero de Clientes & Flota'
                : role === 'taller'
                ? 'Directorio de Clientes del Taller'
                : 'Clientes & Flota con Garantía'}
            </h2>

            {/* Pills de métricas compactas */}
            <div className="hidden sm:flex items-center gap-1.5 ml-1">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-md whitespace-nowrap">
                {filteredClients.length} Clientes
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-md whitespace-nowrap">
                {totalMotos} Motos
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md whitespace-nowrap">
                {totalPdiOk} PDI OK
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-mono whitespace-nowrap">
                {role === 'garante'
                  ? `${filteredClients.reduce((acc, c) => acc + c.warrantiesCount, 0)} Garantías`
                  : `$${totalSpentAll.toFixed(2)} Facturado`}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
              title="Descargar tabla en formato compatible con Microsoft Excel y Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            {onNavigateToAlistamiento && (
              <button
                type="button"
                onClick={() => onNavigateToAlistamiento()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Alistamiento</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Buscador + Selector de sede + Chips de Filtro */}
        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-zinc-100">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cédula, nombre, placa, VIN..."
              className="w-full pl-8 pr-7 py-1 bg-zinc-50 hover:bg-zinc-100/80 focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 outline-none transition-all font-medium h-7.5"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Sede para Matriz */}
          {role === 'admin' && (
            <div className="w-44 shrink-0">
              <select
                value={selectedWorkshopFilter}
                onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                className="w-full px-2 py-1 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 outline-none focus:border-blue-600 h-7.5"
              >
                <option value="all">🏢 Todas las Sedes</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Chips de filtro */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs py-0.5">
            <button
              type="button"
              onClick={() => setActiveFilterTab('all')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] ${
                activeFilterTab === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              Todos ({unifiedClients.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('iniciado')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] ${
                activeFilterTab === 'iniciado'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              🚀 Iniciados ({iniciadosCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('pendiente')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] ${
                activeFilterTab === 'pendiente'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              ⏳ Pendientes ({pendientesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('referente')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] ${
                activeFilterTab === 'referente'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              ⭐ Referentes ({referentesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('pagada')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] flex items-center gap-1 ${
                activeFilterTab === 'pagada'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Pagadas ({pagadasCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilterTab('pdi_ok')}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer shrink-0 text-[11px] flex items-center gap-1 ${
                activeFilterTab === 'pdi_ok'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>PDI OK ({pdiOkCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLA DE CLIENTES TIPO EXCEL (100% ANCHO, SCROLL INTERNO VERTICAL)    */}
      {/* ========================================================================= */}
      {filteredClients.length > 0 ? (
        <div className="flex-1 min-h-0 w-full bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-2xs">
                <tr className="text-zinc-700 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300 divide-x divide-zinc-200 select-none">
                  <th className="w-[3%] px-1 py-2 text-center text-zinc-500 font-mono">#</th>
                  <th className="w-[10.5%] px-2.5 py-2 truncate">Nombre</th>
                  <th className="w-[10.5%] px-2.5 py-2 truncate">Apellido</th>
                  <th className="w-[9%] px-2 py-2 truncate">Origen</th>
                  <th className="w-[9%] px-2 py-2 truncate">Sede</th>
                  <th className="w-[7.5%] px-1.5 py-2 text-center whitespace-nowrap">Fecha</th>
                  <th className="w-[10.5%] px-2 py-2 truncate">Servicio</th>
                  <th className="w-[6.5%] px-2 py-2 text-right whitespace-nowrap">Valor</th>
                  <th className="w-[8%] px-2 py-2 truncate">Factura</th>
                  <th className="w-[6.5%] px-1.5 py-2 text-center whitespace-nowrap">¿Pagada?</th>
                  <th className="w-[7%] px-1.5 py-2 text-center whitespace-nowrap">Estado</th>
                  <th className="w-[14%] px-2.5 py-2 truncate">Observaciones</th>
                  <th className="w-[8%] px-1.5 py-2 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {filteredClients.map((client, idx) => {
                  const data = getClientRowData(client);
                  const isExpanded = expandedRowIds.has(client.id);
                  const otherRecords = client.records.slice(1);

                  return (
                    <React.Fragment key={client.id}>
                      <tr className="hover:bg-blue-50/50 transition-colors divide-x divide-zinc-200/70 even:bg-zinc-50/40">
                        {/* 1. # */}
                        <td className="px-1 py-2 text-center font-mono text-zinc-400 text-[11px] bg-zinc-50/50">
                          {idx + 1}
                        </td>

                        {/* 2. Nombre */}
                        <td className="px-2.5 py-2 text-zinc-900 truncate" title={`${data.nombre} (C.I. ${client.cedulaRuc})`}>
                          <div className="flex flex-col truncate">
                            <span className="font-bold truncate text-xs">{data.nombre}</span>
                            <span className="text-[10px] font-mono font-normal text-zinc-400 truncate">
                              C.I. {client.cedulaRuc}
                            </span>
                          </div>
                        </td>

                        {/* 3. Apellido */}
                        <td className="px-2.5 py-2 text-zinc-800 truncate" title={data.apellido}>
                          <span className="font-semibold truncate block text-xs">{data.apellido || '—'}</span>
                        </td>

                        {/* 4. Origen */}
                        <td className="px-2 py-2 text-zinc-600 truncate" title={data.origen}>
                          <span className="truncate block text-xs">{data.origen}</span>
                        </td>

                        {/* 5. Sede */}
                        <td className="px-2 py-2 text-zinc-700 truncate" title={data.sede}>
                          <span className="inline-block text-[11px] font-medium bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200/80 truncate max-w-full">
                            {data.sede}
                          </span>
                        </td>

                        {/* 6. Fecha */}
                        <td className="px-1.5 py-2 text-center whitespace-nowrap font-mono text-zinc-600 text-[11px]" title={data.fecha}>
                          {data.fecha}
                        </td>

                        {/* 7. Servicio */}
                        <td className="px-2 py-2 truncate" title={data.servicio}>
                          <div className="flex items-center gap-1 min-w-0">
                            <span className="truncate px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              {data.servicio}
                            </span>
                            {otherRecords.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(client.id)}
                                className="shrink-0 inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-1 py-0.5 rounded border border-blue-200 cursor-pointer"
                                title="Ver historial anterior"
                              >
                                {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                                <span>+{otherRecords.length}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 8. Valor */}
                        <td className="px-2 py-2 text-right font-mono font-bold text-zinc-900 whitespace-nowrap text-xs">
                          ${data.valor.toFixed(2)}
                        </td>

                        {/* 9. Factura */}
                        <td className="px-2 py-2 font-mono font-medium text-zinc-700 truncate text-[11px]" title={data.factura}>
                          <span className="truncate block">{data.factura}</span>
                        </td>

                        {/* 10. ¿Pagada? */}
                        <td className="px-1.5 py-2 text-center whitespace-nowrap">
                          {data.isPaid ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Pagada</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </td>

                        {/* 11. Estado */}
                        <td className="px-1.5 py-2 text-center whitespace-nowrap">
                          {data.estado === 'referente' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              ⭐ Referente
                            </span>
                          )}
                          {data.estado === 'pendiente' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ⏳ Pendiente
                            </span>
                          )}
                          {data.estado === 'iniciado' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              🚀 Iniciado
                            </span>
                          )}
                        </td>

                        {/* 12. Observaciones */}
                        <td className="px-2.5 py-2 text-zinc-600 truncate" title={data.observaciones}>
                          <span className="truncate block text-[11px]">
                            {data.observaciones}
                          </span>
                        </td>

                        {/* 13. Acciones */}
                        <td className="px-1.5 py-2 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedClientForDetail(client)}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title="Ver Ficha y Motos del Cliente"
                            >
                              <Eye className="w-3 h-3 text-zinc-600" />
                              <span>Ficha</span>
                            </button>
                            {client.phone && (
                              <a
                                href={getCleanWhatsappUrl(client.phone, client.fullName)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-0.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="Contactar por WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onNavigateToAlistamiento && (
                              <button
                                type="button"
                                onClick={() => onNavigateToAlistamiento(client.cedulaRuc)}
                                className="p-0.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                title="Nuevo Servicio para este cliente"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Sub-filas expandibles con historial previo */}
                      {isExpanded &&
                        otherRecords.map((histRec, hIdx) => (
                          <tr
                            key={histRec.id || `hist-${hIdx}`}
                            className="bg-blue-50/25 text-zinc-600 divide-x divide-blue-100/70 text-[11px]"
                          >
                            <td className="px-1 py-1.5 text-center font-mono text-zinc-400">↳</td>
                            <td colSpan={2} className="px-2.5 py-1.5 pl-4 italic text-zinc-500 truncate" title={`Servicio anterior de ${data.nombre}`}>
                              Servicio anterior de {data.nombre}
                            </td>
                            <td className="px-2 py-1.5 text-zinc-500 truncate" title={histRec.origen || data.origen}>
                              {histRec.origen || data.origen}
                            </td>
                            <td className="px-2 py-1.5 text-zinc-500 truncate" title={histRec.sede}>
                              {histRec.sede}
                            </td>
                            <td className="px-1.5 py-1.5 text-center font-mono whitespace-nowrap text-[10px]">
                              {histRec.fechaServicio}
                            </td>
                            <td className="px-2 py-1.5 truncate" title={histRec.serviciosRealizados?.join(' + ') || 'Mantenimiento'}>
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 truncate">
                                {histRec.serviciosRealizados?.join(' + ') || 'Mantenimiento'}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono font-semibold text-zinc-700 whitespace-nowrap text-[11px]">
                              ${(histRec.montoPagado || histRec.valorServicio || 0).toFixed(2)}
                            </td>
                            <td className="px-2 py-1.5 font-mono text-zinc-600 truncate text-[10px]" title={histRec.numeroFactura}>
                              {histRec.numeroFactura}
                            </td>
                            <td className="px-1.5 py-1.5 text-center whitespace-nowrap">
                              <span className="text-[10px] font-bold text-emerald-700">✓ Pagada</span>
                            </td>
                            <td className="px-1.5 py-1.5 text-center whitespace-nowrap">
                              <span className="text-[10px] font-bold text-purple-700">Completado</span>
                            </td>
                            <td colSpan={2} className="px-2.5 py-1.5 italic text-zinc-500 truncate" title={histRec.observaciones || '—'}>
                              {histRec.observaciones || '—'}
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-zinc-100 border-t-2 border-zinc-300 font-bold text-zinc-800 text-[11px] shadow-xs z-10">
                <tr className="divide-x divide-zinc-200">
                  <td colSpan={7} className="px-3 py-2 text-right font-mono uppercase tracking-wider text-[11px]">
                    Total ({filteredClients.length} registros):
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-emerald-700 font-black text-xs whitespace-nowrap">
                    ${filteredClients.reduce((sum, c) => sum + getClientRowData(c).valor, 0).toFixed(2)}
                  </td>
                  <td colSpan={5} className="px-3 py-2 text-zinc-600 font-normal text-[11px] truncate">
                    <span className="font-bold text-emerald-700">
                      {filteredClients.filter((c) => getClientRowData(c).isPaid).length} pagadas
                    </span>{' '}
                    •{' '}
                    <span className="font-bold text-amber-700">
                      {filteredClients.filter((c) => !getClientRowData(c).isPaid).length} pendientes
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center p-8 bg-white border border-zinc-200 rounded-xl">
          <div className="text-center space-y-2 max-w-sm">
            <Users className="w-8 h-8 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-bold text-zinc-800">
              No se encontraron clientes con los filtros aplicados
            </h3>
            <p className="text-xs text-zinc-500">
              Verifique la ortografía de la cédula o nombre, o cambie el filtro de sede para ver más resultados.
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilterTab('all');
                  setSelectedWorkshopFilter('all');
                }}
                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg cursor-pointer"
              >
                Restablecer Filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: FICHA DETALLADA DEL CLIENTE & HISTORIAL                         */}
      {/* ========================================================================= */}
      {selectedClientForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-200 animate-slide-in">
            {/* Header Modal */}
            <div className="p-5 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  {selectedClientForDetail.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    {selectedClientForDetail.fullName}
                  </h3>
                  <p className="text-xs text-zinc-300">
                    C.I. / RUC: <span className="font-mono font-bold text-white">{selectedClientForDetail.cedulaRuc}</span> • Sede:{' '}
                    <span className="font-bold text-blue-400">{selectedClientForDetail.workshopName}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientForDetail(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido Modal Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-700">
              {/* Bloque 1: Resumen Propietario & Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-900 block">
                    Contacto Directo
                  </span>
                  <div className="font-mono font-bold text-zinc-800 text-xs">
                    {selectedClientForDetail.phone || 'Sin celular'}
                  </div>
                  {selectedClientForDetail.email && (
                    <div className="text-[11px] text-zinc-600 truncate">
                      {selectedClientForDetail.email}
                    </div>
                  )}
                  {selectedClientForDetail.address && (
                    <div className="text-[10px] text-zinc-500 pt-1 border-t border-blue-200/50">
                      📍 {selectedClientForDetail.address}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-900 block">
                    Cumplimiento Técnico
                  </span>
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                    {selectedClientForDetail.pdiCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Alistamiento PDI Oficial Realizado</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Alistamiento PDI Pendiente</span>
                      </>
                    )}
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Engrasado: <strong>{selectedClientForDetail.engrasadoCompleted ? 'Completado' : 'Pendiente'}</strong>
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    Total Servicios: <strong>{selectedClientForDetail.records.length} registrados</strong>
                  </div>
                </div>

                <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-200/70 space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-900 block">
                    Facturación & Garantías
                  </span>
                  <div className="text-sm font-black font-mono text-purple-950">
                    ${selectedClientForDetail.totalSpent.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-purple-800">
                    Garantías asociadas: <strong>{selectedClientForDetail.warrantiesCount}</strong>
                  </div>
                  <div className="text-[10px] text-purple-700">
                    Origen: <strong>{selectedClientForDetail.origin || 'Almacén Oficial'}</strong>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Motocicletas Registradas */}
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-2 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-blue-600" />
                  <span>Parque Vehicular Registrado ({selectedClientForDetail.motorcycles.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedClientForDetail.motorcycles.map((moto, i) => (
                    <div
                      key={i}
                      className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 text-xs">{moto.model}</div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          VIN: {moto.chasis || 'S/N'}
                          {moto.lastMileage ? ` • ${moto.lastMileage} km` : ''}
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-white border border-zinc-300 rounded-md">
                        {moto.plate || 'S/P'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque 3: Historial de Servicios & Alistamientos */}
              <div>
                <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider mb-2 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Historial de Servicios & Alistamientos ({selectedClientForDetail.records.length})</span>
                </h4>

                {selectedClientForDetail.records.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedClientForDetail.records.map((rec) => (
                      <div
                        key={rec.id}
                        className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-zinc-900">
                              {rec.serviciosRealizados?.map((s) => s.toUpperCase()).join(' • ')}
                            </span>
                            <span className="text-[10px] text-zinc-400">• {rec.fechaServicio}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ${(rec.montoPagado || rec.valorServicio).toFixed(2)} ({rec.metodoPago})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-zinc-600 bg-zinc-50 p-2 rounded-lg">
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Técnico</span>
                            <strong>{rec.tecnicoResponsable}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Kilometraje</span>
                            <strong>{rec.kilometraje} km</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Aceite</span>
                            <strong>{rec.aceite === 'sin_aceite' ? 'Sin Aceite' : rec.nivelAceite || 'Óptimo'}</strong>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-[9px] uppercase">Factura</span>
                            <strong className="font-mono">{rec.numeroFactura || 'S/F'}</strong>
                          </div>
                        </div>

                        {rec.observaciones && (
                          <p className="text-[11px] text-zinc-600 italic bg-zinc-50/50 p-2 rounded border border-zinc-100">
                            "{rec.observaciones}"
                          </p>
                        )}

                        {rec.fotos && rec.fotos.length > 0 && (
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 block mb-1 flex items-center gap-1">
                              <Camera className="w-3 h-3 text-zinc-400" />
                              <span>Evidencias de Entrega ({rec.fotos.length})</span>
                            </span>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                              {rec.fotos.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="aspect-video rounded overflow-hidden border border-zinc-200 block group relative"
                                >
                                  <img
                                    src={url}
                                    alt={`Evidencia ${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">
                    No registra alistamientos o mantenimientos cargados en este portal aún.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-xs text-zinc-500">
                Ficha generada para el sistema integral StarMotos.
              </span>
              <div className="flex items-center gap-2">
                {onNavigateToAlistamiento && (
                  <button
                    type="button"
                    onClick={() => {
                      const cId = selectedClientForDetail.cedulaRuc;
                      setSelectedClientForDetail(null);
                      onNavigateToAlistamiento(cId);
                    }}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar Nuevo Alistamiento / Servicio</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedClientForDetail(null)}
                  className="px-4 py-2 text-xs font-bold bg-white border border-zinc-300 hover:bg-zinc-100 text-zinc-700 rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
