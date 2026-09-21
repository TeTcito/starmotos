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
  ArrowLeft,
  Printer,
  Save,
  UserCheck,
  MapPin,
  CreditCard,
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

export function getClientRowData(
  client: UnifiedClient,
  overrides?: Record<string, any>
): ClientRowData {
  const override = overrides?.[client.cedulaRuc];
  const rec = client.records[0];
  const nombre = override?.nombres || client.nombres || client.fullName.split(' ')[0] || 'Cliente';
  const apellido = override?.apellidos || client.apellidos || client.fullName.split(' ').slice(1).join(' ') || '';
  const origen = override?.origin || client.origin || rec?.origen || 'Almacén Oficial';
  const sede = override?.workshopName || client.workshopName || rec?.sede || 'StarMotos Sede';
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
  const valor = override?.valor !== undefined
    ? Number(override.valor)
    : (rec ? (rec.montoPagado || rec.valorServicio || 0) : (client.totalSpent || 35.0));

  // Factura
  const factura = override?.factura || rec?.numeroFactura || rec?.numeroTicket || `FAC-${client.cedulaRuc.slice(-4)}`;

  // ¿Pagada?
  const isPaid = override?.isPaid !== undefined
    ? Boolean(override.isPaid)
    : (rec ? (rec.montoPagado ?? 0) >= (rec.valorServicio ?? 0) || !!rec.metodoPago : true);

  // Estado: iniciado | pendiente | referente
  let estado: 'iniciado' | 'pendiente' | 'referente' = 'iniciado';
  if (override?.estado) {
    estado = override.estado;
  } else if (client.maintenanceCount >= 2 || (client.pdiCompleted && client.engrasadoCompleted)) {
    estado = 'referente';
  } else if (!isPaid || (!client.pdiCompleted && client.records.length === 0)) {
    estado = 'pendiente';
  } else {
    estado = 'iniciado';
  }

  // Observaciones
  const observaciones = override?.observaciones || rec?.observaciones || 'Registro en sistema StarMotos';

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
  const [clientOverrides, setClientOverrides] = useState<Record<string, any>>({});
  const [clientFormData, setClientFormData] = useState<{
    nombres: string;
    apellidos: string;
    cedulaRuc: string;
    phone: string;
    phone2: string;
    email: string;
    address: string;
    origin: string;
    workshopName: string;
    motoModel: string;
    motoPlate: string;
    motoChasis: string;
    motoMileage: string;
    estado: 'iniciado' | 'pendiente' | 'referente';
    isPaid: boolean;
    valor: number;
    factura: string;
    pdiCompleted: boolean;
    engrasadoCompleted: boolean;
    observaciones: string;
  } | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [copiedCedula, setCopiedCedula] = useState<string | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

  // Helper para consultar datos de fila con overrides aplicados
  const getRowData = (c: UnifiedClient) => getClientRowData(c, clientOverrides);

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
      if (activeFilterTab === 'iniciado' && getRowData(client).estado !== 'iniciado') return false;
      if (activeFilterTab === 'pendiente' && getRowData(client).estado !== 'pendiente') return false;
      if (activeFilterTab === 'referente' && getRowData(client).estado !== 'referente') return false;
      if (activeFilterTab === 'pagada' && !getRowData(client).isPaid) return false;
      if (activeFilterTab === 'pdi_ok' && !client.pdiCompleted) return false;
      if (activeFilterTab === 'warranties' && client.warrantiesCount === 0) return false;

      // Buscador multi-campo
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const data = getRowData(client);
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
  }, [unifiedClients, role, currentWorkshopId, selectedWorkshopFilter, activeFilterTab, searchTerm, clientOverrides]);

  // Conteos por estado para los tabs
  const iniciadosCount = useMemo(
    () => unifiedClients.filter((c) => getRowData(c).estado === 'iniciado').length,
    [unifiedClients, clientOverrides]
  );
  const pendientesCount = useMemo(
    () => unifiedClients.filter((c) => getRowData(c).estado === 'pendiente').length,
    [unifiedClients, clientOverrides]
  );
  const referentesCount = useMemo(
    () => unifiedClients.filter((c) => getRowData(c).estado === 'referente').length,
    [unifiedClients, clientOverrides]
  );
  const pagadasCount = useMemo(
    () => unifiedClients.filter((c) => getRowData(c).isPaid).length,
    [unifiedClients, clientOverrides]
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
    () => filteredClients.reduce((acc, c) => acc + getRowData(c).valor, 0),
    [filteredClients, clientOverrides]
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

  const handleOpenClientForm = (client: UnifiedClient) => {
    setSelectedClientForDetail(client);
    setSaveSuccessToast(null);
    const row = getRowData(client);
    const override = clientOverrides[client.cedulaRuc] || {};
    setClientFormData({
      nombres: override.nombres ?? client.nombres ?? client.fullName.split(' ')[0] ?? '',
      apellidos: override.apellidos ?? client.apellidos ?? client.fullName.split(' ').slice(1).join(' ') ?? '',
      cedulaRuc: client.cedulaRuc,
      phone: override.phone ?? client.phone ?? '',
      phone2: override.phone2 ?? client.phone2 ?? '',
      email: override.email ?? client.email ?? '',
      address: override.address ?? client.address ?? '',
      origin: override.origin ?? client.origin ?? 'Almacén Oficial Quevedo',
      workshopName: override.workshopName ?? client.workshopName ?? 'Sede Quevedo',
      motoModel: override.motoModel ?? client.motorcycles[0]?.model ?? 'Loncin CR5 250cc',
      motoPlate: override.motoPlate ?? client.motorcycles[0]?.plate ?? '',
      motoChasis: override.motoChasis ?? client.motorcycles[0]?.chasis ?? '',
      motoMileage: String(override.motoMileage ?? client.motorcycles[0]?.lastMileage ?? '1000'),
      estado: override.estado ?? row.estado,
      isPaid: override.isPaid !== undefined ? override.isPaid : row.isPaid,
      valor: override.valor !== undefined ? override.valor : row.valor,
      factura: override.factura ?? row.factura,
      pdiCompleted: override.pdiCompleted !== undefined ? override.pdiCompleted : client.pdiCompleted,
      engrasadoCompleted: override.engrasadoCompleted !== undefined ? override.engrasadoCompleted : client.engrasadoCompleted,
      observaciones: override.observaciones ?? row.observaciones,
    });
  };

  const handleSaveClientForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientFormData || !selectedClientForDetail) return;
    setClientOverrides((prev) => ({
      ...prev,
      [clientFormData.cedulaRuc]: {
        ...clientFormData,
        fullName: `${clientFormData.nombres} ${clientFormData.apellidos}`.trim(),
      },
    }));
    setSaveSuccessToast('✓ Datos del cliente actualizados y guardados correctamente.');
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  if (selectedClientForDetail && clientFormData) {
    return (
      <form
        onSubmit={handleSaveClientForm}
        className="h-full w-full flex flex-col overflow-hidden gap-3 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs"
      >
        {/* Cabecera del Formulario */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedClientForDetail(null);
                setClientFormData(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-98 text-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
              <span>Volver a la Lista de Clientes</span>
            </button>
            <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  Formulario del Cliente: {clientFormData.nombres} {clientFormData.apellidos}
                </h2>
                <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-semibold">
                  C.I./RUC: {clientFormData.cedulaRuc}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    clientFormData.estado === 'referente'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : clientFormData.estado === 'iniciado'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {clientFormData.estado === 'referente'
                    ? '⭐ Referente'
                    : clientFormData.estado === 'iniciado'
                    ? '🚀 Iniciado'
                    : '⏳ Pendiente'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Edite los datos del cliente, motocicleta asociada y condiciones de servicio directamente en los campos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
              title="Imprimir ficha del cliente"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ficha</span>
            </button>

            {clientFormData.phone && (
              <a
                href={getCleanWhatsappUrl(
                  clientFormData.phone,
                  `${clientFormData.nombres} ${clientFormData.apellidos}`
                )}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}

            {onNavigateToAlistamiento && (
              <button
                type="button"
                onClick={() => onNavigateToAlistamiento(clientFormData.cedulaRuc)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nuevo Alistamiento</span>
              </button>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {/* Notificación Toast si se guardaron cambios */}
        {saveSuccessToast && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
        )}

        {/* Cuerpo del Formulario en 3 Columnas con scroll interno */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* ======================================================== */}
            {/* COLUMNA 1: DATOS DEL CLIENTE Y CONTACTO                 */}
            {/* ======================================================== */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Datos del Cliente</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Personal</span>
              </div>

              {/* Cédula o RUC */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Cédula o RUC *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientFormData.cedulaRuc}
                    readOnly
                    className="w-full pl-3 pr-8 py-1.5 bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-zinc-800 outline-none cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyCedula(clientFormData.cedulaRuc)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 cursor-pointer"
                    title="Copiar cédula"
                  >
                    {copiedCedula === clientFormData.cedulaRuc ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nombres */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombres *</label>
                <input
                  type="text"
                  value={clientFormData.nombres}
                  onChange={(e) => setClientFormData({ ...clientFormData, nombres: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                  placeholder="Nombres del cliente"
                />
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={clientFormData.apellidos}
                  onChange={(e) => setClientFormData({ ...clientFormData, apellidos: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                  placeholder="Apellidos del cliente"
                />
              </div>

              {/* Celular 1 */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Teléfono / Celular 1 *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={clientFormData.phone}
                    onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                    required
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 outline-none transition-all"
                    placeholder="0991234567"
                  />
                </div>
              </div>

              {/* Celular 2 */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Teléfono Secundario / Convencional
                </label>
                <input
                  type="tel"
                  value={clientFormData.phone2}
                  onChange={(e) => setClientFormData({ ...clientFormData, phone2: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 outline-none transition-all"
                  placeholder="Opcional"
                />
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={clientFormData.email}
                    onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                    placeholder="cliente@ejemplo.com"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Dirección Domiciliaria
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={clientFormData.address}
                    onChange={(e) => setClientFormData({ ...clientFormData, address: e.target.value })}
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-medium text-zinc-900 outline-none transition-all"
                    placeholder="Calle, sector o referencia"
                  />
                </div>
              </div>

              {/* Sede y Origen */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">Sede / Taller</label>
                  <select
                    value={clientFormData.workshopName}
                    onChange={(e) => setClientFormData({ ...clientFormData, workshopName: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                    {!workshops.some((w) => w.name === clientFormData.workshopName) && (
                      <option value={clientFormData.workshopName}>{clientFormData.workshopName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                    Origen / Procedencia
                  </label>
                  <input
                    type="text"
                    value={clientFormData.origin}
                    onChange={(e) => setClientFormData({ ...clientFormData, origin: e.target.value })}
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                    placeholder="Almacén de compra"
                  />
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 2: DATOS DE LA MOTOCICLETA                      */}
            {/* ======================================================== */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                  <Bike className="w-4 h-4 text-blue-600" />
                  <span>2. Motocicleta Asociada</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {selectedClientForDetail.motorcycles.length} Registrada(s)
                </span>
              </div>

              {/* Selector si tiene más de 1 moto */}
              {selectedClientForDetail.motorcycles.length > 1 && (
                <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200">
                  <label className="block text-[10px] font-bold text-zinc-600 mb-1">
                    Seleccionar Unidad de la Flota:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClientForDetail.motorcycles.map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setClientFormData({
                            ...clientFormData,
                            motoModel: m.model || '',
                            motoPlate: m.plate || '',
                            motoChasis: m.chasis || '',
                            motoMileage: String(m.lastMileage || '1000'),
                          });
                        }}
                        className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          clientFormData.motoPlate === m.plate || clientFormData.motoChasis === m.chasis
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        {m.model} ({m.plate || 'S/P'})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Modelo y Marca */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Modelo y Marca *</label>
                <input
                  type="text"
                  value={clientFormData.motoModel}
                  onChange={(e) => setClientFormData({ ...clientFormData, motoModel: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                  placeholder="Ej: Loncin CR5 250cc, Tekken 250..."
                />
              </div>

              {/* Placa Vehicular */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Placa Vehicular</label>
                <div className="relative">
                  <input
                    type="text"
                    value={clientFormData.motoPlate}
                    onChange={(e) =>
                      setClientFormData({ ...clientFormData, motoPlate: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                    placeholder="Ej: AB123C o SIN PLACA"
                  />
                </div>
              </div>

              {/* Número de Chasis / VIN */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Número de Chasis / VIN *
                </label>
                <input
                  type="text"
                  value={clientFormData.motoChasis}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, motoChasis: e.target.value.toUpperCase() })
                  }
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-medium text-zinc-900 uppercase outline-none transition-all"
                  placeholder="17 dígitos de chasis o serie"
                />
              </div>

              {/* Kilometraje Actual */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Kilometraje Registrado (km)
                </label>
                <input
                  type="number"
                  min="0"
                  value={clientFormData.motoMileage}
                  onChange={(e) => setClientFormData({ ...clientFormData, motoMileage: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  placeholder="0"
                />
              </div>

              {/* Resumen del Vehículo */}
              <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">
                  Resumen del Vehículo
                </span>
                <div className="text-zinc-800 font-semibold">{clientFormData.motoModel || 'Sin modelo'}</div>
                <div className="text-[11px] text-zinc-600 font-mono">
                  Placa: <strong>{clientFormData.motoPlate || 'SIN PLACA'}</strong> • Km:{' '}
                  <strong>{clientFormData.motoMileage || '0'} km</strong>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 3: CLASIFICACIÓN, FACTURACIÓN & NOTAS            */}
            {/* ======================================================== */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. Estado & Facturación</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Control</span>
              </div>

              {/* Estado del Cliente */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">Estado del Cliente</label>
                <select
                  value={clientFormData.estado}
                  onChange={(e) => setClientFormData({ ...clientFormData, estado: e.target.value as any })}
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-bold text-zinc-900 outline-none"
                >
                  <option value="iniciado">🚀 Iniciado (Nuevo ingreso)</option>
                  <option value="pendiente">⏳ Pendiente (En proceso / Falta pago)</option>
                  <option value="referente">⭐ Referente (Cliente Frecuente / VIP)</option>
                </select>
              </div>

              {/* Estado de Cobro y Factura */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">¿Factura Pagada?</label>
                  <select
                    value={clientFormData.isPaid ? 'true' : 'false'}
                    onChange={(e) =>
                      setClientFormData({ ...clientFormData, isPaid: e.target.value === 'true' })
                    }
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-bold text-zinc-900 outline-none focus:border-blue-600"
                  >
                    <option value="true">✓ Pagada</option>
                    <option value="false">⏳ Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-700 mb-1">Monto Cobrado ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={clientFormData.valor}
                    onChange={(e) =>
                      setClientFormData({ ...clientFormData, valor: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-mono font-bold text-emerald-800 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* N° Factura */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  N° Factura o Comprobante
                </label>
                <input
                  type="text"
                  value={clientFormData.factura}
                  onChange={(e) => setClientFormData({ ...clientFormData, factura: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  placeholder="FAC-001-0921"
                />
              </div>

              {/* Cumplimiento Técnico */}
              <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 space-y-2">
                <label className="block text-[10px] font-black uppercase text-zinc-700">
                  Cumplimiento Técnico Oficial:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clientFormData.pdiCompleted}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, pdiCompleted: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Alistamiento PDI Completado</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clientFormData.engrasadoCompleted}
                      onChange={(e) =>
                        setClientFormData({ ...clientFormData, engrasadoCompleted: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Engrasado General Realizado</span>
                  </label>
                </div>
              </div>

              {/* Observaciones Generales */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Observaciones / Notas del Cliente
                </label>
                <textarea
                  rows={3}
                  value={clientFormData.observaciones}
                  onChange={(e) =>
                    setClientFormData({ ...clientFormData, observaciones: e.target.value })
                  }
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs text-zinc-900 outline-none transition-all resize-none"
                  placeholder="Detalles mecánicos, acuerdos de garantía o notas..."
                />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECCIÓN INFERIOR: HISTORIAL DE SERVICIOS & FOTOS          */}
          {/* ======================================================== */}
          <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-zinc-900 tracking-wider flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                <span>Historial de Servicios & Evidencias ({selectedClientForDetail.records.length})</span>
              </h4>
              <span className="text-[10px] text-zinc-500">
                Total Acumulado: <strong>${selectedClientForDetail.totalSpent.toFixed(2)}</strong>
              </span>
            </div>

            {selectedClientForDetail.records.length > 0 ? (
              <div className="space-y-2.5">
                {selectedClientForDetail.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white border border-zinc-200 rounded-xl p-3.5 space-y-2 hover:border-zinc-300 transition-colors shadow-2xs"
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
                        <strong>
                          {rec.aceite === 'sin_aceite'
                            ? 'Sin Aceite'
                            : `${rec.aceite} (${rec.nivelAceite || 'Óptimo'})`}
                        </strong>
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
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center text-zinc-500 text-xs">
                No registra alistamientos o servicios previos cargados en este portal.
              </div>
            )}
          </div>
        </div>

        {/* Footer del Formulario */}
        <div className="pt-3 border-t border-zinc-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedClientForDetail(null);
              setClientFormData(null);
            }}
            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            ← Cancelar / Volver a la Lista
          </button>

          <div className="flex items-center gap-2">
            {onNavigateToAlistamiento && (
              <button
                type="button"
                onClick={() => onNavigateToAlistamiento(clientFormData.cedulaRuc)}
                className="px-3.5 py-1.5 bg-zinc-800 hover:bg-black text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Iniciar Alistamiento con este Cliente</span>
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </form>
    );
  }

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
                  const data = getRowData(client);
                  const isExpanded = expandedRowIds.has(client.id);
                  const otherRecords = client.records.slice(1);

                  return (
                    <React.Fragment key={client.id}>
                      <tr
                        onClick={() => handleOpenClientForm(client)}
                        className="cursor-pointer hover:bg-blue-50/70 active:bg-blue-100/70 transition-colors divide-x divide-zinc-200/70 even:bg-zinc-50/40 select-none group"
                        title={`Haga clic en cualquier lado para abrir el formulario de ${data.nombre} ${data.apellido}`}
                      >
                        {/* 1. # */}
                        <td className="px-1 py-2 text-center font-mono text-zinc-400 text-[11px] bg-zinc-50/50">
                          {idx + 1}
                        </td>

                        {/* 2. Nombre */}
                        <td className="px-2.5 py-2 text-zinc-900 truncate" title={`${data.nombre} (C.I. ${client.cedulaRuc})`}>
                          <div className="flex flex-col truncate">
                            <span className="font-bold truncate text-xs group-hover:text-blue-600 transition-colors">{data.nombre}</span>
                            <span className="text-[10px] font-mono font-normal text-zinc-400 truncate">
                              C.I. {client.cedulaRuc}
                            </span>
                          </div>
                        </td>

                        {/* 3. Apellido */}
                        <td className="px-2.5 py-2 text-zinc-800 truncate" title={data.apellido}>
                          <span className="font-semibold truncate block text-xs group-hover:text-blue-600 transition-colors">{data.apellido || '—'}</span>
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpand(client.id);
                                }}
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
                        <td className="px-2 py-2 text-right whitespace-nowrap font-mono font-bold text-xs text-zinc-900" title={`$${data.valor.toFixed(2)}`}>
                          ${data.valor.toFixed(2)}
                        </td>

                        {/* 9. Factura */}
                        <td className="px-2 py-2 text-zinc-600 truncate font-mono text-[11px]" title={data.factura}>
                          {data.factura}
                        </td>

                        {/* 10. ¿Pagada? */}
                        <td className="px-1.5 py-2 text-center whitespace-nowrap">
                          {data.isPaid ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Pagada
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              ⏳ Pendiente
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenClientForm(client);
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-100 hover:bg-blue-600 hover:text-white text-zinc-700 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                              title="Ver Formulario del Cliente"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Formulario</span>
                            </button>
                            {client.phone && (
                              <a
                                href={getCleanWhatsappUrl(client.phone, client.fullName)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-0.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                title="Contactar por WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {onNavigateToAlistamiento && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigateToAlistamiento(client.cedulaRuc);
                                }}
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
    </div>
  );
};
