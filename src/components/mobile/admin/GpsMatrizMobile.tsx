// src/components/mobile/admin/GpsMatrizMobile.tsx
import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Radio,
  Plus,
  Search,
  KeyRound,
  Lock,
  Calendar,
  DollarSign,
  Bike,
  Trash2,
  CheckCircle2,
  Clock,
  Smartphone,
  Phone,
  MessageCircle,
  X,
  AlertCircle,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Eye,
  Camera,
  Upload,
  Wrench,
  CreditCard,
  MapPin,
  Cpu,
} from 'lucide-react';
import { GpsRecord, SystemAlert, Technician, Workshop, TallerClient } from '../../../types/customer';
import {
  getStoredClients,
  saveStoredClients,
  getStoredFullAlistamientos,
  querySriMock,
  saveStoredGpsRecord,
  deleteStoredGpsRecord,
  addStoredAlerts,
  getRegisteredBrands,
  getStoredTechnicians,
  getStoredWorkshops,
} from '../../../data/mockMultiRoleData';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { compressImageBase64 } from '../../../utils/imageCompressor';
import { isValidMediaUrl } from '../../../services/mediaStorage';
import { GpsCredentialDetailModal } from '../../common/GpsCredentialDetailModal';

interface Props {
  records: GpsRecord[];
  onSaveRecord?: (record: GpsRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GpsMatrizMobile: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'activa'>('all');

  // Modo edición / detalle
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GpsRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRecordForCredentials, setSelectedRecordForCredentials] = useState<GpsRecord | null>(null);

  // Fechas por defecto
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const initialFormData = {
    id: '',
    ticketNumber: '',
    // Módulo 1: Sede & Cliente & 3 Celulares
    sede: 'StarMotos Matriz La Maná',
    sedeId: 'matriz-la-mana',
    cedulaRuc: '',
    nombres: '',
    apellidos: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    // Módulo 2: Motocicleta & Hardware GPS
    placa: '',
    modeloMarca: '',
    chasis: '',
    numeroMotor: '',
    color: '',
    year: new Date().getFullYear(),
    kilometraje: 0,
    serieGps: '',
    serieChip: '',
    // Módulo 3: Vigencia, Técnico & Contabilidad Matriz
    tecnicoResponsable: '',
    fechaInicio: todayStr,
    fechaVencimiento: nextYearStr,
    valorServicio: 180.0,
    montoPagado: 180.0,
    metodoPago: 'Efectivo' as 'Efectivo' | 'Transferencia',
    evidenciaTransferencia: '',
    fotos: [] as string[],
    observaciones: '',
    // Estado y credenciales
    estado: 'pendiente' as GpsRecord['estado'],
    gpsUser: '',
    gpsPassword: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<{ title: string; fields: string[] } | null>(null);

  // Marcas registradas para autocomplete
  const registeredBrands = useMemo(() => getRegisteredBrands(), []);

  // Lista oficial de Sedes / Talleres de StarMotos
  const workshopsList = useMemo(() => getStoredWorkshops(), []);

  // Lista de Técnicos disponibles
  const techniciansList = useMemo(() => getStoredTechnicians(), []);

  // Técnicos filtrados dinámicamente según la sede de atención seleccionada
  const availableTechniciansForSede = useMemo(() => {
    const currentWsId = (formData.sedeId || '').toLowerCase().trim();
    const currentWsName = (formData.sede || '').toLowerCase().trim();

    if (!currentWsId && !currentWsName) {
      return techniciansList;
    }

    const currentWs = workshopsList.find(
      (w) => w.id === formData.sedeId || w.name.toLowerCase() === currentWsName
    );
    const cityKey = currentWs?.city ? currentWs.city.split(',')[0].toLowerCase().trim() : '';

    const matching = techniciansList.filter((t) => {
      const tWsId = (t.workshopId || '').toLowerCase().trim();
      const tWsName = (t.workshopName || '').toLowerCase().trim();

      // 1. Coincidencia directa por ID de taller
      if (tWsId && currentWsId && tWsId === currentWsId) return true;

      // 2. Coincidencia por nombre de taller
      if (tWsName && currentWsName && (tWsName.includes(currentWsName) || currentWsName.includes(tWsName))) return true;

      // 3. Coincidencia por ciudad
      if (cityKey && (tWsName.includes(cityKey) || tWsId.includes(cityKey))) return true;

      return false;
    });

    return matching;
  }, [techniciansList, formData.sedeId, formData.sede, workshopsList]);

  // Base de datos local para autocompletado rápido
  const existingClients = useMemo(() => {
    const list = getStoredClients();
    const alistamientos = getStoredFullAlistamientos();
    const map = new Map<string, {
      idNumber: string;
      fullName: string;
      phone?: string;
      email?: string;
      address?: string;
      bike?: string;
      plate?: string;
      vin?: string;
      workshopId?: string;
      workshopName?: string;
    }>();

    list.forEach((c) => {
      if (c.idNumber) {
        map.set(c.idNumber.trim(), {
          idNumber: c.idNumber,
          fullName: c.fullName,
          phone: c.phone,
          email: c.email,
          address: c.address,
          bike: `${c.motorcycleBrand || ''} ${c.motorcycleModel || ''}`.trim(),
          plate: c.motorcyclePlate,
          vin: c.motorcycleVin,
          workshopId: c.workshopId,
          workshopName: c.workshopName,
        });
      }
    });

    alistamientos.forEach((a) => {
      if (a.cedulaRuc) {
        const prev = map.get(a.cedulaRuc.trim());
        map.set(a.cedulaRuc.trim(), {
          idNumber: a.cedulaRuc,
          fullName: `${a.nombres} ${a.apellidos}`.trim(),
          phone: a.celular1 || prev?.phone,
          email: a.email || prev?.email,
          address: a.direccion || prev?.address,
          bike: a.modeloMarca || prev?.bike,
          plate: a.placa || prev?.plate,
          vin: a.chasis || prev?.vin,
          workshopId: a.sedeId || prev?.workshopId,
          workshopName: a.sede || prev?.workshopName,
        });
      }
    });

    return Array.from(map.values());
  }, []);

  // Guardar cliente directamente a la base de datos
  const handleSaveClientToDatabase = () => {
    if (!formData.cedulaRuc.trim() || !formData.nombres.trim()) {
      showToast?.('Ingrese al menos cédula y nombres para guardar el cliente.', 'error');
      return;
    }
    const cleanId = formData.cedulaRuc.trim();
    const cleanNombres = formData.nombres.trim();
    const cleanApellidos = formData.apellidos.trim();
    const fullName = `${cleanNombres} ${cleanApellidos}`.trim();
    const currentClients = getStoredClients();
    const existingIndex = currentClients.findIndex(
      (c) => c.idNumber && c.idNumber.trim().toLowerCase() === cleanId.toLowerCase()
    );

    const clientToSave: TallerClient = {
      id: existingIndex >= 0 ? currentClients[existingIndex].id : `cli-${Date.now()}`,
      fullName,
      idNumber: cleanId,
      phone: formData.celular1.trim() || (existingIndex >= 0 ? currentClients[existingIndex].phone : ''),
      email: formData.email.trim() || (existingIndex >= 0 ? currentClients[existingIndex].email : ''),
      address: formData.direccion.trim() || (existingIndex >= 0 ? currentClients[existingIndex].address : ''),
      motorcycleBrand: formData.modeloMarca ? formData.modeloMarca.split(' ')[0] : (existingIndex >= 0 ? currentClients[existingIndex].motorcycleBrand : 'Benelli'),
      motorcycleModel: formData.modeloMarca.trim() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleModel : 'Modelo por definir'),
      motorcyclePlate: formData.placa.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcyclePlate : 'S/P'),
      motorcycleVin: formData.chasis.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleVin : undefined),
      motorNumber: formData.numeroMotor?.trim().toUpperCase() || (existingIndex >= 0 ? currentClients[existingIndex].motorNumber : undefined),
      color: formData.color?.trim() || (existingIndex >= 0 ? currentClients[existingIndex].color : undefined),
      motorcycleMileage: Number(formData.kilometraje) || (existingIndex >= 0 ? currentClients[existingIndex].motorcycleMileage : 0),
      year: Number(formData.year) || (existingIndex >= 0 ? currentClients[existingIndex].year : new Date().getFullYear()),
      lastVisit: todayStr,
      totalVisits: existingIndex >= 0 ? (currentClients[existingIndex].totalVisits || 1) + 1 : 1,
      workshopId: formData.sedeId || 'matriz-la-mana',
      workshopName: formData.sede || 'StarMotos Matriz La Maná',
    };

    let updatedClients: TallerClient[];
    if (existingIndex >= 0) {
      updatedClients = [...currentClients];
      updatedClients[existingIndex] = clientToSave;
    } else {
      updatedClients = [clientToSave, ...currentClients];
    }
    saveStoredClients(updatedClients);
    showToast?.('✓ Cliente guardado exitosamente en la base de datos.', 'success');
  };

  // Consultar Cédula o RUC
  const handleConsultar = (idOverride?: string) => {
    const idToSearch = (idOverride !== undefined ? idOverride : formData.cedulaRuc).trim();
    if (!idToSearch) return;

    setSearchFeedback(null);

    // 1. Base local de clientes
    const localMatch = existingClients.find((c) => c.idNumber.trim() === idToSearch);
    if (localMatch) {
      const parts = localMatch.fullName.split(' ');
      const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
      const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

      const matchedWs = workshopsList.find(
        (w) =>
          (localMatch.workshopId && w.id === localMatch.workshopId) ||
          (localMatch.workshopName && (w.name.toLowerCase() === localMatch.workshopName.toLowerCase() || w.name.toLowerCase().includes(localMatch.workshopName.toLowerCase())))
      );
      const targetSede = matchedWs ? matchedWs.name : (localMatch.workshopName || formData.sede || 'StarMotos Matriz La Maná');
      const targetSedeId = matchedWs ? matchedWs.id : (localMatch.workshopId || formData.sedeId || 'matriz-la-mana');

      setFormData((prev) => ({
        ...prev,
        cedulaRuc: idToSearch,
        sede: targetSede,
        sedeId: targetSedeId,
        nombres: nombres || localMatch.fullName,
        apellidos: apellidos || '',
        celular1: localMatch.phone || prev.celular1,
        email: localMatch.email || prev.email,
        direccion: localMatch.address || prev.direccion,
        modeloMarca: localMatch.bike || prev.modeloMarca,
        placa: localMatch.plate || prev.placa,
        chasis: localMatch.vin || prev.chasis,
        tecnicoResponsable: '',
      }));
      setSearchFeedback(`✓ Cliente recuperado (${targetSede}): ${localMatch.fullName}`);
      showToast?.(`Cliente recuperado (${targetSede}): ${localMatch.fullName}`, 'info');
      return;
    }

    // 2. SRI
    setIsSearchingSri(true);
    setTimeout(() => {
      setIsSearchingSri(false);
      const res = querySriMock(idToSearch);
      if (res && res.razonSocial) {
        const parts = res.razonSocial.split(' ');
        const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
        const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');

        setFormData((prev) => ({
          ...prev,
          cedulaRuc: idToSearch,
          nombres: nombres || res.razonSocial,
          apellidos: apellidos || '',
          direccion: res.address || prev.direccion,
        }));
        setSearchFeedback(`✓ SRI: ${res.razonSocial}`);
        showToast?.(`SRI: Razón Social recuperada: ${res.razonSocial}`, 'success');
      } else {
        setSearchFeedback('⚠ No encontrado en SRI ni en base local.');
      }
    }, 500);
  };

  // Iniciar nuevo registro
  const handleStartNewGps = (cedulaPreFill = '') => {
    setSelectedRecordForDetail(null);
    setIsEditing(false);
    setValidationAlert(null);
    setSearchFeedback(null);
    setMobileStep(1);
    setFormData({
      ...initialFormData,
      cedulaRuc: cedulaPreFill,
    });
    setViewMode('form');
    if (cedulaPreFill.length >= 8) {
      setTimeout(() => handleConsultar(cedulaPreFill), 100);
    }
  };

  // Abrir registro existente para ver/editar
  const handleOpenRecordDetail = (record: GpsRecord) => {
    setSelectedRecordForDetail(record);
    setIsEditing(true);
    setValidationAlert(null);
    setSearchFeedback(null);
    setMobileStep(1);
    setFormData({
      id: record.id,
      ticketNumber: record.ticketNumber,
      sede: record.sede || 'StarMotos Matriz La Maná',
      sedeId: record.sedeId || 'matriz-la-mana',
      cedulaRuc: record.cedulaRuc,
      nombres: record.nombres,
      apellidos: record.apellidos,
      celular1: record.celular1,
      celular2: record.celular2 || '',
      celular3: record.celular3 || '',
      email: record.email || '',
      direccion: record.direccion || '',
      placa: record.placa,
      modeloMarca: record.modeloMarca,
      chasis: record.chasis,
      numeroMotor: record.numeroMotor || '',
      color: record.color || '',
      year: record.year || new Date().getFullYear(),
      kilometraje: record.kilometraje || 0,
      serieGps: record.serieGps,
      serieChip: record.serieChip,
      tecnicoResponsable: record.tecnicoResponsable || '',
      fechaInicio: record.fechaInicio,
      fechaVencimiento: record.fechaVencimiento,
      valorServicio: Number(record.valorServicio) || 0,
      montoPagado: Number(record.montoPagado) || 0,
      metodoPago: ((record.metodoPago === 'Transferencia' || (record.metodoPago as string)?.toLowerCase?.().includes('transferencia')) ? 'Transferencia' : 'Efectivo') as 'Efectivo' | 'Transferencia',
      evidenciaTransferencia: record.evidenciaTransferencia || '',
      fotos: record.fotos || [],
      observaciones: record.observaciones || '',
      estado: record.estado,
      gpsUser: record.gpsUser || '',
      gpsPassword: record.gpsPassword || '',
    });
    setViewMode('form');
  };

  // Enviar formulario (Crear o Editar)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!formData.nombres.trim()) missing.push('Nombres');
    if (!formData.apellidos.trim()) missing.push('Apellidos');
    if (!formData.cedulaRuc.trim()) missing.push('Cédula o RUC');
    if (!formData.celular1.trim()) missing.push('Celular 1');
    if (!formData.modeloMarca.trim()) missing.push('Marca/Modelo');
    if (!formData.chasis.trim()) missing.push('Chasis (VIN)');
    if (!formData.serieGps.trim()) missing.push('Serie GPS');
    if (!formData.serieChip.trim()) missing.push('Serie Chip SIM');

    if (missing.length > 0) {
      setValidationAlert({
        title: 'Faltan campos requeridos',
        fields: missing,
      });
      showToast?.('Complete todos los campos obligatorios.', 'error');
      return;
    }

    const saldo = Math.max(0, Number(formData.valorServicio || 0) - Number(formData.montoPagado || 0));

    if (isEditing && formData.id) {
      const updatedRecord: GpsRecord = {
        ...(selectedRecordForDetail as GpsRecord),
        sede: formData.sede || 'StarMotos Matriz La Maná',
        sedeId: formData.sedeId || 'matriz-la-mana',
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        cedulaRuc: formData.cedulaRuc.trim(),
        celular1: formData.celular1.trim(),
        celular2: formData.celular2.trim() || undefined,
        celular3: formData.celular3.trim() || undefined,
        email: formData.email.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
        placa: formData.placa.trim().toUpperCase() || 'EN TRÁMITE',
        chasis: formData.chasis.trim().toUpperCase(),
        numeroMotor: formData.numeroMotor.trim().toUpperCase() || undefined,
        modeloMarca: formData.modeloMarca.trim() || 'Motocicleta General',
        color: formData.color.trim() || undefined,
        year: Number(formData.year) || new Date().getFullYear(),
        kilometraje: Number(formData.kilometraje) || 0,
        serieGps: formData.serieGps.trim(),
        serieChip: formData.serieChip.trim(),
        tecnicoResponsable: formData.tecnicoResponsable.trim() || undefined,
        fechaInicio: formData.fechaInicio,
        fechaVencimiento: formData.fechaVencimiento,
        valorServicio: Number(formData.valorServicio) || 0,
        montoPagado: Number(formData.montoPagado) || 0,
        saldoPendiente: saldo,
        metodoPago: formData.metodoPago,
        evidenciaTransferencia: formData.metodoPago === 'Transferencia' ? (formData.evidenciaTransferencia || undefined) : undefined,
        fotos: formData.fotos && formData.fotos.length > 0 ? formData.fotos : undefined,
        observaciones: formData.observaciones.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      saveStoredGpsRecord(updatedRecord);
      onSaveRecord?.(updatedRecord);
      showToast?.(`¡Ficha de GPS de ${updatedRecord.nombres} actualizada exitosamente!`, 'success');
      setViewMode('list');
      setSelectedRecordForDetail(null);
      setIsEditing(false);
      return;
    }

    // Crear nuevo registro
    const randomTicket = Math.floor(10000 + Math.random() * 90000);
    const newRecord: GpsRecord = {
      id: `gps-${Date.now()}`,
      ticketNumber: `GPS-${randomTicket}`,
      sede: formData.sede || 'StarMotos Matriz La Maná',
      sedeId: formData.sedeId || 'matriz-la-mana',
      fechaSolicitud: todayStr,
      horaSolicitud: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      cedulaRuc: formData.cedulaRuc.trim(),
      celular1: formData.celular1.trim(),
      celular2: formData.celular2.trim() || undefined,
      celular3: formData.celular3.trim() || undefined,
      email: formData.email.trim() || undefined,
      direccion: formData.direccion.trim() || undefined,
      placa: formData.placa.trim().toUpperCase() || 'EN TRÁMITE',
      chasis: formData.chasis.trim().toUpperCase(),
      numeroMotor: formData.numeroMotor.trim().toUpperCase() || undefined,
      modeloMarca: formData.modeloMarca.trim() || 'Motocicleta General',
      color: formData.color.trim() || undefined,
      year: Number(formData.year) || new Date().getFullYear(),
      kilometraje: Number(formData.kilometraje) || 0,
      serieGps: formData.serieGps.trim(),
      serieChip: formData.serieChip.trim(),
      tecnicoResponsable: formData.tecnicoResponsable.trim() || undefined,
      fechaInicio: formData.fechaInicio,
      fechaVencimiento: formData.fechaVencimiento,
      valorServicio: Number(formData.valorServicio) || 0,
      montoPagado: Number(formData.montoPagado) || 0,
      saldoPendiente: saldo,
      metodoPago: formData.metodoPago,
      evidenciaTransferencia: formData.metodoPago === 'Transferencia' ? (formData.evidenciaTransferencia || undefined) : undefined,
      fotos: formData.fotos && formData.fotos.length > 0 ? formData.fotos : undefined,
      observaciones: formData.observaciones.trim() || undefined,
      estado: 'pendiente',
      createdAt: new Date().toISOString(),
    };

    saveStoredGpsRecord(newRecord);
    onSaveRecord?.(newRecord);

    const alertForGps: SystemAlert = {
      id: `alt-gps-${Date.now()}`,
      type: 'orden_creada',
      targetRole: 'gps',
      title: `📡 Nueva Solicitud GPS: ${newRecord.nombres} ${newRecord.apellidos}`,
      message: `Matriz registró GPS para ${newRecord.modeloMarca} (${newRecord.placa}). Serie GPS: ${newRecord.serieGps}. Asigne credenciales de acceso.`,
      timestamp: 'Ahora mismo',
      read: false,
      relatedId: newRecord.id,
    };
    addStoredAlerts(alertForGps);

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    showToast?.('¡Solicitud GPS guardada y enviada a GPS Servicios!', 'success');

    setViewMode('list');
    setSelectedRecordForDetail(null);
    setIsEditing(false);
  };

  // Métricas financieras y de conteo
  const statsMetrics = useMemo(() => {
    let totalCobrado = 0;
    let totalPendiente = 0;
    let totalFacturado = 0;
    let countConSaldo = 0;
    let countPagados = 0;
    let countActivosGps = 0;
    let countPendientesGps = 0;

    records.forEach((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = Number(r.montoPagado) || 0;
      const saldo = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

      totalFacturado += valor;
      totalCobrado += pagado;
      totalPendiente += saldo;

      if (saldo > 0.01) {
        countConSaldo++;
      } else {
        countPagados++;
      }

      if (r.estado === 'activa') {
        countActivosGps++;
      } else {
        countPendientesGps++;
      }
    });

    return {
      totalCobrado,
      totalPendiente,
      totalFacturado,
      countConSaldo,
      countPagados,
      countActivosGps,
      countPendientesGps,
    };
  }, [records]);

  // Registros filtrados
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const valor = Number(r.valorServicio) || 0;
      const pagado = Number(r.montoPagado) || 0;
      const saldo = r.saldoPendiente !== undefined ? Number(r.saldoPendiente) : Math.max(0, valor - pagado);

      // Filtro de pago
      if (filterPayment === 'con_saldo' && saldo <= 0.01) return false;
      if (filterPayment === 'pagados' && saldo > 0.01) return false;

      // Filtro de estado
      if (filterStatus === 'pendiente' && r.estado !== 'pendiente') return false;
      if (filterStatus === 'activa' && r.estado !== 'activa') return false;

      // Búsqueda
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
        return (
          clientFull.includes(q) ||
          r.cedulaRuc.toLowerCase().includes(q) ||
          r.placa.toLowerCase().includes(q) ||
          r.chasis.toLowerCase().includes(q) ||
          r.ticketNumber.toLowerCase().includes(q) ||
          r.serieGps.toLowerCase().includes(q) ||
          r.serieChip.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [records, filterPayment, filterStatus, searchTerm]);

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Está seguro de eliminar el registro GPS de ${name}?`)) {
      deleteStoredGpsRecord(id);
      onDeleteRecord?.(id);
      showToast?.('Registro GPS eliminado.', 'info');
    }
  };

  const handleOpenWhatsApp = (phone: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? `593${cleanPhone.slice(1)}` : cleanPhone.startsWith('593') ? cleanPhone : `593${cleanPhone}`;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in select-none">
      {/* Datalist con marcas para Modelo/Marca */}
      <datalist id="registered-brands-datalist-mobile">
        {registeredBrands.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>

      {/* ========================================================================= */}
      {/* 1. VISTA: LISTADO EXTERIOR (ESTILO IDÉNTICO A ALISTAMIENTO)              */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-3.5">
          {/* Header Superior Destacado: Libro de GPS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-base font-black text-zinc-900 tracking-tight leading-tight">
                    Libro de GPS Matriz
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Historial de compras y dispositivos satelitales
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartNewGps('')}
                className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer active:scale-95 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo GPS</span>
              </button>
            </div>

            {/* Badges de métricas superiores */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px]">
              <span className="px-2 py-0.5 font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-lg whitespace-nowrap">
                {records.length} Dispositivos
              </span>
              <span className="px-2 py-0.5 font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg whitespace-nowrap">
                {statsMetrics.countActivosGps} Activos
              </span>
              <span className="px-2 py-0.5 font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg whitespace-nowrap">
                {statsMetrics.countPendientesGps} Pendientes
              </span>
              <span className="px-2 py-0.5 font-bold bg-zinc-100 text-zinc-800 border border-zinc-200 rounded-lg font-mono whitespace-nowrap">
                ${statsMetrics.totalFacturado.toFixed(2)} Facturado
              </span>
            </div>

            {/* Barra de Búsqueda de Cédula / Cliente LLAMATIVA y GRANDE */}
            <div className="relative flex items-center bg-zinc-50 border-2 border-blue-200 focus-within:border-blue-600 focus-within:bg-white rounded-xl transition-all shadow-xs h-12 px-3 gap-2">
              <Search className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cédula, cliente, placa o serie..."
                className="w-full bg-transparent text-xs font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-zinc-400 hover:text-zinc-600 p-1 rounded-full hover:bg-zinc-200 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Aviso reactivo si escribe cédula que no existe */}
            {searchTerm.trim().length >= 8 && filteredRecords.length === 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-slide-in">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px]">
                    Sin registros para <strong>"{searchTerm}"</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartNewGps(searchTerm.trim())}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-2xs"
                >
                  + Registrar
                </button>
              </div>
            )}

            {/* 4 Bloques Estadísticos Reactivos (Filtros rápidos al hacer tap) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Bloque 1: Cobrado */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'pagados' ? 'all' : 'pagados')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterPayment === 'pagados'
                    ? 'bg-emerald-100 border-2 border-emerald-500 shadow-xs ring-1 ring-emerald-300'
                    : 'bg-emerald-50/70 border border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-emerald-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Cobrado</span>
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-emerald-900 leading-tight">
                    ${statsMetrics.totalCobrado.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-700">
                    {statsMetrics.countPagados} al día
                  </span>
                </div>
              </button>

              {/* Bloque 2: Pendiente por Cobrar */}
              <button
                type="button"
                onClick={() => setFilterPayment(filterPayment === 'con_saldo' ? 'all' : 'con_saldo')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterPayment === 'con_saldo'
                    ? 'bg-amber-100 border-2 border-amber-500 shadow-xs ring-1 ring-amber-300'
                    : 'bg-amber-50/70 border border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between text-amber-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Por Cobrar</span>
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-amber-900 leading-tight">
                    ${statsMetrics.totalPendiente.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-amber-700">
                    {statsMetrics.countConSaldo > 0 ? `${statsMetrics.countConSaldo} con saldo` : 'Sin saldo'}
                  </span>
                </div>
              </button>

              {/* Bloque 3: Total Facturado */}
              <button
                type="button"
                onClick={() => {
                  setFilterPayment('all');
                  setFilterStatus('all');
                }}
                className="text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none bg-blue-50/70 border border-blue-200"
              >
                <div className="flex items-center justify-between text-blue-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Facturado</span>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black font-mono text-blue-900 leading-tight">
                    ${statsMetrics.totalFacturado.toFixed(2)}
                  </div>
                  <span className="text-[9px] font-semibold text-blue-700">Ventas totales</span>
                </div>
              </button>

              {/* Bloque 4: Unidades GPS */}
              <button
                type="button"
                onClick={() => setFilterStatus(filterStatus === 'pendiente' ? 'all' : 'pendiente')}
                className={`text-left rounded-xl p-2.5 flex flex-col justify-between transition-all cursor-pointer select-none active:scale-98 ${
                  filterStatus === 'pendiente'
                    ? 'bg-blue-100 border-2 border-blue-500 shadow-xs ring-1 ring-blue-300'
                    : 'bg-zinc-50 border border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between text-blue-800">
                  <span className="text-[9px] font-black uppercase tracking-wider">Dispositivos</span>
                  <Radio className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <div className="mt-0.5">
                  <div className="text-base font-black text-zinc-900 leading-tight">
                    {records.length} <span className="text-xs font-bold">motos</span>
                  </div>
                  <span className="text-[9px] font-semibold text-zinc-600">
                    {statsMetrics.countActivosGps} Activos • {statsMetrics.countPendientesGps} Pendientes
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Listado de Tarjetas de GPS */}
          <div className="space-y-3">
            {filteredRecords.length === 0 ? (
              <div className="bg-white border border-zinc-200 rounded-2xl p-8 text-center text-zinc-400 space-y-2">
                <Radio className="w-8 h-8 mx-auto text-zinc-300 animate-pulse" />
                <p className="font-bold text-zinc-700 text-sm">No hay registros de GPS</p>
                <p className="text-xs text-zinc-400">
                  {records.length === 0
                    ? 'Comience registrando el primer GPS con el botón superior.'
                    : 'No se encontraron resultados para los filtros actuales.'}
                </p>
              </div>
            ) : (
              filteredRecords.map((r) => {
                const isApproved = r.estado === 'activa' && Boolean(r.gpsUser);
                const hasSaldo = Number(r.saldoPendiente || 0) > 0.01;

                return (
                  <div
                    key={r.id}
                    onClick={() => handleOpenRecordDetail(r)}
                    className="bg-white rounded-2xl border border-zinc-200 p-3.5 shadow-2xs space-y-2.5 active:bg-zinc-50 transition cursor-pointer"
                  >
                    {/* Header de Tarjeta */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {r.ticketNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400">{r.fechaSolicitud}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded max-w-[100px] truncate">
                          {r.sede || 'Matriz'}
                        </span>
                        {isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cliente y Celulares */}
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 leading-tight">
                        {r.nombres} {r.apellidos}
                      </h4>
                      <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        C.I. {r.cedulaRuc}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-mono">
                        <span className="bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                          📱 {r.celular1}
                        </span>
                        {r.celular2 && (
                          <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                            📞 {r.celular2}
                          </span>
                        )}
                        {r.celular3 && (
                          <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                            📞 {r.celular3}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bloque de Motocicleta & Hardware */}
                    <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-200/80 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500 text-[11px]">Moto:</span>
                        <strong className="text-zinc-800 text-[11px] truncate max-w-[60%]">{r.modeloMarca}</strong>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[11px]">
                        <span className="text-zinc-500">Placa:</span>
                        <strong className="text-blue-700 bg-blue-50 px-1 rounded">{r.placa || 'EN TRÁMITE'}</strong>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-zinc-500">VIN:</span>
                        <span className="text-zinc-700 truncate max-w-[60%]">{r.chasis}</span>
                      </div>
                      <div className="pt-1 border-t border-zinc-200/60 flex justify-between items-center font-mono text-[10px]">
                        <span className="text-zinc-500 uppercase font-bold">Serie GPS:</span>
                        <span className="text-zinc-900 font-bold bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                          {r.serieGps}
                        </span>
                      </div>
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-zinc-500 uppercase font-bold">Serie SIM:</span>
                        <span className="text-zinc-700 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                          {r.serieChip}
                        </span>
                      </div>
                    </div>

                    {/* Contabilidad Matriz & Vigencia */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <div className="text-[11px]">
                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Vigencia</span>
                        <strong className="text-emerald-700 font-mono text-[11px]">{r.fechaVencimiento}</strong>
                        {r.tecnicoResponsable && (
                          <span className="text-[10px] text-zinc-600 font-medium block mt-0.5">
                            🔧 {r.tecnicoResponsable}
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-zinc-400 block text-[9px] uppercase font-bold">Total / Saldo</span>
                        <div className="font-mono text-xs">
                          <span className="text-zinc-700 font-bold">${Number(r.valorServicio || 0).toFixed(2)}</span>
                          {hasSaldo && (
                            <span className="text-red-600 font-black ml-1.5 bg-red-50 px-1 rounded border border-red-200">
                              Saldo: ${Number(r.saldoPendiente || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] font-bold text-zinc-500">
                          <span>{r.metodoPago || 'Efectivo'}</span>
                          {r.evidenciaTransferencia && isValidMediaUrl(r.evidenciaTransferencia) && (
                            <a
                              href={r.evidenciaTransferencia}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-0.5"
                              title="Ver comprobante de transferencia"
                            >
                              <Camera className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fila de Acciones: Llave, WhatsApp, Eliminar */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleDelete(r.id, `${r.nombres} ${r.apellidos}`, e)}
                          className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center transition active:scale-95"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenWhatsApp(r.celular1, `Hola ${r.nombres}, le saludamos de StarMotos respecto a su dispositivo GPS satelital.`, e)}
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center transition active:scale-95"
                          title="Escribir al WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenRecordDetail(r)}
                          className="h-8 px-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-xs font-bold flex items-center gap-1 hover:bg-zinc-200 transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Ficha</span>
                        </button>
                      </div>

                      {/* Botón Llave de Credenciales */}
                      {isApproved ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForCredentials(r);
                          }}
                          className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition"
                          title="Ver credenciales (Usuario y Contraseña)"
                        >
                          <KeyRound className="w-4 h-4 text-amber-200" />
                          <span>Credenciales</span>
                        </button>
                      ) : (
                        <div
                          className="py-1.5 px-2.5 rounded-xl bg-zinc-100 text-zinc-400 text-[11px] font-semibold flex items-center gap-1 opacity-70 border border-zinc-200"
                          title="Esperando que GPS Servicios asigne credenciales"
                        >
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Sin Clave</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VISTA: FORMULARIO DE INGRESO MÓVIL (DIRECTAMENTE SOBRE EL LIENZO)     */}
      {/* ========================================================================= */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmitForm} className="space-y-3 animate-fade-in">
          {/* Alerta de validación */}
          {validationAlert && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl flex items-start justify-between gap-2 animate-slide-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-red-700">
                  <strong className="block text-red-900">{validationAlert.title}</strong>
                  <span>Requeridos: {validationAlert.fields.join(', ')}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationAlert(null)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Wizard Tabs Móvil */}
          <div className="grid grid-cols-3 gap-1 bg-zinc-100 p-1 rounded-xl">
            {[
              { s: 1, label: '1. Cliente' },
              { s: 2, label: '2. Moto & GPS' },
              { s: 3, label: '3. Cobro & Vigencia' },
            ].map((tab) => (
              <button
                key={tab.s}
                type="button"
                onClick={() => setMobileStep(tab.s as 1 | 2 | 3)}
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mobileStep === tab.s
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* PASO 1: CLIENTE & CONTACTO (Directamente sobre el Lienzo)         */}
          {/* ----------------------------------------------------------------- */}
          {mobileStep === 1 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-zinc-900">Paso 1: Datos del Cliente</h3>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">1 de 3</span>
                </div>
              </div>

              {/* Sede / Taller de Atención */}
              <div>
                <label className="block text-[11px] font-black uppercase text-zinc-700 mb-1">
                  Sede de Atención *
                </label>
                <select
                  value={formData.sedeId || formData.sede}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    const selectedWs = workshopsList.find((w) => w.id === selectedVal || w.name === selectedVal);
                    setFormData((prev) => ({
                      ...prev,
                      sedeId: selectedWs ? selectedWs.id : selectedVal,
                      sede: selectedWs ? selectedWs.name : selectedVal,
                      tecnicoResponsable: '',
                    }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-blue-600 shadow-2xs"
                  required
                >
                  {workshopsList.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cédula o RUC con Botón Lupa Compacto */}
              <div>
                <label className="block text-[11px] font-black uppercase text-blue-900 mb-1">
                  Cédula o RUC *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={formData.cedulaRuc}
                    onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConsultar();
                      }
                    }}
                    placeholder="Ejemplo: 1723456789"
                    className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleConsultar()}
                    disabled={isSearchingSri || !formData.cedulaRuc.trim()}
                    className="w-9 h-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95 transition"
                    title="Consultar SRI"
                  >
                    {isSearchingSri ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {searchFeedback && (
                  <p className="text-[11px] font-medium leading-tight mt-1 p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                    {searchFeedback}
                  </p>
                )}
              </div>

              {/* Nombres y Apellidos */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Nombres *
                </label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  placeholder="Ejemplo: Carlos Alberto"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-blue-600 shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Apellidos *
                </label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Ejemplo: Mendoza Villao"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-blue-600 shadow-2xs"
                  required
                />
              </div>

              {/* Celular 1 Principal WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                  <span>Celular 1 (Principal WhatsApp) *</span>
                  <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                    Principal
                  </span>
                </label>
                <input
                  type="tel"
                  value={formData.celular1}
                  onChange={(e) => setFormData({ ...formData, celular1: e.target.value })}
                  placeholder="0998765432"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                  required
                />
              </div>

              {/* Celulares 2 y 3 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Celular 2 (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={formData.celular2}
                    onChange={(e) => setFormData({ ...formData, celular2: e.target.value })}
                    placeholder="0987654321"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Celular 3 (Adicional)
                  </label>
                  <input
                    type="tel"
                    value={formData.celular3}
                    onChange={(e) => setFormData({ ...formData, celular3: e.target.value })}
                    placeholder="0976543210"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Correo y Dirección */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Dirección Domiciliaria
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Av. 19 de Mayo y San Pablo"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-blue-600 shadow-2xs"
                />
              </div>

              {/* Botón Siguiente y Cancelar */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('list');
                    setSelectedRecordForDetail(null);
                    setIsEditing(false);
                  }}
                  className="py-2.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Siguiente: Motocicleta & GPS</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PASO 2: MOTOCICLETA & HARDWARE GPS (Directamente sobre el Lienzo) */}
          {/* ----------------------------------------------------------------- */}
          {mobileStep === 2 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-zinc-900">Paso 2: Motocicleta & GPS</h3>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">2 de 3</span>
                </div>
              </div>

              {/* Modelo y Marca */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Modelo y Marca *
                </label>
                <input
                  type="text"
                  list="registered-brands-datalist-mobile"
                  value={formData.modeloMarca}
                  onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                  placeholder="Ejemplo: Thunder 200 / Pulsar NS 200"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold outline-none focus:border-red-600 shadow-2xs"
                  required
                />
              </div>

              {/* Placa con botón "En trámite" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-zinc-700">
                    Placa
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, placa: 'EN TRÁMITE' })}
                    className="text-[10px] text-zinc-500 hover:text-zinc-800 underline cursor-pointer"
                  >
                    En trámite
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  placeholder="Ejemplo: AB123C o EN TRÁMITE"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-red-600 shadow-2xs"
                />
              </div>

              {/* Chasis (VIN) */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Número de Chasis (VIN) *
                </label>
                <input
                  type="text"
                  value={formData.chasis}
                  onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                  placeholder="Ej: 3SCBP123456789012"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-red-600 shadow-2xs"
                  required
                />
              </div>

              {/* Motor y Color */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Número de Motor
                  </label>
                  <input
                    type="text"
                    value={formData.numeroMotor}
                    onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                    placeholder="Ej: BJ265MN-1"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-red-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Ej: Negro Mate"
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-red-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Año y Km */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Año
                  </label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-red-600 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Kilometraje
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.kilometraje}
                      onFocus={selectOnFocus}
                      onChange={(e) => {
                        const km = cleanNumberInput(e.target.value);
                        setFormData((prev) => ({
                          ...prev,
                          kilometraje: km === '' ? 0 : Number(km),
                        }));
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-red-600 shadow-2xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      KM
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware GPS & SIM */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200/60">
                <div>
                  <label className="block text-[11px] font-black uppercase text-zinc-800 mb-1">
                    Serie GPS (IMEI) *
                  </label>
                  <input
                    type="text"
                    value={formData.serieGps}
                    onChange={(e) => setFormData({ ...formData, serieGps: e.target.value.trim() })}
                    placeholder="869402058491823"
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-950 outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase text-zinc-800 mb-1">
                    Serie Chip (SIM) *
                  </label>
                  <input
                    type="text"
                    value={formData.serieChip}
                    onChange={(e) => setFormData({ ...formData, serieChip: e.target.value.trim() })}
                    placeholder="89593021948201"
                    className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs font-mono font-bold text-blue-950 outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Botones de Navegación */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(1)}
                  className="flex-1 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => setMobileStep(3)}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Siguiente: Cobro & Vigencia</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ----------------------------------------------------------------- */}
          {/* PASO 3: VIGENCIA, COBRO & LIQUIDACIÓN (Directamente sobre el Lienzo) */}
          {/* ----------------------------------------------------------------- */}
          {mobileStep === 3 && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-0.5">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-zinc-900">Paso 3: Vigencia & Cobro</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">3 de 3</span>
                </div>
              </div>

              {/* Fechas de Inicio y Vencimiento */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    <span>Fecha de Inicio *</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>Vencimiento *</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaVencimiento}
                    onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Técnico Responsable */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-blue-600" />
                    <span>Técnico Instalador</span>
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    Sede: {formData.sede || 'Matriz'}
                  </span>
                </label>
                <select
                  value={formData.tecnicoResponsable}
                  onChange={(e) => setFormData({ ...formData, tecnicoResponsable: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                >
                  <option value="">
                    {availableTechniciansForSede.length === 0
                      ? `(Sin técnicos en ${formData.sede || 'esta sede'})`
                      : 'Seleccione Técnico...'}
                  </option>
                  {availableTechniciansForSede.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} {t.specialty ? `(${t.specialty})` : ''}
                    </option>
                  ))}
                  {formData.tecnicoResponsable && !availableTechniciansForSede.some((t) => t.name === formData.tecnicoResponsable) && (
                    <option value={formData.tecnicoResponsable}>{formData.tecnicoResponsable} (Asignado)</option>
                  )}
                </select>
              </div>

              {/* Valor del GPS y Abono */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Valor GPS ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorServicio}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const val = cleanNumberInput(e.target.value);
                      setFormData({ ...formData, valorServicio: val === '' ? 0 : Number(val) });
                    }}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-zinc-700">
                      Abono ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          montoPagado: prev.valorServicio,
                        }));
                      }}
                      className="text-[10px] text-blue-700 font-bold underline cursor-pointer"
                    >
                      Total
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.montoPagado}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const ab = cleanNumberInput(e.target.value);
                      setFormData({ ...formData, montoPagado: ab === '' ? 0 : Number(ab) });
                    }}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Saldo y Método de Pago */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Saldo Pendiente ($)
                  </label>
                  <div
                    className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold flex items-center justify-between ${
                      formData.valorServicio - formData.montoPagado > 0.01
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <span>${Math.max(0, formData.valorServicio - formData.montoPagado).toFixed(2)}</span>
                    <span className="text-[9px] uppercase">
                      {formData.valorServicio - formData.montoPagado > 0.01 ? 'Deuda' : 'Pagado'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value as 'Efectivo' | 'Transferencia' })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-800 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                </div>
              </div>

              {/* Comprobante de Transferencia si aplica */}
              {formData.metodoPago === 'Transferencia' && (
                <div className="space-y-1.5 pt-1 border-t border-zinc-200/80">
                  <label className="block text-[10px] font-black uppercase text-emerald-900">
                    Comprobante de Transferencia Bancaria
                  </label>
                  {formData.evidenciaTransferencia && isValidMediaUrl(formData.evidenciaTransferencia) ? (
                    <div className="relative rounded-xl border border-emerald-300 bg-emerald-50/30 p-2 flex items-center gap-2.5">
                      <a
                        href={formData.evidenciaTransferencia}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 shrink-0 block"
                      >
                        <img
                          src={formData.evidenciaTransferencia}
                          alt="Comprobante"
                          className="w-full h-full object-cover"
                        />
                      </a>
                      <div className="flex-1 min-w-0 text-[11px]">
                        <p className="font-bold text-zinc-900 truncate">Comprobante cargado</p>
                        <p className="text-[9px] text-zinc-500">Toque para ver completo</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, evidenciaTransferencia: '' }))}
                        className="p-1 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-emerald-300 bg-emerald-50/20 rounded-xl cursor-pointer">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-900">Subir foto del comprobante</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const compressed = await compressImageBase64(file, 1000, 0.7);
                            setFormData((prev) => ({ ...prev, evidenciaTransferencia: compressed }));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              {/* Fotografías / Evidencias de la Instalación GPS */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-200/80">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase text-zinc-700 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-blue-600" />
                    <span>Fotos / Evidencias ({formData.fotos.length})</span>
                  </label>
                </div>

                {formData.fotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {formData.fotos.map((foto, index) => (
                      <div
                        key={index}
                        className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-square shadow-2xs"
                      >
                        <img
                          src={foto}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => setPreviewImage(foto)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              fotos: prev.fotos.filter((_, i) => i !== index),
                            }));
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-blue-300 bg-blue-50/20 rounded-xl cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">+ Subir fotos de la instalación</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const newFotos: string[] = [];
                        for (let i = 0; i < files.length; i++) {
                          const compressed = await compressImageBase64(files[i], 1000, 0.7);
                          if (compressed) newFotos.push(compressed);
                        }
                        setFormData((prev) => ({
                          ...prev,
                          fotos: [...prev.fotos, ...newFotos],
                        }));
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Observaciones / Notas
                </label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Ej: Incluye 1 año de plataforma satelital"
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs text-zinc-800 outline-none focus:border-blue-600 shadow-2xs resize-none"
                />
              </div>

              {/* Botones Finales */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMobileStep(2)}
                  className="py-2.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Enviar</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Modal visor de foto en tamaño completo */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
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
              alt="Evidencia"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Modal Credenciales al pulsar la Llave */}
      <GpsCredentialDetailModal
        isOpen={Boolean(selectedRecordForCredentials)}
        onClose={() => setSelectedRecordForCredentials(null)}
        record={selectedRecordForCredentials}
      />
    </div>
  );
};
