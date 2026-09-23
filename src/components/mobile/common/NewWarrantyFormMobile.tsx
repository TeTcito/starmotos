// src/components/mobile/common/NewWarrantyFormMobile.tsx
import React, { useState, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  User,
  Bike,
  Wrench,
  Camera,
  Plus,
  ArrowLeft,
  Search,
  Check,
  Package,
  DollarSign,
  Trash2,
  ZoomIn,
  Send,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Play,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import {
  WarrantyRequest,
  TallerClient,
} from '../../../types/customer';
import { getStoredFullAlistamientos } from '../../../data/mockMultiRoleData';
import { compressImageBase64 } from '../../../utils/imageCompressor';

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.startsWith('data:video/') ||
    /\.(mp4|webm|ogg|mov|m4v|quicktime)(\?.*)?$/i.test(url)
  );
};

interface Props {
  onCancel: () => void;
  onSubmit: (newReq: WarrantyRequest) => void;
  clients?: TallerClient[];
  defaultTallerOrigin?: string;
  defaultTallerOriginId?: string;
}

export const NewWarrantyFormMobile: React.FC<Props> = ({
  onCancel,
  onSubmit,
  clients = [],
  defaultTallerOrigin = 'StarMotos Sede Matriz',
  defaultTallerOriginId = 'sede-matriz',
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Pestañas activas: cliente, moto, reclamo, fotos
  const [activeTab, setActiveTab] = useState<'cliente' | 'moto' | 'reclamo' | 'fotos'>('cliente');

  // Estado del formulario
  const [formData, setFormData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    tallerOrigin: defaultTallerOrigin,
    warrantyType: 'marca' as 'marca' | 'plus_taller' | 'gps',
    motorcycleBrand: 'Benelli',
    motorcycleModel: 'TRK 502X ABS',
    motorcyclePlate: '',
    motorcycleMileage: 0,
    motorcycleVin: '',
    motorNumber: '',
    ramvNumber: '',
    invoiceNumber: `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    issueDescription: '',
    resolutionType: 'envio_repuesto' as 'encargar_taller' | 'envio_repuesto',
    estimatedCost: '60',
    photos: [] as string[],
  });

  // Repuestos en tags
  const [partsTags, setPartsTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Auxiliares para cálculo de presupuesto oficial en taller
  const QUICK_LABOR_TIMES = ['30 min', '1 hora', '2 horas', '3 horas', '4 horas'];
  const [laborTime, setLaborTime] = useState<string>('1 hora');
  const [laborCost, setLaborCost] = useState<number>(25);
  const [partsBudgetMap, setPartsBudgetMap] = useState<Record<string, number>>({});

  const partsTotal = useMemo(() => {
    return partsTags.reduce((acc, tag) => acc + (partsBudgetMap[tag] || 0), 0);
  }, [partsTags, partsBudgetMap]);

  // Estados de interfaz y búsqueda
  const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');

  // Agregar tag de repuesto
  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !partsTags.includes(t)) {
      setPartsTags([...partsTags, t]);
      setTagInput('');
    }
  };

  // Eliminar tag de repuesto
  const handleRemoveTag = (idx: number) => {
    const removedTag = partsTags[idx];
    setPartsTags(partsTags.filter((_, i) => i !== idx));
    const nextMap = { ...partsBudgetMap };
    delete nextMap[removedTag];
    setPartsBudgetMap(nextMap);
  };

  // Consulta y autocompletado de cliente por Cédula / RUC
  const handleConsultClient = () => {
    const term = formData.clientIdNumber.trim().toLowerCase();
    if (!term) {
      setSearchStatus({ type: 'warning', message: 'Ingrese una cédula o RUC para consultar' });
      return;
    }

    const foundClient = clients.find(
      (c) =>
        c.idNumber?.toLowerCase() === term ||
        c.idNumber?.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term))
    );

    const alistamientos = getStoredFullAlistamientos();
    const foundAlist = alistamientos.find(
      (r) =>
        r.cedulaRuc?.toLowerCase() === term ||
        r.cedulaRuc?.toLowerCase().includes(term) ||
        (r.celular1 && r.celular1.includes(term))
    );

    if (foundClient || foundAlist) {
      const clientName = foundClient?.fullName || (foundAlist ? `${foundAlist.nombres} ${foundAlist.apellidos}`.trim() : '');
      const clientIdNumber = foundClient?.idNumber || foundAlist?.cedulaRuc || '';
      const clientPhone = foundClient?.phone || foundAlist?.celular1 || '';
      const motorcycleBrand = foundClient?.motorcycleBrand || (foundAlist?.modeloMarca ? foundAlist.modeloMarca.split(' ')[0] : 'Benelli');
      const motorcycleModel = foundClient?.motorcycleModel || foundAlist?.modeloMarca || '';
      const motorcyclePlate = (foundClient?.motorcyclePlate || foundAlist?.placa || '').toUpperCase();
      const motorcycleVin = foundClient?.motorcycleVin || foundAlist?.chasis || '';
      const motorNumber = (foundAlist?.numeroMotor || foundClient?.motorNumber || '').toUpperCase();
      const ramvNumber = (foundAlist?.ramv || foundClient?.ramvNumber || '').toUpperCase();
      const motorcycleMileage = foundClient?.motorcycleMileage !== undefined
        ? foundClient.motorcycleMileage
        : (foundAlist?.kilometraje !== undefined ? foundAlist.kilometraje : 1000);

      setFormData((prev) => ({
        ...prev,
        clientName: clientName || prev.clientName,
        clientIdNumber: clientIdNumber || prev.clientIdNumber,
        clientPhone: clientPhone || prev.clientPhone,
        motorcycleBrand: motorcycleBrand || prev.motorcycleBrand,
        motorcycleModel: motorcycleModel || prev.motorcycleModel,
        motorcyclePlate: motorcyclePlate || prev.motorcyclePlate,
        motorcycleVin: motorcycleVin || prev.motorcycleVin,
        motorNumber: motorNumber || prev.motorNumber,
        ramvNumber: ramvNumber || prev.ramvNumber,
        motorcycleMileage: Number(motorcycleMileage) || 0,
      }));

      setSearchStatus({
        type: 'success',
        message: `✓ Datos cargados: ${clientName || clientIdNumber}`,
      });
    } else {
      setSearchStatus({
        type: 'warning',
        message: 'No registrado. Ingrese los datos manualmente.',
      });
    }
  };

  // Subir fotos o videos desde archivos o cámara
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    try {
      const newItems: string[] = [];
      for (const file of Array.from(files)) {
        if (file.type.startsWith('video/')) {
          if (file.size > 50 * 1024 * 1024) {
            alert(`El video "${file.name}" supera los 50 MB. Por favor seleccione un video más corto.`);
            continue;
          }
          const base64Video = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          if (base64Video) {
            newItems.push(base64Video);
          }
        } else if (file.type.startsWith('image/')) {
          const compressed = await compressImageBase64(file);
          if (compressed) {
            newItems.push(compressed);
          }
        }
      }

      if (newItems.length > 0) {
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newItems],
        }));
      }
    } catch (err) {
      console.error('Error al procesar archivo multimedia:', err);
      alert('Ocurrió un error al procesar el archivo seleccionado.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Agregar imagen por URL
  const handleAddImageUrl = () => {
    const url = urlInputValue.trim();
    if (!url) return;
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, url],
    }));
    setUrlInputValue('');
    setShowUrlInput(false);
  };

  // Eliminar foto
  const handleRemovePhoto = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== idx),
    }));
  };

  // Cargar fotos de prueba
  const handleAddSamplePhotos = () => {
    const samples = [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    ];
    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...samples],
    }));
  };

  // Validación y envío del formulario
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.clientName.trim() || !formData.clientIdNumber.trim()) {
      setActiveTab('cliente');
      alert('Por favor ingrese la cédula y el nombre del cliente.');
      return;
    }

    if (!formData.issueDescription.trim()) {
      setActiveTab('reclamo');
      alert('Por favor detalle la falla reportada en el reclamo técnico.');
      return;
    }

    const newReq: WarrantyRequest = {
      id: `gar-${Date.now()}`,
      requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'Hoy, Solicitud Emitida',
      clientName: formData.clientName.trim(),
      clientIdNumber: formData.clientIdNumber.trim(),
      clientPhone: formData.clientPhone.trim(),
      tallerOrigin: formData.tallerOrigin.trim() || defaultTallerOrigin,
      tallerOriginId: defaultTallerOriginId,
      warrantyType: formData.warrantyType,
      motorcycleBrand: formData.motorcycleBrand.trim(),
      motorcycleModel: formData.motorcycleModel.trim(),
      motorcyclePlate: formData.motorcyclePlate.trim().toUpperCase() || 'SIN PLACA',
      motorcycleMileage: Number(formData.motorcycleMileage) || 0,
      motorcycleVin: formData.motorcycleVin.trim().toUpperCase() || `VIN-${Date.now().toString().slice(-6)}`,
      motorNumber: formData.motorNumber.trim().toUpperCase() || 'S/N',
      ramvNumber: formData.ramvNumber.trim().toUpperCase() || 'S/N',
      invoiceNumber: formData.invoiceNumber.trim() || `TCK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDescription: formData.issueDescription.trim(),
      partsTags: partsTags,
      partsRequired: partsTags.join(', '),
      resolutionType: formData.resolutionType,
      diagnosticPhotos:
        formData.photos.length > 0
          ? formData.photos
          : [
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
            ],
      status: 'en_revision',
      estimatedCost: formData.resolutionType === 'encargar_taller' ? parseFloat(formData.estimatedCost) || 60 : 0,
    };

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
    onSubmit(newReq);
  };

  // Navegación paso a paso
  const handleNextTab = () => {
    if (activeTab === 'cliente') setActiveTab('moto');
    else if (activeTab === 'moto') setActiveTab('reclamo');
    else if (activeTab === 'reclamo') setActiveTab('fotos');
    else handleFormSubmit();
  };

  const handlePrevTab = () => {
    if (activeTab === 'fotos') setActiveTab('reclamo');
    else if (activeTab === 'reclamo') setActiveTab('moto');
    else if (activeTab === 'moto') setActiveTab('cliente');
    else onCancel();
  };

  return (
    <div className="w-full flex flex-col min-h-0 space-y-3 -mt-1.5 animate-fade-in">
      {/* Selector para Cámara directa (Foto / Video) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selector para Galería / Archivos existentes */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DE NUEVA GARANTÍA                                            */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-black text-zinc-900 tracking-tight leading-tight truncate">
                Nueva Solicitud de Garantía
              </h2>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 bg-blue-50 text-blue-700 border-blue-200 uppercase">
                EMISIÓN
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
              {formData.tallerOrigin}
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 border border-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Cancelar y Volver"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600" />
          </button>

          <button
            type="button"
            onClick={() => handleFormSubmit()}
            className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Emitir Solicitud"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Emitir</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SELECTOR DE PESTAÑAS (COLOR TRAZABILIDAD: CLIENTE, MOTO, RECLAMO, FOTOS)*/}
      {/* ========================================================================= */}
      <div className="flex rounded-xl bg-emerald-50/40 p-1 gap-1 overflow-x-auto shrink-0 scrollbar-none text-[11px] font-bold border border-emerald-100">
        {/* Pestaña: Cliente */}
        <button
          type="button"
          onClick={() => setActiveTab('cliente')}
          className={`flex-1 min-w-[75px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'cliente'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Cliente</span>
        </button>

        {/* Pestaña: Moto */}
        <button
          type="button"
          onClick={() => setActiveTab('moto')}
          className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'moto'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <Bike className="w-3.5 h-3.5 shrink-0" />
          <span>Moto</span>
        </button>

        {/* Pestaña: Reclamo */}
        <button
          type="button"
          onClick={() => setActiveTab('reclamo')}
          className={`flex-1 min-w-[78px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'reclamo'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>Reclamo</span>
        </button>

        {/* Pestaña: Fotos */}
        <button
          type="button"
          onClick={() => setActiveTab('fotos')}
          className={`flex-1 min-w-[75px] py-1.5 px-2.5 rounded-lg whitespace-nowrap transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
            activeTab === 'fotos'
              ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs font-black'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900 hover:bg-emerald-100 font-bold'
          }`}
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span>Fotos</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE 1: DATOS DEL CLIENTE & SEDE                                      */}
      {/* ========================================================================= */}
      {activeTab === 'cliente' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <span>1. Datos del Cliente & Póliza</span>
          </div>

          {/* Cédula o RUC con botón Consultar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-700">
                Cédula o RUC <span className="text-red-500">*</span>
              </label>
              {searchStatus && (
                <span
                  className={`text-[10px] font-bold ${
                    searchStatus.type === 'success' ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                >
                  {searchStatus.message}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={formData.clientIdNumber}
                onChange={(e) => {
                  setFormData({ ...formData, clientIdNumber: e.target.value });
                  if (searchStatus) setSearchStatus(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConsultClient();
                  }
                }}
                placeholder="Ej: 1700000000"
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleConsultClient}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Consultar</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              placeholder="Ej: Daniel Meza"
              required
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Teléfono / WhatsApp</label>
            <input
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
              placeholder="Ej: 0991234567"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Taller de Origen</label>
            <input
              type="text"
              value={formData.tallerOrigin}
              readOnly
              className="w-full px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 outline-none cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Tipo de Póliza</label>
            <select
              value={formData.warrantyType}
              onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value as any })}
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-blue-900 uppercase outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
            >
              <option value="marca">Garantía Oficial de Marca ({formData.motorcycleBrand || 'Fábrica'})</option>
              <option value="plus_taller">Garantía Plus StarMotos</option>
              <option value="gps">Garantía GPS Satelital</option>
            </select>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. BLOQUE 2: MOTOCICLETA REGISTRADA                                       */}
      {/* ========================================================================= */}
      {activeTab === 'moto' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bike className="w-4 h-4" />
            </div>
            <span>2. Motocicleta Registrada</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Marca y Modelo</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={formData.motorcycleBrand}
                onChange={(e) => setFormData({ ...formData, motorcycleBrand: e.target.value })}
                placeholder="Marca (Ej: Benelli)"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
              />
              <input
                type="text"
                value={formData.motorcycleModel}
                onChange={(e) => setFormData({ ...formData, motorcycleModel: e.target.value })}
                placeholder="Modelo (Ej: TRK 502X)"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700">Placa</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, motorcyclePlate: 'SIN PLACA' })}
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  S/P
                </button>
              </div>
              <input
                type="text"
                value={formData.motorcyclePlate}
                onChange={(e) => setFormData({ ...formData, motorcyclePlate: e.target.value.toUpperCase() })}
                placeholder="SIN PLACA"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Kilometraje</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={formData.motorcycleMileage}
                  onChange={(e) => setFormData({ ...formData, motorcycleMileage: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white pr-8"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-400">
                  km
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Serie o Chasis (VIN)</label>
            <input
              type="text"
              value={formData.motorcycleVin}
              onChange={(e) => setFormData({ ...formData, motorcycleVin: e.target.value.toUpperCase() })}
              placeholder="VIN / Número de chasis"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de Motor</label>
              <input
                type="text"
                value={formData.motorNumber}
                onChange={(e) => setFormData({ ...formData, motorNumber: e.target.value.toUpperCase() })}
                placeholder="S/N"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de RAMV</label>
              <input
                type="text"
                value={formData.ramvNumber}
                onChange={(e) => setFormData({ ...formData, ramvNumber: e.target.value.toUpperCase() })}
                placeholder="S/N"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 outline-none focus:border-blue-600 focus:bg-white uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">N° Factura / Ticket</label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
              placeholder="TCK-2026-GAR"
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-800 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BLOQUE 3: RECLAMO TÉCNICO & MODALIDAD                                  */}
      {/* ========================================================================= */}
      {activeTab === 'reclamo' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 text-xs sm:text-sm font-black text-zinc-900">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <span>3. Reclamo Técnico & Modalidad</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Falla Reportada <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 outline-none focus:border-blue-600 focus:bg-white resize-none leading-relaxed"
              placeholder="Describa detalladamente el problema o falla presentada..."
              required
            />
          </div>

          {/* Repuestos Requeridos con Tags */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">
              Repuestos Requeridos ({partsTags.length})
            </label>
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Escriba repuesto y pulse +..."
                className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-blue-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                +
              </button>
            </div>

            {partsTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl min-h-[44px]">
                {partsTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="text-blue-500 hover:text-red-600 ml-0.5 cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
                Sin repuestos desglosados
              </p>
            )}
          </div>

          {/* Modalidad de Resolución (2 Botones interactivos) */}
          <div className="space-y-2 pt-1 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-700">
                Modalidad de Resolución <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Seleccionada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Opción 1: Encargar al taller */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, resolutionType: 'encargar_taller' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  formData.resolutionType === 'encargar_taller'
                    ? 'border-indigo-600 bg-indigo-50/90 shadow-2xs ring-2 ring-indigo-200'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-black text-zinc-900 leading-tight">Encargar al taller</span>
                  </div>
                  {formData.resolutionType === 'encargar_taller' && (
                    <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  El taller ejecuta el trabajo y factura repuestos / mano de obra.
                </p>
              </button>

              {/* Opción 2: Envío de repuesto */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, resolutionType: 'envio_repuesto' })}
                className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  formData.resolutionType === 'envio_repuesto'
                    ? 'border-emerald-600 bg-emerald-50/90 shadow-2xs ring-2 ring-emerald-200'
                    : 'border-zinc-200 bg-zinc-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs font-black text-zinc-900 leading-tight">Envío de repuesto</span>
                  </div>
                  {formData.resolutionType === 'envio_repuesto' && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Fábrica o Marca despacha directamente las piezas sin costo.
                </p>
              </button>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECCIÓN DE PRESUPUESTO OFICIAL (SOLO SI 'Encargar al taller')   */}
          {/* =============================================================== */}
          {formData.resolutionType === 'encargar_taller' && (
            <div className="pt-3 border-t border-zinc-100 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900 leading-tight">
                      Presupuesto Oficial (Taller / Liquidación)
                    </h4>
                    <p className="text-[10px] text-zinc-500">
                      Desglose de repuestos solicitados y mano de obra a liquidar
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  ${parseFloat(formData.estimatedCost || '60').toFixed(2)} USD
                </span>
              </div>

              <div className="space-y-3 bg-zinc-50/70 p-3 rounded-xl border border-zinc-200">
                {/* 1. Repuestos Desglosados */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                      1. Presupuesto Repuestos ({partsTags.length})
                    </label>
                    {partsTotal > 0 && (
                      <span className="text-[11px] font-mono font-bold text-indigo-700">
                        Subtotal: ${partsTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {partsTags.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {partsTags.map((tag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-zinc-200 text-xs"
                        >
                          <span className="font-semibold text-zinc-800 truncate flex-1">{tag}</span>
                          <div className="relative w-24 shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[11px]">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={partsBudgetMap[tag] !== undefined ? partsBudgetMap[tag] : ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const newMap = { ...partsBudgetMap, [tag]: val };
                                setPartsBudgetMap(newMap);
                                const newPartsTotal = partsTags.reduce((acc, t) => acc + (newMap[t] || 0), 0);
                                const newTotal = newPartsTotal + (laborCost || 0);
                                setFormData({ ...formData, estimatedCost: newTotal.toFixed(2) });
                              }}
                              className="w-full py-1 pl-5 pr-2 bg-zinc-50 border border-zinc-200 focus:border-indigo-600 focus:bg-white rounded-md text-xs font-mono font-bold text-right outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 italic bg-white p-2.5 rounded-lg border border-zinc-200">
                      No hay repuestos desglosados para cotizar.
                    </p>
                  )}
                </div>

                {/* 2. Mano de Obra */}
                <div className="space-y-2 pt-2 border-t border-zinc-200/80">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase tracking-wider block">
                    2. Mano de Obra
                  </label>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-medium block mb-1">
                      Tiempo Estimado de Demora:
                    </span>
                    <div className="grid grid-cols-5 gap-1">
                      {QUICK_LABOR_TIMES.map((timeOption) => (
                        <button
                          key={timeOption}
                          type="button"
                          onClick={() => setLaborTime(timeOption)}
                          className={`py-1 text-[10px] font-bold rounded-md border text-center transition cursor-pointer ${
                            laborTime === timeOption
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {timeOption}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-700 font-bold">Valor Mano de Obra ($):</span>
                    <div className="relative w-28">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={laborCost}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLaborCost(val);
                          const newTotal = partsTotal + val;
                          setFormData({ ...formData, estimatedCost: newTotal.toFixed(2) });
                        }}
                        className="w-full py-1.5 pl-6 pr-2 bg-white border border-zinc-300 rounded-lg text-xs font-mono font-bold text-right outline-none focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Resumen y Total General Editable */}
                <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-zinc-900">Total Liquidación:</span>
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      className="w-full py-1.5 pl-6 pr-2 bg-white border-2 border-emerald-400 rounded-lg text-xs font-mono font-black text-emerald-800 text-right outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BLOQUE 4: INSPECCIÓN VISUAL DEL DAÑO (FOTOGRAFÍAS)                     */}
      {/* ========================================================================= */}
      {activeTab === 'fotos' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3.5 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h4 className="text-xs sm:text-sm font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span>
                Evidencias de la Falla ({formData.photos.length})
              </span>
            </h4>
            <span className="text-[10px] text-zinc-400">Fotos & Videos</span>
          </div>

          {/* Botones principales: Cámara y Galería */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isUploadingMedia}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span>Cámara (Foto / Video)</span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploadingMedia}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4 shrink-0" />
              <span>Galería / Archivos</span>
            </button>
          </div>

          {/* Opciones secundarias: URL y Muestra */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex-1 py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              title="Agregar por URL"
            >
              <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Pegar URL</span>
            </button>

            <button
              type="button"
              onClick={handleAddSamplePhotos}
              className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
              title="Cargar Fotos de Muestra"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fotos Muestra</span>
            </button>
          </div>

          {/* Indicador de carga de archivo */}
          {isUploadingMedia && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-bold text-blue-700 animate-pulse">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Procesando archivo multimedia (comprimiendo foto / cargando video)...</span>
            </div>
          )}

          {/* Input de URL si está activo */}
          {showUrlInput && (
            <div className="flex gap-1.5 p-2 bg-zinc-50 border border-zinc-200 rounded-xl animate-fade-in">
              <input
                type="url"
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg o .mp4"
                className="flex-1 px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-3 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Agregar
              </button>
            </div>
          )}

          {/* Galería de fotos y videos agregados */}
          {formData.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {formData.photos.map((url, idx) => {
                const isVideo = isVideoUrl(url);
                return (
                  <div
                    key={idx}
                    className="aspect-video rounded-xl overflow-hidden border border-zinc-200 block group relative shadow-2xs bg-zinc-900"
                  >
                    {isVideo ? (
                      <div
                        onClick={() => setZoomImage(url)}
                        className="w-full h-full relative cursor-pointer flex items-center justify-center bg-black"
                      >
                        <video
                          src={url}
                          className="w-full h-full object-cover opacity-80"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-xs">
                            <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                          </div>
                        </div>
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600/90 text-white rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <Film className="w-2.5 h-2.5" /> Video
                        </span>
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Evidencia ${idx + 1}`}
                        onClick={() => setZoomImage(url)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      />
                    )}

                    <div className="absolute top-1 right-1 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="w-6 h-6 rounded-full bg-red-600/90 text-white flex items-center justify-center cursor-pointer hover:bg-red-700 transition shadow-2xs"
                        title="Eliminar evidencia"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1.5 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-mono font-bold z-10">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 border-2 border-dashed border-zinc-300 rounded-xl flex flex-col items-center justify-center text-center bg-zinc-50/70 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-400">
                <Camera className="w-6 h-6" />
                <Film className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-zinc-700 block">Adjunta fotos o videos de la falla</span>
                <span className="text-[10px] text-zinc-400">Toma foto/video directo con la cámara o selecciona desde tus archivos</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Usar Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Abrir Galería</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. LIGHTBOX MODAL PARA VER IMAGEN O VIDEO EN PANTALLA COMPLETA             */}
      {/* ========================================================================= */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-lg max-h-[85vh] bg-zinc-950 rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition z-20 text-xs font-bold"
            >
              ✕
            </button>
            {isVideoUrl(zoomImage) ? (
              <video
                src={zoomImage}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-auto max-w-full rounded-lg"
              />
            ) : (
              <img
                src={zoomImage}
                alt="Evidencia ampliada"
                className="max-h-[80vh] w-auto object-contain mx-auto"
              />
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. FOOTER DE NAVEGACIÓN Y ENVÍO                                           */}
      {/* ========================================================================= */}
      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={handlePrevTab}
          className="px-3.5 py-2 bg-zinc-100 hover:bg-zinc-200 active:scale-95 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>{activeTab === 'cliente' ? 'Cancelar' : 'Anterior'}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeTab !== 'fotos' ? (
            <button
              type="button"
              onClick={handleNextTab}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Siguiente</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFormSubmit()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Emitir Solicitud</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
