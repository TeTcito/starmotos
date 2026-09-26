// src/components/mobile/common/ClientesModuleMobile.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Users,
  Search,
  Bike,
  Building2,
  Filter,
  Plus,
  ArrowLeft,
  Printer,
  Save,
  Trash2,
  X,
  CheckCircle2,
  UserCheck,
  Wrench,
  FileText,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  AlistamientoFullRecord,
  TallerClient,
  Workshop,
  WarrantyRequest,
  UnifiedClient,
  SystemAlert,
} from '../../../types/customer';
import {
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  saveStoredFullAlistamientos,
  querySriMock,
  addStoredAlerts,
  updateClientCedulaCascade,
} from '../../../data/mockMultiRoleData';
import { cloudSaveClient } from '../../../services/supabaseService';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';

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

export const ClientesModuleMobile: React.FC<Props> = ({
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
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [tallerScope, setTallerScope] = useState<'all' | 'local'>('local');

  // Cliente seleccionado para ver la Ficha Técnica / Detalle
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<UnifiedClient | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<'cliente' | 'moto' | 'servicios'>('cliente');
  const [detailSuccessToast, setDetailSuccessToast] = useState<string | null>(null);

  // Overrides locales para persistencia inmediata
  const [clientOverrides, setClientOverrides] = useState<Record<string, any>>({});

  // Formulario de edición de cliente en detalle
  const [detailFormData, setDetailFormData] = useState<{
    nombres: string;
    apellidos: string;
    cedulaRuc: string;
    phone: string;
    phone2: string;
    email: string;
    address: string;
    origin: string;
    workshopName: string;
    workshopId: string;
    motoModel: string;
    motoPlate: string;
    motoColor: string;
    motoChasis: string;
    motorNumber: string;
    motoYear: string;
    motoMileage: string;
    observaciones: string;
  } | null>(null);

  // Estado para creación de Nuevo Cliente
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [sriFeedback, setSriFeedback] = useState<string | null>(null);
  const [newClientError, setNewClientError] = useState('');
  const [newClientData, setNewClientData] = useState({
    firstNames: '',
    lastNames: '',
    idNumber: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    origin: 'Almacén Oficial',
    workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
    motoBrand: '',
    motoModel: '',
    motoPlate: '',
    motoColor: '',
    motoVin: '',
    motorNumber: '',
    motoYear: '',
    motoMileage: '',
    observaciones: '',
  });

  const getCleanWhatsappUrl = (phoneStr: string, clientName: string) => {
    const cleanDigits = phoneStr.replace(/\D/g, '');
    let fullNumber = cleanDigits;
    if (fullNumber.startsWith('0')) {
      fullNumber = `593${fullNumber.substring(1)}`;
    }
    const message = encodeURIComponent(
      `Estimado/a ${clientName}, le saludamos desde StarMotos. ¿En qué podemos servirle?`
    );
    return `https://wa.me/${fullNumber}?text=${message}`;
  };

  // Unificación de clientes entre fullAlistamientos y clients (idéntico a Desktop pero optimizado)
  const unifiedClients = useMemo<UnifiedClient[]>(() => {
    const map = new Map<string, UnifiedClient>();

    // 1. Procesar registros de Alistamiento
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
      const cost = Number(rec.montoPagado) || Number(rec.valorServicio) || 0;

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

        if (rec.fechaServicio && rec.fechaServicio > existing.lastVisitDate) {
          existing.lastVisitDate = rec.fechaServicio;
          existing.lastServiceType = rec.serviciosRealizados?.join(', ') || 'Mantenimiento';
        }
      }
    });

    // 2. Incorporar clientes de la base clients
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
          origin: 'Almacén Oficial',
          workshopId: c.workshopId || '',
          workshopName: c.workshopName || 'StarMotos Sede',
          motorcycles: [
            {
              model: `${c.motorcycleBrand || ''} ${c.motorcycleModel || ''}`.trim(),
              plate: c.motorcyclePlate,
              chasis: c.motorcycleVin || '',
              lastMileage: c.motorcycleMileage,
            },
          ],
          pdiCompleted: true,
          engrasadoCompleted: false,
          maintenanceCount: c.totalVisits || 1,
          totalSpent: 35.0 * (c.totalVisits || 1),
          lastVisitDate: c.lastVisit || new Date().toISOString().split('T')[0],
          lastServiceType: 'Mantenimiento Periódico',
          warrantiesCount: matchingWarranties.length,
          records: [],
        });
      }
    });

    return Array.from(map.values());
  }, [fullAlistamientos, clients, workshops, warranties]);

  // Filtrado de clientes (búsqueda y taller)
  const filteredClients = useMemo(() => {
    return unifiedClients.filter((client) => {
      const override = clientOverrides[client.cedulaRuc];
      const wsName = override?.workshopName || client.workshopName;
      const wsId = client.workshopId;
      const isMatrizUser = isMatriz || currentWorkshopId === 'matriz-la-mana' || role === 'admin';

      // Filtro de Sede / Taller
      if (role === 'taller' && tallerScope === 'local' && currentWorkshopId && !isMatrizUser) {
        const isMatchLocal =
          wsId === currentWorkshopId ||
          (wsName && wsName.toLowerCase().includes(currentWorkshopId.toLowerCase()));
        if (!isMatchLocal) return false;
      } else if (selectedWorkshopFilter !== 'all') {
        const matchFilter =
          wsId === selectedWorkshopFilter ||
          (wsName && wsName.toLowerCase().includes(selectedWorkshopFilter.toLowerCase()));
        if (!matchFilter) return false;
      }

      // Buscador
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const nombre = (override?.nombres || client.nombres || '').toLowerCase();
        const apellido = (override?.apellidos || client.apellidos || '').toLowerCase();
        const full = (client.fullName || '').toLowerCase();
        const cedula = (client.cedulaRuc || '').toLowerCase();
        const phone = (override?.phone || client.phone || '').toLowerCase();
        const motoModel = (override?.motoModel || client.motorcycles[0]?.model || '').toLowerCase();
        const motoPlate = (override?.motoPlate || client.motorcycles[0]?.plate || '').toLowerCase();

        return (
          nombre.includes(term) ||
          apellido.includes(term) ||
          full.includes(term) ||
          cedula.includes(term) ||
          phone.includes(term) ||
          motoModel.includes(term) ||
          motoPlate.includes(term)
        );
      }

      return true;
    });
  }, [unifiedClients, role, currentWorkshopId, tallerScope, selectedWorkshopFilter, searchTerm, clientOverrides]);

  // Abrir Ficha de Detalle de Cliente
  const handleOpenClientDetail = (client: UnifiedClient) => {
    setSelectedClientForDetail(client);
    setDetailActiveTab('cliente');
    setDetailSuccessToast(null);

    const override = clientOverrides[client.cedulaRuc] || {};
    const firstRec = client.records[0];
    const moto = client.motorcycles[0];

    const nombres = override.nombres ?? client.nombres ?? client.fullName.split(' ')[0] ?? '';
    const apellidos = override.apellidos ?? client.apellidos ?? client.fullName.split(' ').slice(1).join(' ') ?? '';

    setDetailFormData({
      nombres,
      apellidos,
      cedulaRuc: client.cedulaRuc,
      phone: override.phone ?? client.phone ?? '',
      phone2: override.phone2 ?? client.phone2 ?? firstRec?.celular2 ?? '',
      email: override.email ?? client.email ?? '',
      address: override.address ?? client.address ?? firstRec?.direccion ?? '',
      origin: override.origin ?? client.origin ?? firstRec?.origen ?? 'Almacén Oficial',
      workshopName: override.workshopName ?? client.workshopName ?? firstRec?.sede ?? 'StarMotos Sede',
      workshopId: override.workshopId ?? client.workshopId ?? firstRec?.sedeId ?? 'matriz-la-mana',
      motoModel: override.motoModel ?? moto?.model ?? firstRec?.modeloMarca ?? '',
      motoPlate: override.motoPlate ?? moto?.plate ?? firstRec?.placa ?? 'SIN PLACA',
      motoColor: override.motoColor ?? firstRec?.color ?? 'Negro',
      motoChasis: override.motoChasis ?? moto?.chasis ?? firstRec?.chasis ?? '',
      motorNumber: override.motorNumber ?? firstRec?.numeroMotor ?? '',
      motoYear: String(override.motoYear ?? firstRec?.year ?? '2026'),
      motoMileage: String(override.motoMileage ?? moto?.lastMileage ?? firstRec?.kilometraje ?? '0'),
      observaciones: override.observaciones ?? firstRec?.observaciones ?? '',
    });
  };

  // Guardar Cambios en la Ficha del Cliente
  const handleSaveClientDetail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!detailFormData || !selectedClientForDetail) return;

    const oldCedula = (selectedClientForDetail.cedulaRuc || '').trim();
    const newCedula = (detailFormData.cedulaRuc || '').trim();

    if (!newCedula) {
      alert('El número de cédula o RUC no puede estar vacío.');
      return;
    }

    if (newCedula !== oldCedula) {
      const storedClients = getStoredClients();
      const conflict = storedClients.find(
        (c) => c.idNumber && c.idNumber.trim() === newCedula && c.idNumber.trim() !== oldCedula
      );
      if (conflict) {
        const confirmMerge = window.confirm(
          `Ya existe un cliente con la cédula ${newCedula} (${conflict.fullName}). ¿Desea actualizar y unificar esta ficha con esa cédula?`
        );
        if (!confirmMerge) return;
      }
    }

    const fullName = `${detailFormData.nombres} ${detailFormData.apellidos}`.trim();

    // 1. Guardar en estado local de overrides (transferir clave si cambió)
    setClientOverrides((prev) => {
      const next = { ...prev };
      if (oldCedula && oldCedula !== newCedula) {
        delete next[oldCedula];
      }
      next[newCedula] = {
        ...detailFormData,
        cedulaRuc: newCedula,
        fullName,
      };
      return next;
    });

    // 2. Propagar en cascada a base de clientes, alistamientos y garantías
    const extraData: Partial<TallerClient> = {
      fullName,
      phone: detailFormData.phone,
      email: detailFormData.email,
      address: detailFormData.address,
      motorcycleBrand: detailFormData.motoModel.split(' ')[0] || 'StarMotos',
      motorcycleModel: detailFormData.motoModel,
      motorcyclePlate: detailFormData.motoPlate,
      motorcycleVin: detailFormData.motoChasis,
      motorNumber: detailFormData.motorNumber,
      color: detailFormData.motoColor,
      motorcycleMileage: detailFormData.motoMileage !== '' ? Number(detailFormData.motoMileage) : 0,
      workshopName: detailFormData.workshopName,
      workshopId: detailFormData.workshopId,
    };

    updateClientCedulaCascade(oldCedula, newCedula, extraData);

    // 3. Actualizar cliente seleccionado en vista móvil
    setSelectedClientForDetail((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        id: newCedula,
        cedulaRuc: newCedula,
        fullName,
        nombres: detailFormData.nombres,
        apellidos: detailFormData.apellidos,
        phone: detailFormData.phone,
        email: detailFormData.email,
        address: detailFormData.address,
      };
    });

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    setDetailSuccessToast('✓ Ficha técnica y cédula actualizadas correctamente.');
    setTimeout(() => setDetailSuccessToast(null), 3000);
  };

  // Consulta rápida SRI para Nuevo Cliente
  const handleConsultarSri = () => {
    const cleanId = newClientData.idNumber.trim();
    if (!cleanId) return;

    setIsSearchingSri(true);
    setSriFeedback(null);

    setTimeout(() => {
      const data = querySriMock(cleanId);
      setIsSearchingSri(false);

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
        setSriFeedback(`✓ SRI: ${data.razonSocial}`);
      } else {
        setSriFeedback('No encontrado en SRI. Ingrese los datos manualmente.');
      }
    }, 250);
  };

  // Guardar Nuevo Cliente
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    setNewClientError('');

    if (
      !newClientData.firstNames.trim() ||
      !newClientData.lastNames.trim() ||
      !newClientData.idNumber.trim() ||
      !newClientData.phone.trim()
    ) {
      setNewClientError('Por favor complete los campos obligatorios del cliente (Nombres, Apellidos, Cédula, Celular).');
      return;
    }

    if (!newClientData.motoModel.trim() || !newClientData.motoVin.trim()) {
      setNewClientError('Por favor complete Modelo y Chasis/VIN de la motocicleta.');
      return;
    }

    const cleanCedula = newClientData.idNumber.trim();
    const cleanEmail = newClientData.email.trim().toLowerCase() || `${cleanCedula}@starmotos.ec`;
    const fullName = `${newClientData.firstNames.trim()} ${newClientData.lastNames.trim()}`.trim();
    const targetWs = workshops.find((w) => w.id === newClientData.workshopId) || workshops[0];

    const newClient: TallerClient = {
      id: cleanCedula,
      idNumber: cleanCedula,
      fullName,
      phone: newClientData.phone.trim(),
      email: cleanEmail,
      address: newClientData.address.trim(),
      workshopId: targetWs?.id || 'matriz-la-mana',
      workshopName: targetWs?.name || 'StarMotos Matriz La Maná',
      motorcycleBrand: newClientData.motoBrand.trim() || 'StarMotos',
      motorcycleModel: newClientData.motoModel.trim(),
      motorcyclePlate: newClientData.motoPlate.trim().toUpperCase() || 'EN TRÁMITE',
      motorcycleVin: newClientData.motoVin.trim().toUpperCase(),
      motorNumber: newClientData.motorNumber.trim().toUpperCase(),
      color: newClientData.motoColor.trim() || 'Negro',
      motorcycleMileage: Number(newClientData.motoMileage) || 0,
      totalVisits: 1,
      lastVisit: new Date().toISOString().split('T')[0],
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
    } catch (err) {
      console.error('Error al registrar nuevo cliente:', err);
    }

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    setIsCreatingNewClient(false);
    setNewClientData({
      firstNames: '',
      lastNames: '',
      idNumber: '',
      phone: '',
      phone2: '',
      email: '',
      address: '',
      origin: 'Almacén Oficial',
      workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
      motoBrand: 'StarMotos',
      motoModel: '',
      motoPlate: '',
      motoColor: 'Negro',
      motoVin: '',
      motorNumber: '',
      motoYear: '2026',
      motoMileage: '',
      observaciones: '',
    });
  };

  return (
    <div className="w-full flex flex-col min-h-0 space-y-3">
      {/* ========================================================================= */}
      {/* 1. FICHA DE CLIENTE (DETALLE IDÉNTICO A ALISTAMIENTO)                     */}
      {/* ========================================================================= */}
      {selectedClientForDetail && detailFormData && (
        <form
          onSubmit={handleSaveClientDetail}
          className="w-full flex flex-col gap-2.5 animate-fade-in -mt-1.5"
        >
          {/* Encabezado Ficha Técnica del Cliente */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-zinc-200 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-black text-zinc-900 tracking-tight leading-tight truncate">
                    Ficha de cliente
                  </h2>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    ✓ REGISTRADO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                  <span className="font-semibold text-zinc-700 truncate">
                    {detailFormData.nombres} {detailFormData.apellidos}
                  </span>
                  <span>•</span>
                  <span className="shrink-0">C.I. {detailFormData.cedulaRuc}</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas (Iconos) */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Imprimir */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Imprimir Ficha"
              >
                <Printer className="w-4 h-4" />
              </button>

              {/* Nuevo Servicio */}
              {onNavigateToAlistamiento && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToAlistamiento(detailFormData.cedulaRuc);
                    setSelectedClientForDetail(null);
                    setDetailFormData(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Nuevo Servicio con este cliente"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}

              {/* Guardar */}
              <button
                type="submit"
                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="Guardar"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* Eliminar */}
              {onDeleteClient && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `¿Está seguro de eliminar el registro de ${detailFormData.nombres} ${detailFormData.apellidos}?`
                      )
                    ) {
                      onDeleteClient(detailFormData.cedulaRuc);
                      setSelectedClientForDetail(null);
                      setDetailFormData(null);
                    }
                  }}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white active:scale-95 text-red-600 border border-red-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  title="Eliminar Cliente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="h-5 w-px bg-zinc-200 mx-0.5" />

              {/* Regresar */}
              <button
                type="button"
                onClick={() => {
                  setSelectedClientForDetail(null);
                  setDetailFormData(null);
                }}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-800 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Regresar a la Lista"
              >
                <ArrowLeft className="w-4 h-4 text-zinc-600" />
              </button>
            </div>
          </div>

          {/* Toast de Éxito */}
          {detailSuccessToast && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-slide-in shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{detailSuccessToast}</span>
            </div>
          )}

          {/* 3 Pestañas para alternar entre campos */}
          <div className="flex rounded-xl bg-zinc-100 p-1 gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setDetailActiveTab('cliente')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'cliente'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Cliente</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('moto')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'moto'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Bike className="w-3.5 h-3.5 shrink-0" />
              <span>Motocicleta</span>
            </button>
            <button
              type="button"
              onClick={() => setDetailActiveTab('servicios')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                detailActiveTab === 'servicios'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 shrink-0" />
              <span>Historial</span>
            </button>
          </div>

          {/* Contenido según la Pestaña Activa */}
          <div className="w-full">
            {/* 1. CAMPO: CLIENTE */}
            {detailActiveTab === 'cliente' && (
              <div className="space-y-2.5 animate-fade-in pt-1 pb-2">
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Identificación personal</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Cédula o RUC *</label>
                      <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                        Modificable
                      </span>
                    </div>
                    <input
                      type="text"
                      value={detailFormData.cedulaRuc}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 13);
                        setDetailFormData({ ...detailFormData, cedulaRuc: clean });
                      }}
                      placeholder="Ej: 1204567890"
                      maxLength={13}
                      required
                      className="w-full px-2.5 py-1.5 bg-white border border-blue-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nombres *</label>
                    <input
                      type="text"
                      value={detailFormData.nombres}
                      onChange={(e) => setDetailFormData({ ...detailFormData, nombres: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Apellidos *</label>
                    <input
                      type="text"
                      value={detailFormData.apellidos}
                      onChange={(e) => setDetailFormData({ ...detailFormData, apellidos: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-zinc-700">Teléfono / Celular 1 *</label>
                      {detailFormData.phone && (
                        <a
                          href={getCleanWhatsappUrl(detailFormData.phone, `${detailFormData.nombres} ${detailFormData.apellidos}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                    <input
                      type="tel"
                      value={detailFormData.phone}
                      onChange={(e) => setDetailFormData({ ...detailFormData, phone: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Celular 2 (Opcional)</label>
                    <input
                      type="tel"
                      value={detailFormData.phone2 || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, phone2: e.target.value })}
                      placeholder="Opcional"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={detailFormData.email || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Dirección Domiciliaria</label>
                    <input
                      type="text"
                      value={detailFormData.address || ''}
                      onChange={(e) => setDetailFormData({ ...detailFormData, address: e.target.value })}
                      placeholder="Calle principal, secundaria, ciudad"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Sede / Taller</label>
                      <select
                        value={detailFormData.workshopName}
                        onChange={(e) => {
                          const wName = e.target.value;
                          const wObj = workshops.find((w) => w.name === wName);
                          setDetailFormData({
                            ...detailFormData,
                            workshopName: wName,
                            workshopId: wObj?.id || detailFormData.workshopId,
                          });
                        }}
                        className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                      >
                        {workshops.map((w) => (
                          <option key={w.id} value={w.name}>
                            {w.name}
                          </option>
                        ))}
                        {!workshops.some((w) => w.name === detailFormData.workshopName) && (
                          <option value={detailFormData.workshopName}>{detailFormData.workshopName}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-1">Origen / Procedencia</label>
                      <input
                        type="text"
                        value={detailFormData.origin}
                        onChange={(e) => setDetailFormData({ ...detailFormData, origin: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-900 outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CAMPO: MOTOCICLETA */}
            {detailActiveTab === 'moto' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center gap-1.5 pb-1.5 border-b border-zinc-100 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    <Bike className="w-3.5 h-3.5 text-blue-600" />
                    <span>Datos de la Motocicleta</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Modelo y Marca *</label>
                    <input
                      type="text"
                      value={detailFormData.motoModel}
                      onChange={(e) => setDetailFormData({ ...detailFormData, motoModel: e.target.value })}
                      required
                      placeholder="Ej: Loncin CR5 250cc"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-semibold text-zinc-900 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-bold text-zinc-700">Placa Vehicular</label>
                        <button
                          type="button"
                          onClick={() => setDetailFormData({ ...detailFormData, motoPlate: 'SIN PLACA' })}
                          className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          S/P
                        </button>
                      </div>
                      <input
                        type="text"
                        value={detailFormData.motoPlate}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, motoPlate: e.target.value.toUpperCase() })
                        }
                        placeholder="SIN PLACA"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Color</label>
                      <input
                        type="text"
                        value={detailFormData.motoColor || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, motoColor: e.target.value })}
                        placeholder="Ej: Negro / Rojo"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Serie o Chasis (VIN) *</label>
                    <input
                      type="text"
                      value={detailFormData.motoChasis}
                      onChange={(e) =>
                        setDetailFormData({ ...detailFormData, motoChasis: e.target.value.toUpperCase() })
                      }
                      required
                      placeholder="VIN-XXXXXXXXXXXXXXX"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 uppercase outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">N° de Motor</label>
                      <input
                        type="text"
                        value={detailFormData.motorNumber || ''}
                        onChange={(e) =>
                          setDetailFormData({ ...detailFormData, motorNumber: e.target.value.toUpperCase() })
                        }
                        placeholder="Opcional"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 uppercase outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Año / Modelo</label>
                      <input
                        type="text"
                        value={detailFormData.motoYear || ''}
                        onChange={(e) => setDetailFormData({ ...detailFormData, motoYear: e.target.value })}
                        placeholder="2026"
                        className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono text-zinc-900 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Último Kilometraje (km)</label>
                    <input
                      type="number"
                      min="0"
                      value={detailFormData.motoMileage}
                      onFocus={selectOnFocus}
                      onChange={(e) => setDetailFormData({ ...detailFormData, motoMileage: cleanNumberInput(e.target.value) })}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-300 focus:border-blue-600 rounded-lg text-xs font-mono font-bold text-zinc-900 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. CAMPO: HISTORIAL & SERVICIOS */}
            {detailActiveTab === 'servicios' && (
              <div className="space-y-3 animate-fade-in pt-1 pb-3">
                {/* Resumen Operativo */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Invertido</span>
                    <div className="text-sm font-black text-emerald-600 font-mono mt-0.5">
                      ${selectedClientForDetail.totalSpent.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block">Visitas / Servicios</span>
                    <div className="text-sm font-black text-blue-600 font-mono mt-0.5">
                      {selectedClientForDetail.records.length || selectedClientForDetail.maintenanceCount || 1}
                    </div>
                  </div>
                </div>

                {/* Lista de Registros */}
                <div className="bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Historial de Servicios ({selectedClientForDetail.records.length})</span>
                    </div>
                    {onNavigateToAlistamiento && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToAlistamiento(detailFormData.cedulaRuc);
                          setSelectedClientForDetail(null);
                          setDetailFormData(null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nuevo Servicio</span>
                      </button>
                    )}
                  </div>

                  {selectedClientForDetail.records.length > 0 ? (
                    <div className="space-y-2">
                      {selectedClientForDetail.records.map((rec, rIdx) => (
                        <div
                          key={rec.id || rIdx}
                          className="bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900 font-mono">
                              {rec.fechaServicio || 'Fecha s/r'}
                            </span>
                            <span className="font-mono font-bold text-emerald-600">
                              ${Number(rec.montoPagado || rec.valorServicio || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-600 flex items-center gap-1">
                            <Wrench className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span className="capitalize">
                              {rec.serviciosRealizados?.join(', ').replace(/_/g, ' ') || 'Servicio'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-200/60 font-mono">
                            <span>Sede: {rec.sede}</span>
                            <span>{rec.numeroFactura || rec.numeroTicket || 'Sin comp.'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-zinc-500 text-xs">
                      No tiene registros detallados de servicio en el taller.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer de Acciones Ficha Técnica */}
          <div className="pt-1.5 border-t border-zinc-200 flex items-center justify-between gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedClientForDetail(null);
                setDetailFormData(null);
              }}
              className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="whitespace-nowrap">Volver</span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {onNavigateToAlistamiento && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToAlistamiento(detailFormData.cedulaRuc);
                    setSelectedClientForDetail(null);
                    setDetailFormData(null);
                  }}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-black active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Nuevo Servicio</span>
                </button>
              )}

              <button
                type="submit"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Guardar</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 2. FORMULARIO: REGISTRAR NUEVO CLIENTE (DESDE BOTÓN [+ NUEVO])             */}
      {/* ========================================================================= */}
      {isCreatingNewClient && !selectedClientForDetail && (
        <form
          onSubmit={handleSaveNewClient}
          className="w-full bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm space-y-3.5 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-zinc-900">Registrar Nuevo Cliente</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingNewClient(false)}
              className="text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {newClientError && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{newClientError}</span>
            </div>
          )}

          {/* Consulta rápida SRI */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-zinc-700">Cédula o RUC *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newClientData.idNumber}
                onChange={(e) => setNewClientData({ ...newClientData, idNumber: e.target.value })}
                placeholder="Ejemplo: 1723456789"
                className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold outline-none focus:border-blue-600"
                required
              />
              <button
                type="button"
                onClick={handleConsultarSri}
                disabled={isSearchingSri}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isSearchingSri ? 'Buscando...' : 'SRI'}</span>
              </button>
            </div>
            {sriFeedback && (
              <p className="text-[11px] font-semibold text-blue-600 mt-1">{sriFeedback}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Nombres *</label>
              <input
                type="text"
                value={newClientData.firstNames}
                onChange={(e) => setNewClientData({ ...newClientData, firstNames: e.target.value })}
                placeholder="Ejemplo: Juan Carlos"
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Apellidos *</label>
              <input
                type="text"
                value={newClientData.lastNames}
                onChange={(e) => setNewClientData({ ...newClientData, lastNames: e.target.value })}
                placeholder="Ejemplo: Mendoza Zambrano"
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Celular *</label>
              <input
                type="tel"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                placeholder="Ejemplo: 0987654321"
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono outline-none focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Correo</label>
              <input
                type="email"
                value={newClientData.email}
                onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                placeholder="Ejemplo: usuario.cliente99@gmail.com"
                className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Dirección</label>
            <input
              type="text"
              value={newClientData.address}
              onChange={(e) => setNewClientData({ ...newClientData, address: e.target.value })}
              placeholder="Ejemplo: Av. 10 de Agosto y Calle Bolivar #45"
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
            />
          </div>

          {/* Sede */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 mb-0.5">Sede Asignada</label>
            <select
              value={newClientData.workshopId}
              onChange={(e) => setNewClientData({ ...newClientData, workshopId: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-600"
            >
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Datos de la Motocicleta */}
          <div className="pt-2 border-t border-zinc-100 space-y-2">
            <span className="text-[11px] font-black text-zinc-800 uppercase tracking-wider block">
              Datos de la Motocicleta
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-0.5">Modelo y Marca *</label>
                <input
                  type="text"
                  value={newClientData.motoModel}
                  onChange={(e) => setNewClientData({ ...newClientData, motoModel: e.target.value })}
                  placeholder="Ejemplo: Thunder 200, Daytona 250..."
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-0.5">Placa</label>
                <input
                  type="text"
                  value={newClientData.motoPlate}
                  onChange={(e) => setNewClientData({ ...newClientData, motoPlate: e.target.value.toUpperCase() })}
                  placeholder="Ejemplo: AB123C o EN TRÁMITE"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono uppercase outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-0.5">Chasis / VIN *</label>
                <input
                  type="text"
                  value={newClientData.motoVin}
                  onChange={(e) => setNewClientData({ ...newClientData, motoVin: e.target.value.toUpperCase() })}
                  placeholder="Ejemplo: 3SCBP123456789012"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono uppercase outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-bold text-zinc-600 mb-0.5">Color</label>
                <input
                  type="text"
                  value={newClientData.motoColor}
                  onChange={(e) => setNewClientData({ ...newClientData, motoColor: e.target.value })}
                  placeholder="Ejemplo: Negro Mate / Rojo Racing"
                  className="w-full px-2.5 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsCreatingNewClient(false)}
              className="px-3 py-1.5 border border-zinc-300 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cliente</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 3. VISTA PRINCIPAL: LISTADO MÓVIL DE CLIENTES                             */}
      {/* ========================================================================= */}
      {!selectedClientForDetail && !isCreatingNewClient && (
        <div className="w-full flex flex-col gap-3 animate-fade-in">
          {/* Título: Solo 'Clientes' */}
          <div className="flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">
                Clientes
              </h2>
            </div>
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-mono">
              {filteredClients.length} clientes
            </span>
          </div>

          {/* Selector de Ámbito para Taller (Red Nacional vs Sede Local) */}
          {role === 'taller' && (
            <div className="flex bg-zinc-100 p-1 rounded-xl gap-1 shrink-0 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTallerScope('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                  tallerScope === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Red Nacional ({unifiedClients.length})
              </button>
              <button
                type="button"
                onClick={() => setTallerScope('local')}
                className={`flex-1 py-1.5 px-2 rounded-lg transition text-center cursor-pointer ${
                  tallerScope === 'local'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Solo Sede Local
              </button>
            </div>
          )}

          {/* Barra de Herramientas: [+ Nuevo] + [Buscador Aumentado] + [Filtro] */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón "+ Nuevo" al lado izquierdo del buscador */}
            <button
              type="button"
              onClick={() => {
                setNewClientError('');
                setSriFeedback(null);
                setNewClientData({
                  firstNames: '',
                  lastNames: '',
                  idNumber: '',
                  phone: '',
                  phone2: '',
                  email: '',
                  address: '',
                  origin: 'Almacén Oficial',
                  workshopId: currentWorkshopId || workshops[0]?.id || 'matriz-la-mana',
                  motoBrand: '',
                  motoModel: '',
                  motoPlate: '',
                  motoColor: '',
                  motoVin: '',
                  motorNumber: '',
                  motoYear: '',
                  motoMileage: '',
                  observaciones: '',
                });
                setIsCreatingNewClient(true);
              }}
              className="h-11 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
              title="Registrar nuevo cliente"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo</span>
            </button>

            {/* Barra de Búsqueda Aumentada en el centro */}
            <div className="relative flex-1 flex items-center bg-white hover:border-blue-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100 border border-zinc-300 rounded-xl transition-all shadow-2xs h-11 px-3 gap-2">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, CI, moto o placa..."
                className="w-full bg-transparent text-xs font-semibold text-zinc-800 placeholder-zinc-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Botón de Filtro al lado derecho */}
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`h-11 px-3 rounded-xl border flex items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-2xs ${
                selectedWorkshopFilter !== 'all'
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
              title="Filtrar por Sede o Taller"
            >
              <Filter className="w-4 h-4 text-zinc-600" />
            </button>
          </div>

          {/* Menú Desplegable de Filtro */}
          {showFilterDropdown && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-md space-y-2 animate-slide-in">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-blue-600" />
                  <span>Filtrar por Sede / Taller</span>
                </span>
                <button
                  onClick={() => setShowFilterDropdown(false)}
                  className="text-zinc-400 hover:text-zinc-600 cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <select
                value={selectedWorkshopFilter}
                onChange={(e) => {
                  setSelectedWorkshopFilter(e.target.value);
                  setShowFilterDropdown(false);
                }}
                className="w-full px-2.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-900 outline-none focus:border-blue-600"
              >
                <option value="all">Todas las Sedes y Talleres</option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Lista de Tarjetas de Clientes (Una encima de otra, compactas) */}
          <div className="space-y-2">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const override = clientOverrides[client.cedulaRuc];
                const displayName = override?.fullName || client.fullName;
                const moto = override?.motoModel || client.motorcycles[0]?.model || 'Sin motocicleta';
                const plate = override?.motoPlate || client.motorcycles[0]?.plate || 'SIN PLACA';
                const phone = override?.phone || client.phone;
                const workshop = override?.workshopName || client.workshopName;
                const visitsCount = client.records.length || client.maintenanceCount || 1;

                return (
                  <div
                    key={client.id || client.cedulaRuc}
                    onClick={() => handleOpenClientDetail(client)}
                    className="bg-white border border-zinc-200 hover:border-blue-400 rounded-xl p-3 shadow-2xs transition-all active:scale-[0.99] cursor-pointer space-y-2"
                  >
                    {/* Fila 1: Nombre + Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-zinc-900 truncate">
                            {displayName}
                          </span>
                          {currentWorkshopId ? (
                            client.workshopId === currentWorkshopId ||
                            (workshop && workshop.toLowerCase().includes(currentWorkshopId.toLowerCase())) ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                Sede Local
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 shrink-0">
                                <Building2 className="w-2.5 h-2.5 text-blue-600" />
                                Sede: {workshop || 'Red StarMotos'}
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 shrink-0">
                              {workshop || 'Sede StarMotos'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          C.I. {client.cedulaRuc}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {visitsCount} {visitsCount === 1 ? 'servicio' : 'servicios'}
                      </span>
                    </div>

                    {/* Fila 2: Motocicleta y Placa */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                      <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold truncate">{moto}</span>
                      <span className="text-zinc-400">•</span>
                      <span className="font-mono text-zinc-600 text-[11px] font-bold">
                        {plate}
                      </span>
                    </div>

                    {/* Fila 3: Sede y Teléfono WhatsApp */}
                    <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1 truncate max-w-[55%]">
                        <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{workshop}</span>
                      </div>
                      {phone && (
                        <a
                          href={getCleanWhatsappUrl(phone, displayName)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-emerald-600 font-bold flex items-center gap-1 hover:underline shrink-0"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>{phone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 space-y-2">
                <Users className="w-8 h-8 text-zinc-400 mx-auto" />
                <p className="text-xs font-semibold">No se encontraron clientes registrados.</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-blue-600 font-bold underline cursor-pointer"
                  >
                    Limpiar búsqueda
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
