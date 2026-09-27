// src/components/mobile/admin/GarantiasPlusMobile.tsx
import React, { useState, useMemo } from 'react';
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
  MessageCircle,
  Camera,
  Upload,
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
  getStoredTechnicians,
  getStoredWorkshops,
} from '../../../data/mockMultiRoleData';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { compressImageBase64 } from '../../../utils/imageCompressor';

interface Props {
  records: GarantiaPlusRecord[];
  onSaveRecord?: (record: GarantiaPlusRecord) => void;
  onDeleteRecord?: (id: string) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export const GarantiasPlusMobile: React.FC<Props> = ({
  records,
  onSaveRecord,
  onDeleteRecord,
  showToast,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'activa' | 'vencida'>('all');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<GarantiaPlusRecord | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const nextYearStr = nextYearDate.toISOString().split('T')[0];

  const initialFormData = {
    id: '',
    numeroTicket: '',
    atendidoPor: 'William Daniel Meza (Gerente)',
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
    origen: 'Almacén Principal La Maná',
    placa: '',
    chasis: '',
    numeroMotor: '',
    ramv: '',
    modeloMarca: '',
    color: '',
    year: 2026,
    kilometraje: 0,
    serviciosRealizados: ['alistamiento_pdi', 'engrasado', 'mantenimiento'] as ServiceActionType[],
    tecnicoResponsable: '',
    tecnicoId: '',
    fechaServicio: todayStr,
    fechaVencimiento: nextYearStr,
    aceite: 'con_aceite',
    nivelAceite: 'semisintetico',
    tipoAceite: '10W-40 Motul',
    proximoMantenimientoKm: 3000,
    numeroFactura: '',
    valorServicio: 180.0,
    montoPagado: 180.0,
    abono: 180.0,
    saldoPendiente: 0.0,
    metodoPago: 'Efectivo',
    evidenciaTransferencia: '',
    fotos: [] as string[],
    observaciones: 'Garantía Plus activada en Matriz. Mantenimientos cubiertos al 100%.',
    estado: 'activa' as 'activa' | 'vencida' | 'cancelada',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [isSearchingSri, setIsSearchingSri] = useState(false);

  const storedWorkshops = useMemo(() => getStoredWorkshops(), []);
  const storedTechnicians = useMemo(() => getStoredTechnicians(), []);

  const isVigente = (fechaVencimiento: string) => {
    if (!fechaVencimiento) return false;
    const [y, m, d] = fechaVencimiento.split('-').map(Number);
    const venc = new Date(y, m - 1, d);
    venc.setHours(23, 59, 59, 999);
    return venc.getTime() >= Date.now();
  };

  const stats = useMemo(() => {
    let vigentes = 0;
    let vencidas = 0;
    records.forEach((r) => {
      if (isVigente(r.fechaVencimiento) && r.estado !== 'cancelada') {
        vigentes++;
      } else {
        vencidas++;
      }
    });
    return { total: records.length, vigentes, vencidas };
  }, [records]);

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
        (r.numeroTicket || '').toLowerCase().includes(q) ||
        phones.includes(q);

      const activa = isVigente(r.fechaVencimiento) && r.estado !== 'cancelada';
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'activa' && activa) ||
        (filterStatus === 'vencida' && !activa);

      return matchQuery && matchStatus;
    });
  }, [records, searchTerm, filterStatus]);

  // Consulta rápida SRI / Clientes
  const handleSearchCedula = async () => {
    const rawCedula = formData.cedulaRuc.trim();
    if (!rawCedula || rawCedula.length < 10) {
      showToast?.('Ingrese una cédula de 10 dígitos.', 'error');
      return;
    }

    setIsSearchingSri(true);
    const alistamientos = getStoredFullAlistamientos();
    const prevAlist = alistamientos.find((a) => a.cedulaRuc === rawCedula);

    if (prevAlist) {
      setIsSearchingSri(false);
      setFormData((prev) => ({
        ...prev,
        nombres: prevAlist.nombres,
        apellidos: prevAlist.apellidos,
        celular1: prevAlist.celular1,
        celular2: prevAlist.celular2 || prev.celular2,
        email: prevAlist.email || prev.email,
        direccion: prevAlist.direccion || prev.direccion,
        placa: prevAlist.placa || prev.placa,
        chasis: prevAlist.chasis || prev.chasis,
        modeloMarca: prevAlist.modeloMarca || prev.modeloMarca,
      }));
      showToast?.(`Datos precargados: ${prevAlist.nombres}`, 'success');
      return;
    }

    try {
      const sriData = await querySriMock(rawCedula);
      setIsSearchingSri(false);
      if (sriData && sriData.razonSocial) {
        const parts = sriData.razonSocial.split(' ');
        setFormData((prev) => ({
          ...prev,
          nombres: parts.slice(0, 2).join(' '),
          apellidos: parts.slice(2).join(' ') || parts.slice(1).join(' '),
        }));
        showToast?.('Datos obtenidos de SRI.', 'success');
      }
    } catch {
      setIsSearchingSri(false);
    }
  };

  const handleOpenNewForm = () => {
    const ticketRandom = `GP-${Math.floor(10000 + Math.random() * 90000)}`;
    setFormData({
      ...initialFormData,
      id: `gp-${Date.now()}`,
      numeroTicket: ticketRandom,
      numeroFactura: `FAC-GP-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setViewMode('form');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cedulaRuc.trim() || !formData.nombres.trim() || !formData.celular1.trim()) {
      showToast?.('Complete los datos obligatorios del cliente.', 'error');
      return;
    }
    if (!formData.placa.trim() || !formData.chasis.trim()) {
      showToast?.('Complete la placa y el chasis de la moto.', 'error');
      return;
    }

    const newRecord: GarantiaPlusRecord = {
      id: formData.id || `gp-${Date.now()}`,
      numeroTicket: formData.numeroTicket || `GP-${Math.floor(10000 + Math.random() * 90000)}`,
      atendidoPor: formData.atendidoPor,
      sede: formData.sede,
      sedeId: formData.sedeId,
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
      origen: formData.origen,
      chasis: formData.chasis.trim().toUpperCase(),
      numeroMotor: formData.numeroMotor.trim().toUpperCase() || undefined,
      ramv: formData.ramv.trim() || undefined,
      placa: formData.placa.trim().toUpperCase(),
      modeloMarca: formData.modeloMarca.trim(),
      color: formData.color.trim() || undefined,
      year: Number(formData.year) || 2026,
      serviciosRealizados: formData.serviciosRealizados,
      tecnicoResponsable: formData.tecnicoResponsable || 'Técnico Encargado',
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (onSaveRecord) {
      onSaveRecord(newRecord);
    } else {
      saveStoredGarantiaPlusRecord(newRecord);
    }

    confetti({
      particleCount: 65,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#10b981'],
    });

    showToast?.('✓ Garantía Plus guardada.', 'success');
    setViewMode('list');
  };

  const handleSendWhatsApp = (record: GarantiaPlusRecord) => {
    const rawPhone = (record.celular1 || record.celular2 || '').replace(/\D/g, '');
    if (!rawPhone) {
      showToast?.('Sin celular registrado.', 'error');
      return;
    }
    const cleanPhone = rawPhone.startsWith('593')
      ? rawPhone
      : rawPhone.startsWith('0')
      ? `593${rawPhone.slice(1)}`
      : `593${rawPhone}`;

    const text = encodeURIComponent(
      `Hola estimado(a) *${record.nombres}*, le saludamos de *StarMotos Matriz*. 🌟\n\n` +
      `Le informamos que su moto *${record.modeloMarca}* (Placa: *${record.placa}*) cuenta con cobertura de *GARANTÍA PLUS*.\n` +
      `📅 *Vigencia hasta:* ${record.fechaVencimiento}\n` +
      `🔧 *Beneficio:* Todos sus mantenimientos preventivos y engrasados técnicos están 100% CUBIERTOS (sin costo).\n\n` +
      `¡Gracias por preferir StarMotos!`
    );

    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  return (
    <div className="space-y-3.5 animate-fade-in text-zinc-900 font-sans pb-16">
      {/* HEADER MÓVIL */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Garantías Plus Matriz</span>
          </span>
          <p className="text-[10px] text-zinc-500">Mantenimientos cubiertos sin costo</p>
        </div>

        {viewMode === 'list' ? (
          <button
            type="button"
            onClick={handleOpenNewForm}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className="px-3 py-1.5 bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver</span>
          </button>
        )}
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, placa, cédula o ticket..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 outline-none focus:border-amber-600 shadow-2xs"
            />
          </div>

          {/* Filtros de Pestaña */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                filterStatus === 'all' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600'
              }`}
            >
              Todas ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('activa')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                filterStatus === 'activa' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-zinc-600'
              }`}
            >
              Vigentes ({stats.vigentes})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('vencida')}
              className={`flex-1 py-1 rounded-lg text-center transition ${
                filterStatus === 'vencida' ? 'bg-rose-600 text-white shadow-2xs' : 'text-zinc-600'
              }`}
            >
              Vencidas ({stats.vencidas})
            </button>
          </div>

          {/* Lista de Tarjetas */}
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200">
              <Sparkles className="w-8 h-8 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-zinc-700">Sin pólizas de Garantía Plus</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {searchTerm.trim() ? 'No hay coincidencias.' : 'Registre la primera póliza con el botón Nueva.'}
              </p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const vigente = isVigente(record.fechaVencimiento) && record.estado !== 'cancelada';
              return (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecordForDetail(record)}
                  className="bg-white border-2 border-zinc-200 hover:border-amber-500 rounded-2xl p-3.5 shadow-xs space-y-3 cursor-pointer transition-all active:scale-[0.99] relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${vigente ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                  {/* Cabecera */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                          {record.numeroTicket}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                          <MapPin className="w-2.5 h-2.5 text-cyan-600" />
                          <span>{record.sede || 'Matriz'}</span>
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-zinc-900 mt-1 truncate">
                        {record.modeloMarca}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate">
                        Cliente: <strong className="text-zinc-800">{record.nombres} {record.apellidos}</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {vigente ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block">
                          Vigente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-800 border border-rose-200 inline-block">
                          Vencida
                        </span>
                      )}
                      <span className="block text-[10px] text-zinc-700 font-mono font-bold mt-1">
                        {record.placa}
                      </span>
                    </div>
                  </div>

                  {/* Cuadro de Vigencia y Servicios */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-amber-50/50 p-2.5 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-amber-900 text-[9px] uppercase font-bold block">Vigencia Póliza:</span>
                      <span className="font-mono text-zinc-700 block truncate">{record.fechaServicio}</span>
                      <span className="font-mono font-bold text-amber-900 block truncate">Vence: {record.fechaVencimiento}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[9px] uppercase font-bold block">Valor / Estado:</span>
                      <strong className="text-zinc-900 font-mono text-[11px] block">${Number(record.valorServicio || 0).toFixed(2)}</strong>
                      <span className="text-emerald-700 font-bold text-[9px] block">Mantenimientos $0</span>
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRecordForDetail(record);
                      }}
                      className="flex-1 py-1.5 bg-zinc-100 text-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Ficha</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendWhatsApp(record);
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* FORMULARIO MÓVIL */
        <form onSubmit={handleSubmitForm} className="space-y-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <span className="text-xs font-black text-amber-900 uppercase">
              Registrar Garantía Plus
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              {formData.numeroTicket}
            </span>
          </div>

          {/* 1. Cliente */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-black uppercase text-blue-700 block tracking-wider">
              1. Cliente & Sede
            </span>
            <div>
              <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Sede</label>
              <select
                value={formData.sede}
                onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
              >
                {storedWorkshops.map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Cédula / RUC *</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={formData.cedulaRuc}
                  onChange={(e) => setFormData({ ...formData, cedulaRuc: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                  placeholder="1205928174"
                  required
                  className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={handleSearchCedula}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  {isSearchingSri ? '...' : 'SRI'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Nombres *</label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Celular Principal *</label>
              <input
                type="tel"
                value={formData.celular1}
                onChange={(e) => setFormData({ ...formData, celular1: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                placeholder="0990000000"
                required
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* 2. Moto */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-black uppercase text-emerald-700 block tracking-wider">
              2. Motocicleta
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Placa *</label>
                <input
                  type="text"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                  placeholder="AA-892B"
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Chasis (VIN) *</label>
                <input
                  type="text"
                  value={formData.chasis}
                  onChange={(e) => setFormData({ ...formData, chasis: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Marca & Modelo *</label>
              <input
                type="text"
                value={formData.modeloMarca}
                onChange={(e) => setFormData({ ...formData, modeloMarca: e.target.value })}
                placeholder="Shineray XY200GY"
                required
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* 3. Servicio & Fechas: Fecha de Vencimiento en lugar de hora */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-black uppercase text-amber-700 block tracking-wider">
              3. Vigencia Garantía Plus
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Fecha Inicio *</label>
                <input
                  type="date"
                  value={formData.fechaServicio}
                  onChange={(e) => setFormData({ ...formData, fechaServicio: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-amber-900 mb-0.5">Fecha Vencimiento *</label>
                <input
                  type="date"
                  value={formData.fechaVencimiento}
                  onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-950"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Técnico Responsable</label>
              <select
                value={formData.tecnicoResponsable}
                onChange={(e) => setFormData({ ...formData, tecnicoResponsable: e.target.value })}
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
              >
                <option value="">Seleccione Técnico</option>
                {storedTechnicians.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Precio y Pago */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-100">
            <span className="text-[10px] font-black uppercase text-zinc-700 block tracking-wider">
              4. Contabilidad Matriz
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Valor Póliza ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valorServicio}
                  onChange={(e) => {
                    const clean = cleanNumberInput(e.target.value);
                    const v = clean === '' ? 0 : parseFloat(clean);
                    setFormData({ ...formData, valorServicio: v, montoPagado: v, abono: v, saldoPendiente: 0 });
                  }}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-zinc-600 mb-0.5">Método de Pago</label>
                <select
                  value={formData.metodoPago}
                  onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-bold"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Garantía Plus</span>
            </button>
          </div>
        </form>
      )}

      {/* MODAL DETALLE MÓVIL */}
      {selectedRecordForDetail && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setSelectedRecordForDetail(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-amber-600 to-zinc-900 text-white p-3.5 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-[10px] text-amber-200 bg-white/20 px-1.5 py-0.2 rounded">
                  {selectedRecordForDetail.numeroTicket}
                </span>
                <h4 className="text-xs font-black text-white mt-0.5">
                  {selectedRecordForDetail.nombres} {selectedRecordForDetail.apellidos}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="p-1 rounded-full bg-white/10 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 overflow-y-auto space-y-3 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-zinc-500 block">Cliente</span>
                <div>C.I.: <strong className="font-mono">{selectedRecordForDetail.cedulaRuc}</strong></div>
                <div>Celular: <strong className="font-mono text-emerald-700">{selectedRecordForDetail.celular1}</strong></div>
                <div>Sede: <strong className="text-cyan-800">{selectedRecordForDetail.sede}</strong></div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <span className="text-[9px] font-black uppercase text-amber-900 block">Vigencia Garantía Plus</span>
                <div>Inicio: <strong>{selectedRecordForDetail.fechaServicio}</strong></div>
                <div>Vence: <strong className="text-amber-950 font-bold">{selectedRecordForDetail.fechaVencimiento}</strong></div>
                <div className="text-[10px] text-emerald-700 font-bold">✓ Mantenimientos cubiertos sin costo</div>
              </div>

              <div className="space-y-1 pt-2 border-t border-zinc-100">
                <span className="text-[9px] font-black uppercase text-zinc-600 block">Moto</span>
                <div>{selectedRecordForDetail.modeloMarca} • Placa: <strong className="font-mono">{selectedRecordForDetail.placa}</strong></div>
                <div>VIN: <span className="font-mono text-[10px] text-zinc-600">{selectedRecordForDetail.chasis}</span></div>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 border-t border-zinc-200 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedRecordForDetail(null)}
                className="flex-1 py-2 text-xs font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(selectedRecordForDetail)}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl shadow-xs flex items-center justify-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
