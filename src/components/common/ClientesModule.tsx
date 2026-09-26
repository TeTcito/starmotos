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
  ArrowUpDown,
  Maximize2,
  Sparkles,
  Trash2,
  UserPlus,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  TallerClient,
  Workshop,
  WarrantyRequest,
  UnifiedClient,
  SystemAlert,
} from '../../types/customer';
import {
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  querySriMock,
  addStoredAlerts,
  updateClientCedulaCascade,
} from '../../data/mockMultiRoleData';
import { cloudSaveClient, isValidMediaUrl } from '../../services/supabaseService';
import { cleanNumberInput, selectOnFocus } from '../../utils/numberUtils';

export interface ClientRowData {
  nombre: string;
  apellido: string;
  origen: string;
  sede: string;
  fecha: string;
  serviciosCount: number;
  totalInvertido: number;
  estado: 'iniciado' | 'pendiente' | 'referente';
  observaciones: string;
}

export type SortOption =
  | 'alpha_asc'
  | 'alpha_desc'
  | 'lastname_asc'
  | 'lastname_desc'
  | 'sede_asc'
  | 'recent'
  | 'spent_desc'
  | 'services_desc';

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
  const serviciosCount = client.records.length > 0 ? client.records.length : (client.maintenanceCount || 1);

  // Total Invertido
  const totalInvertido = override?.valor !== undefined
    ? Number(override.valor)
    : (client.totalSpent > 0 ? client.totalSpent : (rec ? (rec.montoPagado || rec.valorServicio || 35.0) : 35.0));

  // Estado: iniciado | pendiente | referente
  let estado: 'iniciado' | 'pendiente' | 'referente' = 'iniciado';
  if (override?.estado) {
    estado = override.estado;
  } else if (client.maintenanceCount >= 2 || (client.pdiCompleted && client.engrasadoCompleted) || client.records.length >= 2) {
    estado = 'referente';
  } else if (!client.pdiCompleted && client.records.length === 0) {
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
    serviciosCount,
    totalInvertido,
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
  onDeleteClient?: (idOrCedula: string) => void;
  isMatriz?: boolean;
}

export const ClientesModule: React.FC<Props> = ({
  role,
  currentWorkshopId,
  workshops,
  fullAlistamientos = [],
  clients = [],
  warranties = [],
  onNavigateToAlistamiento,
  onDeleteClient,
  isMatriz = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<string>('all');
  const [activeFilterTab, setActiveFilterTab] = useState<
    'all' | 'iniciado' | 'pendiente' | 'referente' | 'pdi_ok' | 'warranties'
  >('all');
  const [sortBy, setSortBy] = useState<SortOption>('alpha_asc');
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
    pdiCompleted: boolean;
    engrasadoCompleted: boolean;
    observaciones: string;
  } | null>(null);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [copiedCedula, setCopiedCedula] = useState<string | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);

  // Estado para Vista Completa de "+ Nuevo Cliente" (Registro Manual desde Panel estilo Alistamiento)
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [isSearchingSriNewClient, setIsSearchingSriNewClient] = useState(false);
  const [sriFeedbackNewClient, setSriFeedbackNewClient] = useState<string | null>(null);
  const [newClientError, setNewClientError] = useState('');
  const [isSavingNewClient, setIsSavingNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    firstNames: '',
    lastNames: '',
    idNumber: '',
    phone: '',
    email: '',
    address: '',
    workshopId: currentWorkshopId || (workshops[0]?.id || 'matriz-la-mana'),
    motoBrand: '',
    motoModel: '',
    motoPlate: '',
    motoColor: '',
    motoVin: '',
    motorNumber: '',
    motoMileage: '',
  });

  // Consulta rápida SRI para auto-llenado de datos del cliente
  const handleConsultarSriNewClient = () => {
    const cleanId = newClientData.idNumber.trim();
    if (!cleanId) {
      setSriFeedbackNewClient('Por favor ingrese un número de cédula o RUC para consultar.');
      return;
    }
    setIsSearchingSriNewClient(true);
    setSriFeedbackNewClient(null);

    setTimeout(() => {
      const data = querySriMock(cleanId);
      setIsSearchingSriNewClient(false);
      if (data) {
        const parts = data.razonSocial.split(' ');
        let nombres = '';
        let apellidos = '';
        if (parts.length >= 4) {
          apellidos = `${parts[0]} ${parts[1]}`;
          nombres = parts.slice(2).join(' ');
        } else if (parts.length === 3) {
          apellidos = `${parts[0]} ${parts[1]}`;
          nombres = parts[2];
        } else if (parts.length === 2) {
          apellidos = parts[0];
          nombres = parts[1];
        } else {
          nombres = data.razonSocial;
          apellidos = '';
        }

        setNewClientData((prev) => ({
          ...prev,
          firstNames: nombres || prev.firstNames,
          lastNames: apellidos || prev.lastNames,
          address: data.address || prev.address,
          email: prev.email || data.email,
          phone: prev.phone || data.phone,
        }));
        setSriFeedbackNewClient(`✓ Datos SRI encontrados: ${data.razonSocial}`);
      } else {
        setSriFeedbackNewClient('No se encontró registro en padrón SRI. Puede ingresar los datos manualmente.');
      }
    }, 250);
  };

  const handleCreateNewClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNewClientError('');

    if (
      !newClientData.firstNames.trim() ||
      !newClientData.lastNames.trim() ||
      !newClientData.idNumber.trim() ||
      !newClientData.phone.trim() ||
      !newClientData.email.trim()
    ) {
      setNewClientError('Por favor complete los campos obligatorios del cliente (Nombres, Apellidos, Cédula, Teléfono, Correo).');
      return;
    }

    if (!newClientData.motoModel.trim() || !newClientData.motoVin.trim()) {
      setNewClientError('Por favor complete los campos obligatorios de la moto (Modelo y Chasis/VIN).');
      return;
    }

    setIsSavingNewClient(true);

    const cleanCedula = newClientData.idNumber.trim();
    const cleanEmail = newClientData.email.trim().toLowerCase();
    const fullName = `${newClientData.firstNames.trim()} ${newClientData.lastNames.trim()}`.trim();
    const selectedWs = workshops.find((w) => w.id === newClientData.workshopId) || workshops[0];

    const newClient: TallerClient = {
      id: cleanCedula,
      idNumber: cleanCedula,
      fullName,
      phone: newClientData.phone.trim(),
      email: cleanEmail,
      address: newClientData.address.trim(),
      workshopId: selectedWs?.id || 'matriz-la-mana',
      workshopName: selectedWs?.name || 'StarMotos Matriz La Maná',
      motorcycleBrand: newClientData.motoBrand.trim() || 'StarMotos',
      motorcycleModel: newClientData.motoModel.trim(),
      motorcyclePlate: newClientData.motoPlate.trim().toUpperCase() || 'EN TRÁMITE',
      motorcycleVin: newClientData.motoVin.trim().toUpperCase(),
      motorNumber: newClientData.motorNumber.trim().toUpperCase(),
      color: newClientData.motoColor.trim() || 'Negro',
      motorcycleMileage: Number(newClientData.motoMileage) || 0,
      totalVisits: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      mustChangePassword: true,
      createdManually: true,
    };

    try {
      const stored = getStoredClients();
      const updated = [newClient, ...stored.filter((c) => c.idNumber !== cleanCedula)];
      saveStoredClients(updated);
      cloudSaveClient(newClient);

      // Generar alertas diferenciadas por rol
      const alertsToPush: SystemAlert[] = [];

      // 1. Alerta para Matriz / Admin
      alertsToPush.push({
        id: `alt-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'cliente_creado',
        targetRole: 'admin',
        title: 'Se creó un cliente',
        message: `Se registró al cliente ${newClient.fullName} (${newClient.idNumber}) en ${newClient.workshopName}. Moto: ${newClient.motorcycleBrand} ${newClient.motorcycleModel}.`,
        timestamp: 'Ahora mismo',
        read: false,
        relatedId: newClient.idNumber,
      });

      // 2. Alerta para Taller de la sede
      if (newClient.workshopId) {
        alertsToPush.push({
          id: `alt-tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'cliente_creado',
          targetRole: 'taller',
          targetWorkshopId: newClient.workshopId,
          title: 'Se creó un cliente',
          message: `Se registró al cliente ${newClient.fullName} (${newClient.idNumber}) en tu sede. Moto: ${newClient.motorcycleBrand} ${newClient.motorcycleModel}.`,
          timestamp: 'Ahora mismo',
          read: false,
          relatedId: newClient.idNumber,
        });
      }

      addStoredAlerts(alertsToPush);

      // Guardar credenciales iniciales con cambio obligatorio de clave
      const accounts = JSON.parse(localStorage.getItem('starmotos_registered_accounts') || '{}');
      accounts[cleanEmail] = {
        password: cleanCedula,
        mustChangePassword: true,
      };
      accounts[cleanCedula] = {
        password: cleanCedula,
        mustChangePassword: true,
      };
      localStorage.setItem('starmotos_registered_accounts', JSON.stringify(accounts));
    } catch (err) {
      console.error('Error al registrar nuevo cliente manual:', err);
    }

    setIsSavingNewClient(false);
    setIsCreatingNewClient(false);
    setNewClientData({
      firstNames: '',
      lastNames: '',
      idNumber: '',
      phone: '',
      email: '',
      address: '',
      workshopId: currentWorkshopId || (workshops[0]?.id || 'matriz-la-mana'),
      motoBrand: 'StarMotos',
      motoModel: '',
      motoPlate: '',
      motoColor: '',
      motoVin: '',
      motorNumber: '',
      motoMileage: '',
    });
    setSaveSuccessToast(
      `¡Cliente ${fullName} registrado exitosamente! Usuario: ${cleanEmail} | Clave temporal: ${cleanCedula}`
    );
    setTimeout(() => setSaveSuccessToast(null), 6000);
  };

  // Helper para consultar datos de fila con overrides aplicados
  const getRowData = (c: UnifiedClient) => getClientRowData(c, clientOverrides);

  // Unificación de clientes entre fullAlistamientos y clients
  const unifiedClients = useMemo<UnifiedClient[]>(() => {
    const map = new Map<string, UnifiedClient>();

    // 1. Procesar todos los registros de Alistamiento
    fullAlistamientos.forEach((rec) => {
      const cedula = rec.cedulaRuc.trim();
      if (!cedula) return;

      const ws = workshops.find(
        (w) =>
          w.id === rec.sedeId ||
          w.name.toLowerCase() === rec.sede.toLowerCase() ||
          (rec.sedeId && w.id.toLowerCase().includes(rec.sedeId.toLowerCase()))
      );
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
          workshopId: rec.sedeId || ws?.id || '',
          workshopName: rec.sede || ws?.name || 'StarMotos Sede',
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
        const existingMotoIdx = existing.motorcycles.findIndex(
          (m) => (m.chasis && m.chasis === rec.chasis) || (m.plate && m.plate === rec.placa)
        );
        if (existingMotoIdx >= 0) {
          if (rec.kilometraje !== undefined && (rec.kilometraje > (existing.motorcycles[existingMotoIdx].lastMileage || 0) || existing.motorcycles[existingMotoIdx].lastMileage === undefined)) {
            existing.motorcycles[existingMotoIdx].lastMileage = rec.kilometraje;
          }
        } else if (rec.chasis || rec.placa) {
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
          address: c.address,
          workshopId: c.workshopId || currentWorkshopId || '',
          workshopName: c.workshopName || 'StarMotos Sede',
          motorcycles: [
            {
              model: `${c.motorcycleBrand} ${c.motorcycleModel}`.trim(),
              brand: c.motorcycleBrand,
              plate: c.motorcyclePlate,
              chasis: c.motorcycleVin || 'S/N',
              lastMileage: c.motorcycleMileage,
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

  // Filtrado y Ordenación de clientes
  const filteredClients = useMemo(() => {
    let result = unifiedClients.filter((client) => {
      // Filtro de alcance por rol
      const isMatrizUser = isMatriz || currentWorkshopId === 'matriz-la-mana' || role === 'admin';

      if (role === 'taller' && currentWorkshopId && !isMatrizUser) {
        const matchesWorkshop =
          client.workshopId === currentWorkshopId ||
          client.records.some((r) => r.sedeId === currentWorkshopId);
        if (!matchesWorkshop) return false;
      }

      if ((role === 'admin' || isMatrizUser) && selectedWorkshopFilter !== 'all') {
        const matchesSelected =
          client.workshopId === selectedWorkshopFilter ||
          client.records.some((r) => r.sedeId === selectedWorkshopFilter);
        if (!matchesSelected) return false;
      }

      // Filtro de Tabs
      const row = getRowData(client);
      if (activeFilterTab === 'iniciado' && row.estado !== 'iniciado') return false;
      if (activeFilterTab === 'pendiente' && row.estado !== 'pendiente') return false;
      if (activeFilterTab === 'referente' && row.estado !== 'referente') return false;
      if (activeFilterTab === 'pdi_ok' && !client.pdiCompleted) return false;
      if (activeFilterTab === 'warranties' && client.warrantiesCount === 0) return false;

      // Buscador multi-campo
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = row.nombre.toLowerCase().includes(term);
        const matchApellido = row.apellido.toLowerCase().includes(term);
        const matchCedula = client.cedulaRuc.toLowerCase().includes(term);
        const matchPhone = client.phone?.toLowerCase().includes(term);
        const matchEmail = client.email?.toLowerCase().includes(term);
        const matchOrigen = row.origen.toLowerCase().includes(term);
        const matchSede = row.sede.toLowerCase().includes(term);
        const matchObservaciones = row.observaciones.toLowerCase().includes(term);
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
          matchEmail ||
          matchOrigen ||
          matchSede ||
          matchObservaciones ||
          matchMoto
        );
      }

      return true;
    });

    // Ordenación según selección del usuario
    result.sort((a, b) => {
      const dataA = getRowData(a);
      const dataB = getRowData(b);

      switch (sortBy) {
        case 'alpha_asc':
          return dataA.nombre.localeCompare(dataB.nombre, 'es', { sensitivity: 'base' });
        case 'alpha_desc':
          return dataB.nombre.localeCompare(dataA.nombre, 'es', { sensitivity: 'base' });
        case 'lastname_asc':
          return (dataA.apellido || '').localeCompare(dataB.apellido || '', 'es', { sensitivity: 'base' });
        case 'lastname_desc':
          return (dataB.apellido || '').localeCompare(dataA.apellido || '', 'es', { sensitivity: 'base' });
        case 'sede_asc':
          return dataA.sede.localeCompare(dataB.sede, 'es', { sensitivity: 'base' });
        case 'recent':
          return (b.lastVisitDate || '').localeCompare(a.lastVisitDate || '');
        case 'spent_desc':
          return dataB.totalInvertido - dataA.totalInvertido;
        case 'services_desc':
          return b.records.length - a.records.length;
        default:
          return 0;
      }
    });

    return result;
  }, [unifiedClients, role, currentWorkshopId, selectedWorkshopFilter, activeFilterTab, searchTerm, clientOverrides, sortBy]);

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

  const handleExportCsv = () => {
    const headers = [
      '#',
      'Cédula/RUC',
      'Nombres',
      'Apellidos',
      'Teléfono/WhatsApp',
      'Email',
      'Dirección',
      'Sede/Taller',
      'Origen/Procedencia',
      'Motocicleta',
      'Placa',
      'Chasis/VIN',
      'Servicios Adquiridos',
      'Última Visita',
      'Estado',
      'Observaciones',
    ];

    const rows = filteredClients.map((client, idx) => {
      const data = getRowData(client);
      const moto = client.motorcycles[0];
      return [
        idx + 1,
        `"${client.cedulaRuc}"`,
        `"${data.nombre}"`,
        `"${data.apellido}"`,
        `"${client.phone || ''}"`,
        `"${client.email || ''}"`,
        `"${client.address || ''}"`,
        `"${data.sede}"`,
        `"${data.origen}"`,
        `"${moto?.model || ''}"`,
        `"${moto?.plate || ''}"`,
        `"${moto?.chasis || ''}"`,
        client.records.length,
        `"${client.lastVisitDate}"`,
        data.estado.toUpperCase(),
        `"${data.observaciones.replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `fichero_clientes_starmotos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCedula = (cedula: string) => {
    navigator.clipboard.writeText(cedula);
    setCopiedCedula(cedula);
    setTimeout(() => setCopiedCedula(null), 1800);
  };

  const getCleanWhatsappUrl = (phone: string, clientName: string, isPending: boolean = false) => {
    const cleanDigits = phone.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      isPending
        ? `Estimado/a ${clientName}, le saludamos de StarMotos. Tiene un saldo pendiente, por favor comunicarse con gerencia.`
        : `Estimado/a ${clientName}, le saludamos desde el Taller Oficial StarMotos. ¿En qué podemos ayudarle con su motocicleta?`
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
      workshopName: override.workshopName ?? client.workshopName ?? 'StarMotos Sucursal Quevedo',
      motoModel: override.motoModel ?? client.motorcycles[0]?.model ?? 'Loncin CR5 250cc',
      motoPlate: override.motoPlate ?? client.motorcycles[0]?.plate ?? '',
      motoChasis: override.motoChasis ?? client.motorcycles[0]?.chasis ?? '',
      motoMileage: String(override.motoMileage ?? client.motorcycles[0]?.lastMileage ?? '1000'),
      estado: override.estado ?? row.estado,
      pdiCompleted: override.pdiCompleted !== undefined ? override.pdiCompleted : client.pdiCompleted,
      engrasadoCompleted: override.engrasadoCompleted !== undefined ? override.engrasadoCompleted : client.engrasadoCompleted,
      observaciones: override.observaciones ?? row.observaciones,
    });
  };

  const handleSaveClientForm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!clientFormData || !selectedClientForDetail) return;

    const oldCedula = (selectedClientForDetail.cedulaRuc || '').trim();
    const newCedula = (clientFormData.cedulaRuc || '').trim();

    if (!newCedula) {
      alert('El número de cédula o RUC no puede estar vacío.');
      return;
    }

    // Comprobar si la cédula ya existe en otro cliente diferente
    if (newCedula !== oldCedula) {
      const storedClients = getStoredClients();
      const conflict = storedClients.find(
        (c) => c.idNumber && c.idNumber.trim() === newCedula && c.idNumber.trim() !== oldCedula
      );
      if (conflict) {
        const confirmMerge = window.confirm(
          `Ya existe un cliente registrado con la cédula ${newCedula} (${conflict.fullName}). ¿Desea actualizar y unificar esta ficha con esa cédula?`
        );
        if (!confirmMerge) return;
      }
    }

    const fullName = `${clientFormData.nombres} ${clientFormData.apellidos}`.trim();

    // 1. Guardar en estado local de overrides (transferir clave si la cédula cambió)
    setClientOverrides((prev) => {
      const next = { ...prev };
      if (oldCedula && oldCedula !== newCedula) {
        delete next[oldCedula];
      }
      next[newCedula] = {
        ...clientFormData,
        cedulaRuc: newCedula,
        fullName,
      };
      return next;
    });

    // 2. Propagar en cascada a base de clientes, alistamientos y garantías
    const extraData: Partial<TallerClient> = {
      fullName,
      phone: clientFormData.phone,
      email: clientFormData.email,
      address: clientFormData.address,
      motorcycleBrand: clientFormData.motoModel.split(' ')[0] || 'Moto',
      motorcycleModel: clientFormData.motoModel,
      motorcyclePlate: clientFormData.motoPlate,
      motorcycleVin: clientFormData.motoChasis,
      motorcycleMileage: clientFormData.motoMileage !== '' ? Number(clientFormData.motoMileage) : 0,
      workshopName: clientFormData.workshopName,
    };

    updateClientCedulaCascade(oldCedula, newCedula, extraData);

    // 3. Actualizar el cliente seleccionado en pantalla
    setSelectedClientForDetail((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        id: newCedula,
        cedulaRuc: newCedula,
        fullName,
        nombres: clientFormData.nombres,
        apellidos: clientFormData.apellidos,
        phone: clientFormData.phone,
        email: clientFormData.email,
        address: clientFormData.address,
      };
    });

    setSaveSuccessToast('✓ Ficha técnica y número de cédula actualizados exitosamente en todo el sistema.');
    setTimeout(() => setSaveSuccessToast(null), 3500);
  };

  // Helper para alternar orden al hacer clic en las cabeceras de columna
  const handleSortToggle = (field: 'nombre' | 'apellido' | 'sede' | 'spent' | 'services') => {
    if (field === 'nombre') {
      setSortBy((prev) => (prev === 'alpha_asc' ? 'alpha_desc' : 'alpha_asc'));
    } else if (field === 'apellido') {
      setSortBy((prev) => (prev === 'lastname_asc' ? 'lastname_desc' : 'lastname_asc'));
    } else if (field === 'sede') {
      setSortBy((prev) => (prev === 'sede_asc' ? 'alpha_asc' : 'sede_asc'));
    } else if (field === 'spent') {
      setSortBy((prev) => (prev === 'spent_desc' ? 'recent' : 'spent_desc'));
    } else if (field === 'services') {
      setSortBy((prev) => (prev === 'services_desc' ? 'recent' : 'services_desc'));
    }
  };

  // =========================================================================
  // VISTA: FORMULARIO COMPLETO Y SIMÉTRICO: REGISTRAR NUEVO CLIENTE & MOTO
  // =========================================================================
  if (isCreatingNewClient) {
    return (
      <form
        onSubmit={handleCreateNewClientSubmit}
        className="h-full w-full flex flex-col overflow-hidden gap-3.5 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs relative"
      >
        {/* Cabecera Superior */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewClient(false);
                setNewClientError('');
                setSriFeedbackNewClient(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-98 text-zinc-800 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600" />
              <span>Volver a la Lista de Clientes</span>
            </button>
            <div className="h-6 w-px bg-zinc-200 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  Registro de Nuevo Cliente & Motocicleta
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  + Ingreso Administrativo
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Formulario de alta integral para clientes y motocicletas con credenciales de acceso automático.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewClient(false);
                setNewClientError('');
                setSriFeedbackNewClient(null);
              }}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-bold text-xs transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingNewClient}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingNewClient ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Registrar Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Banner Informativo Superior de Credenciales */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-4 text-xs text-blue-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-blue-950 block">Credenciales y Acceso al Portal del Cliente</span>
              <p className="text-[11px] text-blue-800">
                Al guardar, el cliente podrá acceder con su <strong>Correo</strong> (o Cédula) y como clave temporal su <strong>Cédula</strong>. El sistema le exigirá cambiar la contraseña en su primer inicio de sesión.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-blue-300 text-blue-800 shrink-0 hidden md:inline-flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Cambio forzoso activo
          </span>
        </div>

        {/* Notificación de Error */}
        {newClientError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2 shrink-0 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{newClientError}</span>
          </div>
        )}

        {/* Notificación de Feedback SRI */}
        {sriFeedbackNewClient && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sriFeedbackNewClient}</span>
          </div>
        )}

        {/* Cuerpo del Formulario en 2 Grandes Columnas Simétricas (50% / 50%) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch h-full">
            {/* ======================================================== */}
            {/* COLUMNA 1: DATOS DEL CLIENTE Y CONTACTO                  */}
            {/* ======================================================== */}
            <div className="bg-zinc-50/70 border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900">Datos del Cliente & Acceso</h3>
                      <p className="text-[11px] text-zinc-500">Información del titular y canales de contacto</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Paso 1
                  </span>
                </div>

                {/* Cédula / RUC con botón SRI integrado + Teléfono */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Cédula / RUC *
                      </label>
                      <button
                        type="button"
                        onClick={handleConsultarSriNewClient}
                        disabled={isSearchingSriNewClient}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer transition inline-flex items-center gap-1"
                      >
                        {isSearchingSriNewClient ? (
                          <span className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Search className="w-3 h-3 text-blue-600" />
                        )}
                        <span>Consultar SRI</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newClientData.idNumber}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, idNumber: e.target.value.replace(/\D/g, '').slice(0, 13) })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleConsultarSriNewClient();
                        }
                      }}
                      placeholder="Ejemplo: 1723456789 (10 o 13 dígitos)"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Celular / WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newClientData.phone}
                        onChange={(e) =>
                          setNewClientData({ ...newClientData, phone: e.target.value })
                        }
                        placeholder="Ejemplo: 0987654321"
                        className="w-full pl-8 pr-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-mono text-zinc-900 outline-none transition"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Nombres y Apellidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={newClientData.firstNames}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, firstNames: e.target.value })
                      }
                      placeholder="Ejemplo: Juan Carlos"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-medium text-zinc-900 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={newClientData.lastNames}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, lastNames: e.target.value })
                      }
                      placeholder="Ejemplo: Mendoza Zambrano"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs font-medium text-zinc-900 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Correo Electrónico (Identificador de Login) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      Correo Electrónico (Usuario de Acceso) *
                    </label>
                    <span className="text-[10px] text-zinc-400 font-medium">Acceso portal web</span>
                  </div>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={newClientData.email}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, email: e.target.value })
                      }
                      placeholder="Ejemplo: usuario.cliente99@gmail.com"
                      className="w-full pl-8 pr-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs text-zinc-900 outline-none transition font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Sede Asignada y Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Sede / Taller Asignado
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={newClientData.workshopId}
                        onChange={(e) =>
                          setNewClientData({ ...newClientData, workshopId: e.target.value })
                        }
                        className="w-full pl-8 pr-3 py-2 bg-white hover:border-zinc-400 border border-zinc-300 rounded-xl text-xs text-zinc-900 outline-none focus:border-blue-600 transition cursor-pointer font-medium"
                      >
                        {workshops.map((ws) => (
                          <option key={ws.id} value={ws.id}>
                            {ws.name.replace('StarMotos ', '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Dirección Domiciliaria
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={newClientData.address}
                        onChange={(e) =>
                          setNewClientData({ ...newClientData, address: e.target.value })
                        }
                        placeholder="Ejemplo: Av. 10 de Agosto y Calle Bolivar #45"
                        className="w-full pl-8 pr-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-xl text-xs text-zinc-900 outline-none transition font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa de Credenciales asignadas en tiempo real */}
              <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-2xs space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                    Vista Previa de Cuenta de Acceso
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Automática
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Usuario:</span>
                    <span className="font-mono text-zinc-800 truncate block font-semibold text-[11px]">
                      {newClientData.email.trim() || newClientData.idNumber.trim() || 'esperando correo...'}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Clave Temporal:</span>
                    <span className="font-mono text-zinc-800 truncate block font-semibold text-[11px]">
                      {newClientData.idNumber.trim() || 'esperando cédula...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* COLUMNA 2: DATOS DE LA MOTOCICLETA                      */}
            {/* ======================================================== */}
            <div className="bg-zinc-50/70 border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-900">Ficha Técnica de la Motocicleta</h3>
                      <p className="text-[11px] text-zinc-500">Datos vehiculares para historial y garantías</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Paso 2
                  </span>
                </div>

                {/* Marca y Modelo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={newClientData.motoBrand}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoBrand: e.target.value })
                      }
                      placeholder="Ejemplo: Shineray, Daytona, Loncin..."
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-medium text-zinc-900 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Modelo de la Motocicleta *
                    </label>
                    <input
                      type="text"
                      value={newClientData.motoModel}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoModel: e.target.value })
                      }
                      placeholder="Ejemplo: Thunder 200, Tekken 250, CR5..."
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-medium text-zinc-900 outline-none transition"
                      required
                    />
                  </div>
                </div>

                {/* Placa y Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                        Placa Vehicular
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setNewClientData({ ...newClientData, motoPlate: 'EN TRÁMITE' })
                        }
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 cursor-pointer transition"
                      >
                        + En trámite
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newClientData.motoPlate}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoPlate: e.target.value.toUpperCase() })
                      }
                      placeholder="Ejemplo: AB123C o EN TRÁMITE"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-mono font-bold uppercase text-zinc-900 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Color de la Moto
                    </label>
                    <input
                      type="text"
                      value={newClientData.motoColor}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoColor: e.target.value })
                      }
                      placeholder="Ejemplo: Negro Mate / Rojo Racing"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs text-zinc-900 outline-none transition font-medium"
                    />
                  </div>
                </div>

                {/* Chasis / VIN y Motor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Chasis / VIN (17 dígitos) *
                    </label>
                    <input
                      type="text"
                      value={newClientData.motoVin}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoVin: e.target.value.toUpperCase() })
                      }
                      placeholder="Ejemplo: 3SCBP123456789012"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-mono uppercase text-zinc-900 outline-none transition font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                      Número de Motor (Opcional)
                    </label>
                    <input
                      type="text"
                      value={newClientData.motorNumber}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motorNumber: e.target.value.toUpperCase() })
                      }
                      placeholder="Ejemplo: 167FMM-8472910"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-mono uppercase text-zinc-900 outline-none transition font-medium"
                    />
                  </div>
                </div>

                {/* Kilometraje Actual */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                    Kilometraje Inicial / Actual (km)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={newClientData.motoMileage}
                      onFocus={selectOnFocus}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, motoMileage: cleanNumberInput(e.target.value) })
                      }
                      placeholder="Ejemplo: 0 km (o kilometraje de odómetro)"
                      className="w-full px-3 py-2 bg-white hover:border-zinc-400 focus:bg-white border border-zinc-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none transition"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-zinc-400 font-mono">
                      KM
                    </span>
                  </div>
                </div>
              </div>

              {/* Vista previa de Ficha Técnica Vehicular */}
              <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-2xs space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-700 flex items-center gap-1.5">
                    <Bike className="w-3.5 h-3.5 text-emerald-600" />
                    Vista Previa del Vehículo en Flota
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    StarMotos
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Modelo:</span>
                    <span className="text-zinc-800 truncate block font-bold text-[11px]">
                      {newClientData.motoModel || 'Sin especificar'}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60 text-center">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Placa:</span>
                    <span className="font-mono text-zinc-900 bg-white border border-zinc-300 rounded px-1.5 py-0.5 inline-block font-black text-[11px]">
                      {newClientData.motoPlate || 'EN TRÁMITE'}
                    </span>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/60">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Chasis / VIN:</span>
                    <span className="font-mono text-zinc-800 truncate block font-semibold text-[11px]">
                      {newClientData.motoVin || 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acciones */}
        <div className="pt-3 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-500">
            <span className="font-bold text-red-600">*</span> Campos obligatorios para el registro en el padrón técnico StarMotos.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCreatingNewClient(false);
                setNewClientError('');
                setSriFeedbackNewClient(null);
              }}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingNewClient}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingNewClient ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar y Registrar Cliente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    );
  }

  // =========================================================================
  // VISTA 1: FORMULARIO DEL CLIENTE + TARJETITAS CUADRADAS DE SERVICIOS
  // =========================================================================
  if (selectedClientForDetail && clientFormData) {
    const row = getRowData(selectedClientForDetail);

    return (
      <form
        onSubmit={handleSaveClientForm}
        className="h-full w-full flex flex-col overflow-hidden gap-3 animate-fade-in bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-2xs relative"
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                  Ficha del Cliente: {clientFormData.nombres} {clientFormData.apellidos}
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
                Información personal, vehículo asignado y servicios adquiridos en StarMotos.
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
                  `${clientFormData.nombres} ${clientFormData.apellidos}`,
                  clientFormData.estado === 'pendiente' || activeFilterTab === 'pendiente'
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

            {onDeleteClient && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Está seguro de eliminar permanentemente al cliente ${clientFormData.nombres} ${clientFormData.apellidos} (${clientFormData.cedulaRuc})?`)) {
                    onDeleteClient(clientFormData.cedulaRuc);
                    setSelectedClientForDetail(null);
                    setClientFormData(null);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-lg font-bold text-xs shadow-2xs transition-all cursor-pointer"
                title="Eliminar este cliente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Cliente</span>
              </button>
            )}
          </div>
        </div>

        {/* Notificación Toast si se guardaron cambios */}
        {saveSuccessToast && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
        )}

        {/* Cuerpo del Formulario en 3 Columnas + Abajo Tarjetitas Cuadradas */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1">
          {/* ======================================================== */}
          {/* FORMULARIO DEL CLIENTE: 3 COLUMNAS                       */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* COLUMNA 1: DATOS DEL CLIENTE Y CONTACTO */}
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-zinc-700">Cédula o RUC *</label>
                  <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Modificable
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={clientFormData.cedulaRuc}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 13);
                      setClientFormData({ ...clientFormData, cedulaRuc: clean });
                    }}
                    placeholder="Ej: 1204567890"
                    maxLength={13}
                    required
                    className="w-full pl-3 pr-8 py-1.5 bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all shadow-2xs"
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
                  Teléfono / Celular WhatsApp *
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
                  Teléfono Convencional / Secundario
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
                    placeholder="Almacén de procedencia"
                  />
                </div>
              </div>
            </div>

            {/* COLUMNA 2: DATOS DE LA MOTOCICLETA */}
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
                  onFocus={selectOnFocus}
                  onChange={(e) => setClientFormData({ ...clientFormData, motoMileage: cleanNumberInput(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* COLUMNA 3: CLASIFICACIÓN & OBSERVACIONES */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <div className="flex items-center gap-2 text-zinc-900 font-bold text-xs uppercase tracking-wider">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>3. Estado & Perfil</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">Fidelización</span>
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
                  <option value="pendiente">⏳ Pendiente (En proceso / Incompleto)</option>
                  <option value="referente">⭐ Referente (Cliente Frecuente / VIP)</option>
                </select>
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
                    <span>Alistamiento PDI Oficial Completado</span>
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

              {/* Resumen de Servicios */}
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-zinc-700">
                  <span>Servicios Adquiridos:</span>
                  <strong className="font-mono text-blue-700 font-bold">{selectedClientForDetail.records.length} alistamientos</strong>
                </div>
                <div className="flex items-center justify-between text-zinc-700">
                  <span>Última Visita:</span>
                  <span className="font-mono text-zinc-600">{selectedClientForDetail.lastVisitDate}</span>
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
                  placeholder="Detalles mecánicos, acuerdos de garantía o notas de seguimiento..."
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN INFERIOR: HISTORIAL DE SERVICIOS EN TARJETITAS CUADRADAS           */}
          {/* ========================================================================= */}
          <div className="bg-zinc-50/70 p-4 rounded-xl border border-zinc-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-zinc-900 tracking-wider">
                  Servicios y Alistamientos Adquiridos ({selectedClientForDetail.records.length})
                </h4>
              </div>
            </div>

            {selectedClientForDetail.records.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {selectedClientForDetail.records.map((rec, idx) => (
                  <div
                    key={rec.id || `srv-${idx}`}
                    className="bg-white border border-zinc-200 hover:border-blue-400 hover:shadow-md transition-all rounded-xl p-3.5 flex flex-col justify-between space-y-2.5 shadow-2xs group relative"
                  >
                    {/* Header de la Tarjetita */}
                    <div>
                      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-100">
                        <span className="font-mono text-[10px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 truncate">
                          {rec.numeroFactura ? `FAC: ${rec.numeroFactura}` : (rec.numeroTicket || `OT-${idx + 1}`)}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          <span>{rec.fechaServicio || rec.createdAt}</span>
                        </span>
                      </div>

                      {/* Badges de Servicios Realizados */}
                      <div className="pt-2 flex flex-wrap gap-1">
                        {rec.serviciosRealizados && rec.serviciosRealizados.length > 0 ? (
                          rec.serviciosRealizados.map((serv, sIdx) => (
                            <span
                              key={sIdx}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                serv === 'alistamiento_pdi'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : serv === 'engrasado'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {serv === 'alistamiento_pdi'
                                ? 'PDI Alistamiento'
                                : serv === 'engrasado'
                                ? 'Engrasado'
                                : 'Mantenimiento'}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                            Servicio General
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cuerpo con datos mecánicos */}
                    <div className="bg-zinc-50 p-2.5 rounded-lg border border-zinc-100 text-[11px] space-y-1.5 text-zinc-700">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[10px]">Sede:</span>
                        <strong className="text-zinc-800 truncate max-w-[140px]">{rec.sede}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[10px]">Técnico:</span>
                        <span className="font-semibold text-zinc-800 truncate max-w-[140px]">
                          {rec.tecnicoResponsable}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400 text-[10px]">Kilometraje:</span>
                        <strong className="font-mono text-zinc-900">{rec.kilometraje} km</strong>
                      </div>

                      {rec.observaciones && (
                        <div className="pt-1 border-t border-zinc-200/60 text-[10px] text-zinc-500 italic truncate" title={rec.observaciones}>
                          "{rec.observaciones}"
                        </div>
                      )}
                    </div>

                    {/* Miniaturas de Fotos de Evidencia con Zoom al hacer clic */}
                    {(() => {
                      const validFotos = (rec.fotos || []).filter(isValidMediaUrl);
                      if (validFotos.length === 0) {
                        return (
                          <div className="text-[10px] text-zinc-400 text-center py-1">
                            Sin evidencias fotográficas adjuntas
                          </div>
                        );
                      }
                      return (
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1 mb-1">
                            <Camera className="w-3 h-3 text-zinc-400" />
                            <span>Evidencias Fotográficas ({validFotos.length})</span>
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {validFotos.slice(0, 3).map((fotoUrl, fIdx) => (
                              <div
                                key={fIdx}
                                onClick={() => setPreviewZoomImage(fotoUrl)}
                                className="aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-100 cursor-pointer relative group/img hover:ring-2 hover:ring-blue-500 transition-all"
                                title="Haga clic para ampliar la imagen"
                              >
                                <img
                                  src={fotoUrl}
                                  alt={`Evidencia ${fIdx + 1}`}
                                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-zinc-200 rounded-xl p-6 text-center space-y-2">
                <Wrench className="w-7 h-7 text-zinc-300 mx-auto" />
                <h5 className="text-xs font-bold text-zinc-700">
                  Este cliente aún no registra alistamientos o servicios técnicos realizados.
                </h5>
                <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
                  Al registrar una entrega PDI, engrasado o mantenimiento oficial desde el módulo de Alistamiento, aparecerá aquí automáticamente en su historial de tarjetas.
                </p>
                {onNavigateToAlistamiento && (
                  <button
                    type="button"
                    onClick={() => onNavigateToAlistamiento(clientFormData.cedulaRuc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Iniciar Primer Alistamiento para este cliente</span>
                  </button>
                )}
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
            ← Volver a la Lista
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

        {/* Modal de Zoom de Fotografía de Evidencia */}
        {previewZoomImage && isValidMediaUrl(previewZoomImage) && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewZoomImage(null)}
          >
            <div
              className="relative max-w-3xl w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-3 py-2 text-white border-b border-zinc-800">
                <span className="text-xs font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>Evidencia Fotográfica de Entrega / Servicio</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewZoomImage(null)}
                  className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-hidden">
                <img
                  src={previewZoomImage}
                  alt="Zoom Evidencia"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    );
  }

  // =========================================================================
  // VISTA 2: FICHERO DE CLIENTES & FLOTA (TABLA PURA DE CLIENTES)
  // =========================================================================
  return (
    <div className="h-full w-full flex flex-col overflow-hidden gap-2.5 animate-fade-in relative">
      {/* 1. BARRA SUPERIOR COMPACTA: TÍTULO, MÉTRICAS & ACCIONES */}
      <div className="bg-white border border-zinc-200 rounded-xl px-3.5 py-2 shadow-2xs space-y-2 shrink-0">
        {/* Fila 1: Título + Métricas compactas + Botones */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight whitespace-nowrap">
              {role === 'admin'
                ? 'Fichero de Clientes & Flota StarMotos'
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
                {totalMotos} Motocicletas
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md whitespace-nowrap">
                {totalPdiOk} PDI Completados
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

            <button
              type="button"
              onClick={() => {
                setNewClientError('');
                setSriFeedbackNewClient(null);
                setNewClientData({
                  firstNames: '',
                  lastNames: '',
                  idNumber: '',
                  phone: '',
                  email: '',
                  address: '',
                  workshopId: currentWorkshopId || (workshops[0]?.id || 'matriz-la-mana'),
                  motoBrand: '',
                  motoModel: '',
                  motoPlate: '',
                  motoColor: '',
                  motoVin: '',
                  motorNumber: '',
                  motoMileage: '',
                });
                setIsCreatingNewClient(true);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-lg font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
              title="Registrar manualmente un cliente y su motocicleta con formulario completo"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Buscador + Selector de Sede + Ordenador + Chips de Filtro */}
        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-zinc-100">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cédula, nombre, apellido, placa, chasis..."
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
          {(role === 'admin' || isMatriz || currentWorkshopId === 'matriz-la-mana') && (
            <div className="w-44 shrink-0">
              <select
                value={selectedWorkshopFilter}
                onChange={(e) => setSelectedWorkshopFilter(e.target.value)}
                className="w-full px-2 py-1 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-semibold text-zinc-800 outline-none focus:border-blue-600 h-7.5"
              >
                <option value="all">🏢 Todas las Sedes ({unifiedClients.length})</option>
                {workshops.map((w) => {
                  const count = unifiedClients.filter(
                    (c) => c.workshopId === w.id || c.records.some((r) => r.sedeId === w.id)
                  ).length;
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Selector de Ordenación A-Z, Z-A, etc. */}
          <div className="flex items-center gap-1.5 shrink-0 bg-zinc-50 border border-zinc-300 rounded-lg px-2 h-7.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-zinc-800 outline-none cursor-pointer"
            >
              <option value="alpha_asc">🔤 Nombres: A a la Z</option>
              <option value="alpha_desc">🔤 Nombres: Z a la A</option>
              <option value="lastname_asc">👤 Apellidos: A a la Z</option>
              <option value="lastname_desc">👤 Apellidos: Z a la A</option>
              <option value="sede_asc">🏢 Sede / Taller (A-Z)</option>
              <option value="recent">📅 Más Recientes</option>
              <option value="spent_desc">💰 Mayor Inversión ($)</option>
              <option value="services_desc">🔧 Más Servicios</option>
            </select>
          </div>

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

      {/* 2. TABLA PURA DE CLIENTES (100% ANCHO, SCROLL INTERNO VERTICAL, COLUMNAS DE CLIENTE) */}
      {filteredClients.length > 0 ? (
        <div className="flex-1 min-h-0 w-full bg-white border border-zinc-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-zinc-100 z-10 shadow-2xs">
                <tr className="text-zinc-700 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-300 divide-x divide-zinc-200 select-none">
                  <th className="w-[3%] px-1 py-2 text-center text-zinc-500 font-mono">#</th>
                  <th
                    onClick={() => handleSortToggle('nombre')}
                    className="w-[15%] px-2.5 py-2 truncate cursor-pointer hover:bg-zinc-200/80 transition-colors"
                    title="Clic para ordenar A-Z / Z-A por Nombre"
                  >
                    <div className="flex items-center justify-between">
                      <span>Cliente / Cédula</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('apellido')}
                    className="w-[12%] px-2.5 py-2 truncate cursor-pointer hover:bg-zinc-200/80 transition-colors"
                    title="Clic para ordenar A-Z / Z-A por Apellidos"
                  >
                    <div className="flex items-center justify-between">
                      <span>Apellidos</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="w-[15%] px-2.5 py-2 truncate">Contacto (Celular / Email)</th>
                  <th
                    onClick={() => handleSortToggle('sede')}
                    className="w-[11%] px-2 py-2 truncate cursor-pointer hover:bg-zinc-200/80 transition-colors"
                    title="Clic para ordenar por Sede"
                  >
                    <div className="flex items-center justify-between">
                      <span>Sede / Taller</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="w-[9%] px-2 py-2 truncate">Origen</th>
                  <th className="w-[18%] px-2 py-2 truncate">Motocicleta & Placa</th>
                  <th
                    onClick={() => handleSortToggle('services')}
                    className="w-[7%] px-1.5 py-2 text-center whitespace-nowrap cursor-pointer hover:bg-zinc-200/80 transition-colors"
                    title="Clic para ordenar por Cantidad de Servicios"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Servicios</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>
                  <th className="w-[10%] px-1.5 py-2 text-center whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-zinc-800">
                {filteredClients.map((client, idx) => {
                  const data = getRowData(client);
                  const moto = client.motorcycles[0];

                  return (
                    <tr
                      key={client.id}
                      onClick={() => handleOpenClientForm(client)}
                      className="cursor-pointer hover:bg-blue-50/70 active:bg-blue-100/70 transition-colors divide-x divide-zinc-200/70 even:bg-zinc-50/40 select-none group"
                      title={`Haga clic en cualquier parte de la fila para ver la ficha completa de ${data.nombre} ${data.apellido}`}
                    >
                      {/* 1. # */}
                      <td className="px-1 py-2 text-center font-mono text-zinc-400 text-[11px] bg-zinc-50/50">
                        {idx + 1}
                      </td>

                      {/* 2. Cliente / Cédula */}
                      <td className="px-2.5 py-2 text-zinc-900 truncate" title={`${data.nombre} (C.I. ${client.cedulaRuc})`}>
                        <div className="flex flex-col truncate">
                          <span className="font-bold truncate text-xs group-hover:text-blue-600 transition-colors">
                            {data.nombre}
                          </span>
                          <span className="text-[10px] font-mono font-normal text-zinc-400 truncate">
                            C.I. {client.cedulaRuc}
                          </span>
                        </div>
                      </td>

                      {/* 3. Apellidos */}
                      <td className="px-2.5 py-2 text-zinc-800 truncate" title={data.apellido}>
                        <span className="font-semibold truncate block text-xs group-hover:text-blue-600 transition-colors">
                          {data.apellido || '—'}
                        </span>
                      </td>

                      {/* 4. Contacto (Celular / Email) */}
                      <td className="px-2.5 py-2 text-zinc-700 truncate">
                        <div className="flex flex-col truncate text-[11px]">
                          {client.phone ? (
                            <span className="font-mono font-semibold text-zinc-900 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{client.phone}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-400 italic text-[10px]">Sin teléfono</span>
                          )}
                          {client.email ? (
                            <span className="text-zinc-500 text-[10px] truncate">{client.email}</span>
                          ) : null}
                        </div>
                      </td>

                      {/* 5. Sede / Taller */}
                      <td className="px-2 py-2 text-zinc-700 truncate" title={data.sede}>
                        <span className="inline-block text-[11px] font-medium bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200/80 truncate max-w-full">
                          {data.sede}
                        </span>
                      </td>

                      {/* 6. Origen */}
                      <td className="px-2 py-2 text-zinc-600 truncate" title={data.origen}>
                        <span className="truncate block text-xs">{data.origen}</span>
                      </td>

                      {/* 7. Motocicleta & Placa */}
                      <td className="px-2 py-2 truncate">
                        {moto ? (
                          <div className="flex flex-col truncate">
                            <span className="font-semibold text-zinc-900 text-xs truncate">
                              {moto.model}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500 truncate">
                              Placa: <strong className="text-zinc-700">{moto.plate || 'SIN PLACA'}</strong>
                              {moto.chasis && moto.chasis !== 'S/N' && ` • VIN: ${moto.chasis.slice(-6)}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-400 italic text-[10px]">Sin moto registrada</span>
                        )}
                      </td>

                      {/* 8. Servicios Adquiridos */}
                      <td className="px-1.5 py-2 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                          {client.records.length > 0 ? `${client.records.length} serv.` : `${client.maintenanceCount || 1} serv.`}
                        </span>
                      </td>

                      {/* 9. Acciones */}
                      <td className="px-1.5 py-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenClientForm(client);
                            }}
                            className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 hover:bg-blue-600 hover:text-white text-zinc-700 rounded transition-colors cursor-pointer inline-flex items-center gap-0.5"
                            title="Ver Ficha del Cliente"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Ver</span>
                          </button>
                          {client.phone && (
                            <a
                              href={getCleanWhatsappUrl(
                                client.phone,
                                client.fullName,
                                data.estado === 'pendiente' || activeFilterTab === 'pendiente'
                              )}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
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
                              className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Nuevo Alistamiento / Servicio para este cliente"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteClient && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  window.confirm(
                                    `¿Está seguro de eliminar definitivamente al cliente y usuario ${data.nombre} ${data.apellido} (C.I. ${client.cedulaRuc})?\n\nEsta acción eliminará su cuenta de acceso, sus credenciales y sus registros vinculados en el sistema.`
                                  )
                                ) {
                                  onDeleteClient(client.cedulaRuc);
                                }
                              }}
                              className="p-1 text-red-500 hover:text-white hover:bg-red-600 bg-red-50/60 rounded transition-all cursor-pointer"
                              title="Eliminar Cliente y Cuenta de Usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-zinc-100 border-t-2 border-zinc-300 font-bold text-zinc-800 text-[11px] shadow-xs z-10">
                <tr className="divide-x divide-zinc-200">
                  <td colSpan={7} className="px-3 py-2 text-right font-mono uppercase tracking-wider text-[11px]">
                    Total ({filteredClients.length} clientes en directorio):
                  </td>
                  <td className="px-1.5 py-2 text-center font-mono text-blue-800 font-bold text-xs">
                    {filteredClients.reduce((acc, c) => acc + (c.records.length || c.maintenanceCount || 1), 0)} serv.
                  </td>
                  <td className="px-3 py-2 text-center text-zinc-500 font-normal text-[11px]">
                    <span className="font-bold text-zinc-700">{filteredClients.length}</span> registros
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
              Verifique la búsqueda por cédula, nombre o placa, o cambie el filtro de sede para ver más resultados.
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
