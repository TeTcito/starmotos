// src/components/desktop/admin/GarantiasPlusDesktop.tsx
import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Bike,
  UserCheck,
  Building2,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Phone,
  Receipt,
  AlertCircle,
  Filter,
  Check,
  Copy,
  X,
  Save,
  TrendingUp,
  Printer,
  MessageCircle,
  Camera,
  Upload,
  Wrench,
  CreditCard,
  MapPin,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  GarantiaPlusRecord,
  Technician,
  Workshop,
  ServiceActionType,
} from '../../../types/customer';
import {
  getStoredClients,
  getStoredFullAlistamientos,
  querySriMock,
  saveStoredGarantiaPlusRecord,
  deleteStoredGarantiaPlusRecord,
  getRegisteredBrands,
  getStoredTechnicians,
  getStoredWorkshops,
} from '../../../data/mockMultiRoleData';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { compressImageBase64 } from '../../../utils/imageCompressor';
import { isValidMediaUrl } from '../../../services/mediaStorage';

interface Props {
  records: GarantiaPlusRecord[];
  onSaveRecord?: (record: GarantiaPlusRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GarantiasPlusDesktop: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activa' | 'vencida'>('all');
  const [filterSede, setFilterSede] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'con_saldo' | 'pagados'>('all');

  // Detalle / Ficha / Edición
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GarantiaPlusRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fechas por defecto: Inicio hoy, Vencimiento a +1 año exacto
  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  // Estado del Formulario
  const initialFormData = {
    id: '',
    numeroTicket: '',
    atendidoPor: 'William Daniel Meza (Gerente)',
    sede: 'StarMotos Matriz La Maná',
    sedeId: 'matriz-la-mana',
    // Módulo 1: Datos del Cliente
    cedulaRuc: '',
    nombres: '',
    apellidos: '',
    celular1: '',
    celular2: '',
    celular3: '',
    email: '',
    direccion: '',
    origen: 'Almacén Principal La Maná',
    // Módulo 2: Datos de la Moto
    placa: '',
    chasis: '',
    numeroMotor: '',
    ramv: '',
    modeloMarca: '',
    color: '',
    year: 2026,
    kilometraje: 0,
    // Módulo 3: Servicio de Garantía Plus
    serviciosRealizados: ['alistamiento_pdi', 'engrasado', 'mantenimiento'] as ServiceActionType[],
    tecnicoResponsable: '',
    tecnicoId: '',
    // DIFERENCIA CLAVE SOLICITADA: Donde estaba la hora, va la Fecha de Vencimiento
    fechaServicio: todayStr,
    fechaVencimiento: nextYearStr,
    aceite: 'con_aceite',
    nivelAceite: 'semisintetico',
    tipoAceite: '10W-40 Motul',
    proximoMantenimientoKm: 3000,
    // Módulo 4: Contabilidad Matriz
    numeroFactura: '',
    valorServicio: 180.0,
    montoPagado: 180.0,
    abono: 180.0,
    saldoPendiente: 0.0,
    metodoPago: 'Efectivo',
    evidenciaTransferencia: '',
    fotos: [] as string[],
    observaciones: 'Paquete Garantía Plus contratado. Los mantenimientos preventivos y engrasados quedan cubiertos al 100% durante el periodo de vigencia.',
    estado: 'activa' as 'activa' | 'vencida' | 'cancelada',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSearchingSri, setIsSearchingSri] = useState(false);
  const [clientFoundMessage, setClientFoundMessage] = useState<string | null>(null);

  // Catálogos auxiliares
  const storedWorkshops = useMemo(() => getStoredWorkshops(), []);
  const storedTechnicians = useMemo(() => getStoredTechnicians(), []);
  const registeredBrands = useMemo(() => getRegisteredBrands(), []);

  // Técnicos filtrados por la sede seleccionada
  const filteredTechnicians = useMemo(() => {
    if (!formData.sedeId && !formData.sede) return storedTechnicians;
    const sId = (formData.sedeId || '').toLowerCase();
    const sName = (formData.sede || '').toLowerCase();

    const matched = storedTechnicians.filter((t) => {
      const tSedeId = (t.workshopId || '').toLowerCase();
      const tSedeName = (t.workshopName || '').toLowerCase();
      if (sId && tSedeId && (sId === tSedeId || tSedeId.includes(sId) || sId.includes(tSedeId))) {
        return true;
      }
      if (sName && tSedeName && (sName === tSedeName || tSedeName.includes(sName) || sName.includes(tSedeName))) {
        return true;
      }
      return false;
    });

    return matched.length > 0 ? matched : storedTechnicians;
  }, [formData.sedeId, formData.sede, storedTechnicians]);

  // Asignar técnico por defecto si cambia la sede
  const handleSedeChange = (wsName: string) => {
    const ws = storedWorkshops.find((w) => w.name === wsName);
    const wsId = ws ? ws.id : wsName.toLowerCase().replace(/\s+/g, '-');
    setFormData((prev) => ({
      ...prev,
      sede: wsName,
      sedeId: wsId,
      tecnicoResponsable: '',
      tecnicoId: '',
    }));
  };

  // Helper para verificar vigencia
  const isVigente = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return false;
    const [y, m, d] = fechaVencimiento.split('-').map(Number);
    const venc = new Date(y, m - 1, d);
    venc.setHours(23, 59, 59, 999);
    return venc.getTime() >= Date.now();
  };

  // Métricas estadísticas
  const stats = useMemo(() => {
    const total = records.length;
    let vigentes = 0;
    let vencidas = 0;
    let recaudacion = 0;

    records.forEach((r) => {
      if (isVigente(r.fechaVencimiento) && r.estado !== 'cancelada') {
        vigentes++;
      } else {
        vencidas++;
      }
      recaudacion += Number(r.montoPagado || r.abono || 0);
    });

    return { total, vigentes, vencidas, recaudacion };
  }, [records]);

  // Filtrado de la lista
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = searchTerm.toLowerCase().trim();
      const clientFull = `${r.nombres} ${r.apellidos}`.toLowerCase();
      const phones = `${r.celular1} ${r.celular2 || ''} ${r.celular3 || ''}`.toLowerCase();

      const matchQuery =
        !q ||
        clientFull.includes(q) ||
        r.cedulaRuc.toLowerCase().includes(q) ||
        r.placa.toLowerCase().includes(q) ||
        r.modeloMarca.toLowerCase().includes(q) ||
        r.chasis.toLowerCase().includes(q) ||
        (r.numeroTicket || '').toLowerCase().includes(q) ||
        (r.numeroFactura || '').toLowerCase().includes(q) ||
        (r.sede || '').toLowerCase().includes(q) ||
        phones.includes(q);

      const activa = isVigente(r.fechaVencimiento) && r.estado !== 'cancelada';
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'activa' && activa) ||
        (filterStatus === 'vencida' && !activa);

      const matchSede =
        filterSede === 'all' ||
        r.sede === filterSede ||
        r.sedeId === filterSede;

      const saldo = Number(r.saldoPendiente || 0);
      const matchPayment =
        filterPayment === 'all' ||
        (filterPayment === 'con_saldo' && saldo > 0) ||
        (filterPayment === 'pagados' && saldo <= 0);

      return matchQuery && matchStatus && matchSede && matchPayment;
    });
  }, [records, searchTerm, filterStatus, filterSede, filterPayment]);

  // Búsqueda inteligente por Cédula (SRI / Clientes previos / Alistamientos)
  const handleSearchCedula = async () => {
    const rawCedula = formData.cedulaRuc.trim();
    if (!rawCedula || rawCedula.length < 10) {
      showToast?.('Ingrese una cédula o RUC válido de 10 o 13 dígitos.', 'error');
      return;
    }

    setIsSearchingSri(true);
    setClientFoundMessage(null);

    // 1. Buscar en alistamientos previos
    const alistamientos = getStoredFullAlistamientos();
    const prevAlist = alistamientos.find((a) => a.cedulaRuc === rawCedula);

    // 2. Buscar en clientes del taller
    const storedClients = getStoredClients();
    const prevClient = storedClients.find((c) => c.idNumber === rawCedula);

    if (prevAlist || prevClient) {
      setIsSearchingSri(false);
      const nombres = prevAlist?.nombres || prevClient?.fullName?.split(' ')[0] || '';
      const apellidos = prevAlist?.apellidos || prevClient?.fullName?.split(' ').slice(1).join(' ') || '';
      const celular1 = prevAlist?.celular1 || prevClient?.phone || '';
      const celular2 = prevAlist?.celular2 || '';
      const email = prevAlist?.email || prevClient?.email || '';
      const direccion = prevAlist?.direccion || prevClient?.address || '';
      const placa = prevAlist?.placa || prevClient?.motorcyclePlate || '';
      const chasis = prevAlist?.chasis || prevClient?.motorcycleVin || '';
      const modeloMarca = prevAlist?.modeloMarca || prevClient?.motorcycleModel || '';

      setFormData((prev) => ({
        ...prev,
        nombres: nombres || prev.nombres,
        apellidos: apellidos || prev.apellidos,
        celular1: celular1 || prev.celular1,
        celular2: celular2 || prev.celular2,
        email: email || prev.email,
        direccion: direccion || prev.direccion,
        placa: placa || prev.placa,
        chasis: chasis || prev.chasis,
        modeloMarca: modeloMarca || prev.modeloMarca,
      }));

      setClientFoundMessage(`✓ Cliente encontrado en la base de datos: ${nombres} ${apellidos}`);
      showToast?.(`Datos precargados para ${nombres} ${apellidos}`, 'success');
      return;
    }

    // 3. Fallback a SRI Mock
    try {
      const sriData = await querySriMock(rawCedula);
      setIsSearchingSri(false);
      if (sriData && sriData.razonSocial) {
        const parts = sriData.razonSocial.split(' ');
        const nombres = parts.slice(0, 2).join(' ');
        const apellidos = parts.slice(2).join(' ') || parts.slice(1).join(' ');

        setFormData((prev) => ({
          ...prev,
          nombres: nombres || prev.nombres,
          apellidos: apellidos || prev.apellidos,
          direccion: (sriData as any).direccionMatriz || (sriData as any).address || prev.direccion,
        }));
        setClientFoundMessage(`✓ Datos obtenidos de Consulta SRI: ${sriData.razonSocial}`);
        showToast?.('Datos obtenidos de Consulta SRI', 'success');
      } else {
        setClientFoundMessage('No se encontraron registros previos. Puede ingresar los datos manualmente.');
      }
    } catch {
      setIsSearchingSri(false);
      setClientFoundMessage('No se pudo consultar el SRI. Ingrese los datos manualmente.');
    }
  };

  // Búsqueda inteligente por Placa
  const handleSearchPlaca = (placaInput: string) => {
    const cleanPlaca = placaInput.trim().toUpperCase();
    setFormData((prev) => ({ ...prev, placa: cleanPlaca }));

    if (cleanPlaca.length >= 5) {
      const alistamientos = getStoredFullAlistamientos();
      const prevMoto = alistamientos.find((a) => a.placa.trim().toUpperCase() === cleanPlaca);

      if (prevMoto) {
        setFormData((prev) => ({
          ...prev,
          chasis: prevMoto.chasis || prev.chasis,
          numeroMotor: prevMoto.numeroMotor || prev.numeroMotor,
          modeloMarca: prevMoto.modeloMarca || prev.modeloMarca,
          color: prevMoto.color || prev.color,
          year: prevMoto.year || prev.year,
        }));
        showToast?.(`Motocicleta detectada: ${prevMoto.modeloMarca} (${cleanPlaca})`, 'info');
      }
    }
  };

  // Toggle de servicios cubiertos
  const toggleServicio = (servicio: ServiceActionType) => {
    setFormData((prev) => {
      const exists = prev.serviciosRealizados.includes(servicio);
      let updated: ServiceActionType[];
      if (exists) {
        if (prev.serviciosRealizados.length === 1) return prev;
        updated = prev.serviciosRealizados.filter((s) => s !== servicio);
      } else {
        updated = [...prev.serviciosRealizados, servicio];
      }
      return { ...prev, serviciosRealizados: updated };
    });
  };

  // Manejo de valores contables
  const handleValorChange = (valStr: string) => {
    const clean = cleanNumberInput(valStr);
    const num = clean === '' ? 0 : parseFloat(clean);
    const prevPagado = Number(formData.montoPagado || 0);
    const pagado = formData.metodoPago === 'Transferencia' ? num : prevPagado;
    const saldo = Math.max(0, num - pagado);
    setFormData((prev) => ({
      ...prev,
      valorServicio: num,
      montoPagado: pagado,
      abono: pagado,
      saldoPendiente: saldo,
    }));
  };

  const handleMontoPagadoChange = (valStr: string) => {
    const clean = cleanNumberInput(valStr);
    const pagado = clean === '' ? 0 : parseFloat(clean);
    const valServ = Number(formData.valorServicio || 0);
    const saldo = Math.max(0, valServ - pagado);
    setFormData((prev) => ({
      ...prev,
      montoPagado: pagado,
      abono: pagado,
      saldoPendiente: saldo,
    }));
  };

  // Manejo de fotos y comprobante
  const handleUploadTransferencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageBase64(file);
      setFormData((prev) => ({ ...prev, evidenciaTransferencia: compressed }));
      showToast?.('Comprobante de transferencia cargado.', 'success');
    } catch {
      showToast?.('Error al cargar la imagen del comprobante.', 'error');
    }
  };

  const handleUploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFotos: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const compressed = await compressImageBase64(file);
        newFotos.push(compressed);
      } catch (err) {
        console.error(err);
      }
    }

    if (newFotos.length > 0) {
      setFormData((prev) => ({
        ...prev,
        fotos: [...(prev.fotos || []), ...newFotos],
      }));
      showToast?.(`${newFotos.length} foto(s) añadida(s).`, 'success');
    }
  };

  // Abrir nuevo registro
  const handleOpenNewForm = () => {
    const ticketRandom = `GP-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData({
      ...initialFormData,
      id: `gp-${Date.now()}`,
      numeroTicket: ticketRandom,
      numeroFactura: `FAC-GP-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setClientFoundMessage(null);
    setIsEditing(false);
    setViewMode('form');
  };

  // Guardar Garantía Plus
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cedulaRuc.trim() || !formData.nombres.trim() || !formData.celular1.trim()) {
      showToast?.('Por favor complete los datos obligatorios del cliente.', 'error');
      return;
    }
    if (!formData.placa.trim() || !formData.chasis.trim() || !formData.modeloMarca.trim()) {
      showToast?.('Por favor complete los datos obligatorios de la motocicleta.', 'error');
      return;
    }
    if (!formData.fechaServicio || !formData.fechaVencimiento) {
      showToast?.('Debe definir la fecha de inicio y la fecha de vencimiento de la Garantía Plus.', 'error');
      return;
    }

    const newRecord: GarantiaPlusRecord = {
      id: formData.id || `gp-${Date.now()}`,
      numeroTicket: formData.numeroTicket || `GP-${Math.floor(10000 + Math.random() * 90000)}`,
      atendidoPor: formData.atendidoPor || 'William Daniel Meza (Gerente)',
      sede: formData.sede || 'StarMotos Matriz La Maná',
      sedeId: formData.sedeId || 'matriz-la-mana',
      fechaServicio: formData.fechaServicio,
      fechaVencimiento: formData.fechaVencimiento,
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim(),
      cedulaRuc: formData.cedulaRuc.trim(),
      celular1: formData.celular1.trim(),
      celular2: formData.celular2.trim() || undefined,
      celular3: formData.celular3.trim() || undefined,
      email: formData.email.trim(),
      direccion: formData.direccion.trim(),
      origen: formData.origen || 'Almacén Principal La Maná',
      chasis: formData.chasis.trim().toUpperCase(),
      numeroMotor: formData.numeroMotor.trim().toUpperCase() || undefined,
      ramv: formData.ramv.trim() || undefined,
      placa: formData.placa.trim().toUpperCase(),
      modeloMarca: formData.modeloMarca.trim(),
      color: formData.color.trim() || undefined,
      year: Number(formData.year) || 2026,
      serviciosRealizados: formData.serviciosRealizados,
      tecnicoResponsable: formData.tecnicoResponsable || 'Técnico Asignado',
      tecnicoId: formData.tecnicoId || 'tech-default',
      kilometraje: Number(formData.kilometraje) || 0,
      aceite: formData.aceite,
      nivelAceite: formData.nivelAceite,
      tipoAceite: formData.tipoAceite,
      numeroFactura: formData.numeroFactura || undefined,
      valorServicio: Number(formData.valorServicio) || 0,
      montoPagado: Number(formData.montoPagado) || 0,
      abono: Number(formData.abono ?? formData.montoPagado) || 0,
      saldoPendiente: Number(formData.saldoPendiente) || 0,
      esCredito: false,
      metodoPago: formData.metodoPago,
      observaciones: formData.observaciones,
      proximoMantenimientoKm: Number(formData.proximoMantenimientoKm) || 3000,
      fotos: formData.fotos,
      evidenciaTransferencia: formData.evidenciaTransferencia,
      estado: isVigente(formData.fechaVencimiento) ? 'activa' : 'vencida',
      createdAt: isEditing ? (selectedRecordForDetail?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onSaveRecord) {
      onSaveRecord(newRecord);
    } else {
      saveStoredGarantiaPlusRecord(newRecord);
    }

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });

    showToast?.('✓ Póliza de Garantía Plus guardada exitosamente.', 'success');
    setViewMode('list');
    setSelectedRecordForDetail(null);
  };

  // Enviar mensaje de WhatsApp
  const handleSendWhatsApp = (record: GarantiaPlusRecord) => {
    const rawPhone = (record.celular1 || record.celular2 || '').replace(/\D/g, '');
    if (!rawPhone) {
      showToast?.('El cliente no tiene un celular registrado.', 'error');
      return;
    }
    const cleanPhone = rawPhone.startsWith('593')
      ? rawPhone
      : rawPhone.startsWith('0')
      ? `593${rawPhone.slice(1)}`
      : `593${rawPhone}`;

    const text = encodeURIComponent(
      `Hola estimado(a) *${record.nombres} ${record.apellidos}*, le saludamos de *StarMotos Matriz*. 🌟\n\n` +
      `Le confirmamos que su motocicleta *${record.modeloMarca}* (Placa: *${record.placa}*) cuenta con el beneficio de *GARANTÍA PLUS*.\n\n` +
      `📋 *Ticket Póliza:* ${record.numeroTicket}\n` +
      `📅 *Vigencia:* Desde ${record.fechaServicio} hasta el *${record.fechaVencimiento}*\n` +
      `🏍️ *Beneficio:* Todos sus mantenimientos preventivos y engrasados técnicos están CUBIERTOS AL 100% (Sin costo adicional).\n\n` +
      `¡Gracias por confiar en StarMotos!`
    );

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  // Copiar texto rápido
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast?.(`Copiado: ${text}`, 'info');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in text-zinc-900 font-sans pb-16">
      {/* 1. HEADER SUPERIOR CON TÍTULO, MÉTRICAS Y ACCIONES */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg lg:text-xl font-black text-zinc-900 tracking-tight">
                  Módulo Garantías Plus • Matriz
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  Exclusivo Matriz
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Gestión de clientes y motocicletas con cobertura Garantía Plus. Los mantenimientos y alistamientos se registran pagados sin costo para el cliente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {viewMode === 'form' ? (
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Listado</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenNewForm}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Garantía Plus</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TARJETAS DE MÉTRICAS ANALÍTICAS (ESTILO ALISTAMIENTO) */}
        {viewMode === 'list' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-zinc-500 block">Total Pólizas</span>
              <strong className="text-lg font-black text-zinc-900">{stats.total}</strong>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Vigentes / Activas</span>
              </span>
              <strong className="text-lg font-black text-emerald-900">{stats.vigentes}</strong>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-rose-700 block flex items-center gap-1">
                <Clock className="w-3 h-3 text-rose-600" />
                <span>Vencidas / Expiradas</span>
              </span>
              <strong className="text-lg font-black text-rose-900">{stats.vencidas}</strong>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <span className="text-[10px] font-bold uppercase text-amber-700 block flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-amber-600" />
                <span>Recaudación Paquetes</span>
              </span>
              <strong className="text-lg font-black text-amber-900">${stats.recaudacion.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* 3. VISTA PRINCIPAL: LISTADO O FORMULARIO */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por Ticket, Cédula, Cliente, Placa, Chasis o Factura..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Filtro de Vigencia */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                    filterStatus === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Todas ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('activa')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                    filterStatus === 'activa' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Vigentes ({stats.vigentes})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('vencida')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                    filterStatus === 'vencida' ? 'bg-rose-600 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  Vencidas ({stats.vencidas})
                </button>
              </div>

              {/* Filtro de Sede */}
              <select
                value={filterSede}
                onChange={(e) => setFilterSede(e.target.value)}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:border-amber-600"
              >
                <option value="all">Todas las Sedes</option>
                {storedWorkshops.map((w) => (
                  <option key={w.id} value={w.name}>
                    {w.name}
                  </option>
                ))}
              </select>

              {/* Filtro de Pago */}
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value as any)}
                className="px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 outline-none focus:border-amber-600"
              >
                <option value="all">Todos los Pagos</option>
                <option value="pagados">Pagados al 100%</option>
                <option value="con_saldo">Con Saldo Pendiente</option>
              </select>
            </div>
          </div>

          {/* Listado de Registros */}
          {filteredRecords.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-2xl p-16 text-center shadow-xs">
              <Sparkles className="w-12 h-12 mx-auto text-amber-300 mb-3" />
              <h3 className="text-sm font-bold text-zinc-700">No se encontraron registros de Garantía Plus</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                {searchTerm.trim()
                  ? 'No hay registros que coincidan con los filtros aplicados.'
                  : 'Aún no se han registrado clientes en este módulo. Cree una nueva Garantía Plus usando el botón superior.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-100/80 border-b border-zinc-200 text-zinc-600 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Ticket / Póliza</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Motocicleta</th>
                      <th className="px-4 py-3">Sede / Origen</th>
                      <th className="px-4 py-3">Vigencia Garantía Plus</th>
                      <th className="px-4 py-3">Servicios Cubiertos</th>
                      <th className="px-4 py-3">Valor / Pago</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    {filteredRecords.map((record) => {
                      const vigente = isVigente(record.fechaVencimiento) && record.estado !== 'cancelada';
                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-amber-50/40 transition group cursor-pointer"
                          onClick={() => setSelectedRecordForDetail(record)}
                        >
                          {/* Ticket */}
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 block w-max">
                              {record.numeroTicket}
                            </span>
                            {record.numeroFactura && (
                              <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                                {record.numeroFactura}
                              </span>
                            )}
                          </td>

                          {/* Cliente */}
                          <td className="px-4 py-3.5">
                            <strong className="text-zinc-900 block font-bold text-xs">
                              {record.nombres} {record.apellidos}
                            </strong>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              C.I. {record.cedulaRuc}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                              📱 {record.celular1}
                            </span>
                          </td>

                          {/* Motocicleta */}
                          <td className="px-4 py-3.5">
                            <strong className="text-zinc-900 block truncate max-w-[170px]">
                              {record.modeloMarca}
                            </strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] text-zinc-700 font-bold bg-zinc-100 px-1.5 py-0.2 rounded border border-zinc-200">
                                {record.placa}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[80px]" title={record.chasis}>
                                VIN: {record.chasis.slice(-6)}
                              </span>
                            </div>
                          </td>

                          {/* Sede */}
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-700 font-medium">
                              <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                              <span className="truncate max-w-[140px]">{record.sede}</span>
                            </span>
                            <span className="block text-[10px] text-zinc-400 mt-0.5">
                              Téc: {record.tecnicoResponsable || 'Asignado'}
                            </span>
                          </td>

                          {/* Vigencia Garantía Plus */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {vigente ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Vigente</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200">
                                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                                  <span>Vencida</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono mt-1">
                              <span>{record.fechaServicio}</span> al <strong>{record.fechaVencimiento}</strong>
                            </div>
                          </td>

                          {/* Servicios Cubiertos */}
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                              {record.serviciosRealizados.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 uppercase"
                                >
                                  {s === 'alistamiento_pdi' ? 'PDI' : s}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Valor / Pago */}
                          <td className="px-4 py-3.5">
                            <strong className="text-zinc-900 block font-mono text-xs">
                              ${Number(record.valorServicio || 0).toFixed(2)}
                            </strong>
                            {Number(record.saldoPendiente || 0) > 0 ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 block w-max mt-0.5">
                                Saldo: ${Number(record.saldoPendiente).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 block w-max mt-0.5">
                                Pagado 100%
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setSelectedRecordForDetail(record)}
                                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                                title="Ver Ficha Detallada"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSendWhatsApp(record)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                                title="Enviar WhatsApp de Vigencia"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>

                              {onDeleteRecord && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar la póliza ${record.numeroTicket}?`)) {
                                      onDeleteRecord(record.id);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
                                  title="Eliminar Registro"
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
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 4. VISTA DE FORMULARIO COMPLETO: IDÉNTICO A ALISTAMIENTO CON FECHA DE VENCIMIENTO EN LUGAR DE HORA */
        <form onSubmit={handleSubmitForm} className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs space-y-6">
            {/* Header del Formulario */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <span className="font-mono text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                  {formData.numeroTicket || 'NUEVA POLIZA'}
                </span>
                <h3 className="text-base font-black text-zinc-900 mt-1">
                  Formulario de Registro • Garantía Plus Matriz
                </h3>
                <p className="text-xs text-zinc-500">
                  Ingrese los datos del cliente, la motocicleta y defina la vigencia del servicio.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Garantía Plus</span>
                </button>
              </div>
            </div>

            {/* GRID DE 3 MÓDULOS EN LA MISMA VISTA (ESTILO ALISTAMIENTO) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ========================================================================= */}
              {/* MÓDULO 1: DATOS DEL CLIENTE & SEDE */}
              {/* ========================================================================= */}
              <div className="space-y-4 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">
                    1. Datos del Cliente & Sede
                  </h4>
                </div>

                {/* Sede y Atendido Por */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Sede de Registro *
                    </label>
                    <select
                      value={formData.sede}
                      onChange={(e) => handleSedeChange(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                    >
                      {storedWorkshops.map((w) => (
                        <option key={w.id} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Atendido Por *
                    </label>
                    <input
                      type="text"
                      value={formData.atendidoPor}
                      onChange={(e) => setFormData({ ...formData, atendidoPor: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Cédula con Consulta SRI */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Cédula / RUC del Cliente *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={formData.cedulaRuc}
                        onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                        placeholder="Ej: 1205928174"
                        required
                        className="flex-1 px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={handleSearchCedula}
                        disabled={isSearchingSri}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                        title="Consultar SRI y base de datos"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isSearchingSri ? '...' : 'SRI'}</span>
                      </button>
                    </div>
                    {clientFoundMessage && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                        {clientFoundMessage}
                      </p>
                    )}
                  </div>

                  {/* Nombres y Apellidos */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Nombres *
                      </label>
                      <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* Celulares 1, 2 y 3 */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Celular Principal *
                      </label>
                      <input
                        type="tel"
                        value={formData.celular1}
                        onChange={(e) => setFormData({ ...formData, celular1: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="0990000000"
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                          Celular 2 (Opcional)
                        </label>
                        <input
                          type="tel"
                          value={formData.celular2}
                          onChange={(e) => setFormData({ ...formData, celular2: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="0980000000"
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                          Celular 3 (Opcional)
                        </label>
                        <input
                          type="tel"
                          value={formData.celular3}
                          onChange={(e) => setFormData({ ...formData, celular3: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          placeholder="0970000000"
                          className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-amber-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email & Dirección */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Dirección Domiciliaria
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      placeholder="Calle principal y secundaria"
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* MÓDULO 2: DATOS DE LA MOTOCICLETA */}
              {/* ========================================================================= */}
              <div className="space-y-4 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">
                    2. Datos de la Motocicleta
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Placa con Detección */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Placa Oficial *
                    </label>
                    <input
                      type="text"
                      value={formData.placa}
                      onChange={(e) => handleSearchPlaca(e.target.value)}
                      placeholder="Ej: AA-892B o SIN PLACA"
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Chasis / VIN */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Número de Chasis (VIN) *
                    </label>
                    <input
                      type="text"
                      value={formData.chasis}
                      onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                      placeholder="Ej: 3PC8E10B5N1098412"
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Motor & RAMV */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Número de Motor
                      </label>
                      <input
                        type="text"
                        value={formData.numeroMotor}
                        onChange={(e) => setFormData({ ...formData, numeroMotor: e.target.value.toUpperCase() })}
                        placeholder="Ej: 157FMI-894120"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        RAMV (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.ramv}
                        onChange={(e) => setFormData({ ...formData, ramv: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* Modelo y Marca */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Marca & Modelo *
                    </label>
                    <input
                      type="text"
                      value={formData.modeloMarca}
                      onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                      placeholder="Ej: Shineray XY200GY o Daytona Striker 150"
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                    />
                  </div>

                  {/* Color, Año & Kilometraje */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Negro"
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Año
                      </label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                        min={2000}
                        max={2030}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Kilometraje
                      </label>
                      <input
                        type="number"
                        value={formData.kilometraje}
                        onChange={(e) => setFormData({ ...formData, kilometraje: Number(e.target.value) })}
                        min={0}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* MÓDULO 3: SERVICIO & VIGENCIA GARANTÍA PLUS */}
              {/* ========================================================================= */}
              <div className="space-y-4 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">
                    3. Servicio & Vigencia Garantía Plus
                  </h4>
                </div>

                <div className="space-y-3">
                  {/* Técnico Responsable */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                      Técnico Encargado de la Sede *
                    </label>
                    <select
                      value={formData.tecnicoResponsable}
                      onChange={(e) => {
                        const techName = e.target.value;
                        const tech = filteredTechnicians.find((t) => t.name === techName);
                        setFormData({
                          ...formData,
                          tecnicoResponsable: techName,
                          tecnicoId: tech ? tech.id : 'tech-01',
                        });
                      }}
                      required
                      className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                    >
                      <option value="">Seleccione Técnico</option>
                      {filteredTechnicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Servicios Cubiertos por la Garantía Plus */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1.5">
                      Servicios Cubiertos por la Garantía Plus *
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        { id: 'alistamiento_pdi', label: 'Alistamiento & PDI Inicial' },
                        { id: 'engrasado', label: 'Engrasado Técnico General' },
                        { id: 'mantenimiento', label: 'Mantenimiento Preventivo Periódico' },
                      ].map((s) => {
                        const checked = formData.serviciosRealizados.includes(s.id as ServiceActionType);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleServicio(s.id as ServiceActionType)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between border transition cursor-pointer ${
                              checked
                                ? 'bg-amber-100/70 border-amber-400 text-amber-950'
                                : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                            }`}
                          >
                            <span>{s.label}</span>
                            {checked && <Check className="w-4 h-4 text-amber-700" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* DIFERENCIA CLAVE: FECHA DE SERVICIO & FECHA DE VENCIMIENTO (EN LUGAR DE LA HORA) */}
                  {/* ========================================================================= */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Fecha de Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.fechaServicio}
                        onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-amber-800 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-600" />
                        <span>Fecha Vencimiento *</span>
                      </label>
                      <input
                        type="date"
                        value={formData.fechaVencimiento}
                        onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>

                  {/* Aceite y Próximo Mantenimiento */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Tipo de Aceite
                      </label>
                      <select
                        value={formData.tipoAceite}
                        onChange={(e) => setFormData({ ...formData, tipoAceite: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600"
                      >
                        <option value="10W-40 Motul">10W-40 Motul</option>
                        <option value="20W-50 Castrol">20W-50 Castrol</option>
                        <option value="15W-50 Yamalube">15W-50 Yamalube</option>
                        <option value="10W-30 Havoline">10W-30 Havoline</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                        Próx. Mantenimiento (Km)
                      </label>
                      <input
                        type="number"
                        value={formData.proximoMantenimientoKm}
                        onChange={(e) => setFormData({ ...formData, proximoMantenimientoKm: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* MÓDULO 4: CONTABILIDAD MATRIZ & PRECIOS DEL PAQUETE */}
            {/* ========================================================================= */}
            <div className="pt-4 border-t border-zinc-200">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wider">
                  4. Contabilidad Matriz & Pago del Paquete Garantía Plus
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                {/* Costo del Paquete */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Valor Póliza Garantía Plus ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valorServicio}
                    onFocus={selectOnFocus}
                    onChange={(e) => handleValorChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-black text-zinc-900 outline-none focus:border-amber-600"
                  />
                </div>

                {/* Monto Pagado */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Monto Pagado / Abono ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.montoPagado}
                    onFocus={selectOnFocus}
                    onChange={(e) => handleMontoPagadoChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-black text-emerald-800 outline-none focus:border-amber-600"
                  />
                </div>

                {/* Saldo Pendiente */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Saldo Pendiente ($)
                  </label>
                  <input
                    type="number"
                    value={formData.saldoPendiente}
                    readOnly
                    className="w-full px-3 py-2 bg-zinc-100 border border-zinc-300 rounded-xl text-sm font-mono font-black text-zinc-700 outline-none"
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={formData.metodoPago}
                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-amber-600"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Tarjeta">Tarjeta de Crédito / Débito</option>
                  </select>
                </div>
              </div>

              {/* Si es Transferencia: Subir Comprobante */}
              {formData.metodoPago === 'Transferencia' && (
                <div className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">
                      Comprobante de Transferencia:
                    </span>
                    {formData.evidenciaTransferencia && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        ✓ Cargado
                      </span>
                    )}
                  </div>
                  <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{formData.evidenciaTransferencia ? 'Cambiar Imagen' : 'Subir Comprobante'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadTransferencia}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Fotos y Evidencias de entrega */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase text-zinc-600 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Fotos / Evidencias de Entrega de Garantía Plus</span>
                  </label>
                  <label className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Añadir Fotos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleUploadFotos}
                      className="hidden"
                    />
                  </label>
                </div>

                {formData.fotos && formData.fotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {formData.fotos.map((img, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl border border-zinc-200 overflow-hidden shrink-0">
                        <img src={img} alt="Foto" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              fotos: prev.fotos.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="absolute top-1 right-1 p-0.5 rounded bg-black/70 text-white opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observaciones */}
              <div className="mt-4">
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-1">
                  Observaciones / Términos de la Póliza
                </label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Detalles adicionales sobre la cobertura de Garantía Plus..."
                  className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600"
                />
              </div>
            </div>

            {/* Botones de Pie */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Póliza Garantía Plus</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 5. MODAL DE FICHA DETALLADA / CERTIFICADO DE GARANTÍA PLUS */}
      {selectedRecordForDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedRecordForDetail(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Certificado */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-zinc-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-200 bg-white/10 px-2 py-0.5 rounded">
                      {selectedRecordForDetail.numeroTicket}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                      Certificado Garantía Plus
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-1">
                    {selectedRecordForDetail.nombres} {selectedRecordForDetail.apellidos}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRecordForDetail(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenido de la Ficha */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Banner de Vigencia */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                    Estado de la Póliza
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {isVigente(selectedRecordForDetail.fechaVencimiento) ? (
                      <span className="text-sm font-black text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>VIGENTE Y ACTIVA</span>
                      </span>
                    ) : (
                      <span className="text-sm font-black text-rose-800 flex items-center gap-1">
                        <Clock className="w-4 h-4 text-rose-600" />
                        <span>VENCIDA / EXPIRADA</span>
                      </span>
                    )}
                    <span className="text-zinc-500 font-mono text-xs">
                      (Vigente desde {selectedRecordForDetail.fechaServicio} hasta {selectedRecordForDetail.fechaVencimiento})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(selectedRecordForDetail)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar por WhatsApp</span>
                </button>
              </div>

              {/* 3 Módulos en Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cliente */}
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">Cliente</span>
                  <div>C.I.: <strong className="font-mono">{selectedRecordForDetail.cedulaRuc}</strong></div>
                  <div>Celular: <strong className="text-emerald-700 font-mono">{selectedRecordForDetail.celular1}</strong></div>
                  {selectedRecordForDetail.celular2 && <div>Cel 2: <span className="font-mono text-zinc-600">{selectedRecordForDetail.celular2}</span></div>}
                  {selectedRecordForDetail.direccion && <div>Dir: <span className="text-zinc-700">{selectedRecordForDetail.direccion}</span></div>}
                </div>

                {/* Motocicleta */}
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">Motocicleta</span>
                  <div>Modelo: <strong>{selectedRecordForDetail.modeloMarca}</strong></div>
                  <div>Placa: <strong className="font-mono">{selectedRecordForDetail.placa}</strong></div>
                  <div>Chasis: <span className="font-mono text-[10px] text-zinc-700">{selectedRecordForDetail.chasis}</span></div>
                  {selectedRecordForDetail.numeroMotor && <div>Motor: <span className="font-mono text-[10px] text-zinc-600">{selectedRecordForDetail.numeroMotor}</span></div>}
                </div>

                {/* Sede y Técnico */}
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">Sede & Despacho</span>
                  <div>Sede: <strong className="text-cyan-800">{selectedRecordForDetail.sede}</strong></div>
                  <div>Técnico: <strong>{selectedRecordForDetail.tecnicoResponsable}</strong></div>
                  <div>Aceite: <span>{selectedRecordForDetail.tipoAceite}</span></div>
                  <div>Atendido: <span className="text-zinc-600">{selectedRecordForDetail.atendidoPor}</span></div>
                </div>
              </div>

              {/* Servicios y Precios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">
                    Servicios Cubiertos sin Costo en Alistamiento:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRecordForDetail.serviciosRealizados.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase"
                      >
                        ✓ {s === 'alistamiento_pdi' ? 'Alistamiento PDI' : s}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 italic">
                    * Al ingresar este cliente o placa en el módulo de Alistamiento, los servicios seleccionados no tendrán costo para el cliente (Pagado).
                  </p>
                </div>

                <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1 text-xs font-mono">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block font-sans">
                    Detalle Económico Matriz:
                  </span>
                  <div className="flex justify-between">
                    <span>Valor Paquete:</span>
                    <strong>${Number(selectedRecordForDetail.valorServicio || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Monto Pagado:</span>
                    <strong>${Number(selectedRecordForDetail.montoPagado || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>Saldo Pendiente:</span>
                    <strong>${Number(selectedRecordForDetail.saldoPendiente || 0).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-zinc-600 pt-1 border-t border-zinc-200">
                    <span>Método de Pago:</span>
                    <strong className="font-sans">{selectedRecordForDetail.metodoPago}</strong>
                  </div>
                </div>
              </div>

              {/* Fotos si las hay */}
              {selectedRecordForDetail.fotos && selectedRecordForDetail.fotos.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">
                    Fotos de Entrega ({selectedRecordForDetail.fotos.length}):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedRecordForDetail.fotos.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Foto"
                        className="w-20 h-20 rounded-xl object-cover border border-zinc-200 cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500 font-mono">
                Registrado el: {new Date(selectedRecordForDetail.createdAt).toLocaleString('es-EC')}
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-5 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VISOR DE FOTO */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="Evidencia" className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
