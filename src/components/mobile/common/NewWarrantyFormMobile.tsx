// src/components/mobile/common/NewWarrantyFormMobile.tsx
import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  ShieldCheck,
  RefreshCw,
  Video,
  Building2,
  FileCheck2,
} from 'lucide-react';
import {
  WarrantyRequest,
  TallerClient,
} from '../../../types/customer';
import { getStoredFullAlistamientos, getRegisteredBrands } from '../../../data/mockMultiRoleData';
import { compressImageBase64, compressVideoBase64 } from '../../../utils/imageCompressor';
import { uploadWarrantyMedia } from '../../../services/mediaStorage';

export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.startsWith('data:video/') ||
    url.includes('/garantias/video_') ||
    url.includes('/video_') ||
    url.includes('_video_') ||
    /\.(mp4|webm|ogg|mov|m4v|quicktime)(\?.*)?$/i.test(url)
  );
};

interface Props {
  onCancel: () => void;
  onSubmit: (newReq: WarrantyRequest) => void;
  clients?: TallerClient[];
  defaultTallerOrigin?: string;
  defaultTallerOriginId?: string;
  viewerRole?: 'admin' | 'taller';
  isMatriz?: boolean;
}

export const NewWarrantyFormMobile: React.FC<Props> = ({
  onCancel,
  onSubmit,
  clients = [],
  defaultTallerOrigin = 'StarMotos Sede Matriz',
  defaultTallerOriginId = 'sede-matriz',
  viewerRole = 'taller',
  isMatriz = false,
}) => {
  const [registeredBrands, setRegisteredBrands] = useState<string[]>(getRegisteredBrands);
  const [destinationType, setDestinationType] = useState<'matriz' | 'garante'>('matriz');

  const ALL_POPULAR_BRANDS = useMemo(() => {
    const defaults = [
      'Thunder',
      'Benelli',
      'Bajaj',
      'Shineray',
      'Daytona',
      'Honda',
      'Yamaha',
      'Suzuki',
      'Loncin',
      'Tuko',
      'Ranger',
      'Dukare',
      'Motor1',
      'Haojue',
      'KTM',
      'Kawasaki',
      'TVS',
      'Hero',
      'Italika',
      'Zongshen',
    ];
    const combined = new Set([...registeredBrands, ...defaults]);
    return Array.from(combined).sort((a, b) => a.localeCompare(b));
  }, [registeredBrands]);

  useEffect(() => {
    const handleGarantesUpdated = () => {
      setRegisteredBrands(getRegisteredBrands());
    };
    window.addEventListener('starmotos_garantes_updated', handleGarantesUpdated);
    return () => {
      window.removeEventListener('starmotos_garantes_updated', handleGarantesUpdated);
    };
  }, []);

  // Pestañas activas: cliente, moto, reclamo, fotos
  const [activeTab, setActiveTab] = useState<'cliente' | 'moto' | 'reclamo' | 'fotos'>('cliente');

  // Estado del formulario (vacío en estado inicial sin marcas ni kilometraje prellenados)
  const [formData, setFormData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    tallerOrigin: defaultTallerOrigin,
    warrantyType: 'marca' as const,
    targetBrand: '',
    motorcycleBrand: '',
    motorcycleModel: '',
    motorcyclePlate: '',
    motorcycleMileage: '' as any,
    motorcycleVin: '',
    motorNumber: '',
    ramvNumber: '',
    invoiceNumber: `TCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    issueDescription: '',
    photos: [] as string[],
  });

  // 5 slots de fotos obligatorias y 2 slots de videos obligatorios
  const [photoSlots, setPhotoSlots] = useState<(string | null)[]>([null, null, null, null, null]);
  const [videoSlots, setVideoSlots] = useState<(string | null)[]>([null, null]);
  const [uploadingSlot, setUploadingSlot] = useState<{ type: 'photo' | 'video'; index: number } | null>(null);

  const activeSlotRef = useRef<{ type: 'photo' | 'video'; index: number } | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const PHOTO_SLOT_GUIDES = [
    { title: 'Foto 1: Vista General', desc: 'Panorámica lateral de la moto' },
    { title: 'Foto 2: Chasis (VIN)', desc: 'Grabado legible del chasis' },
    { title: 'Foto 3: Odómetro', desc: 'Kilometraje en el tablero' },
    { title: 'Foto 4: Pieza Averiada', desc: 'Primer plano del daño' },
    { title: 'Foto 5: Complementaria', desc: 'Ángulo adicional o código' },
  ];

  const VIDEO_SLOT_GUIDES = [
    { title: 'Video 1: Demostración Falla', desc: 'Muestra de ruido o fuga en vivo' },
    { title: 'Video 2: Inspección Funcional', desc: 'Prueba de encendido o aceleración' },
  ];

  // Repuestos en tags
  const [partsTags, setPartsTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Estados de interfaz y búsqueda
  const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

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
    setPartsTags(partsTags.filter((_, i) => i !== idx));
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
      const motorcycleBrand = foundClient?.motorcycleBrand || (foundAlist?.modeloMarca ? foundAlist.modeloMarca.split(' ')[0] : '');
      const motorcycleModel = foundClient?.motorcycleModel || foundAlist?.modeloMarca || '';
      const motorcyclePlate = (foundClient?.motorcyclePlate || foundAlist?.placa || '').toUpperCase();
      const motorcycleVin = foundClient?.motorcycleVin || foundAlist?.chasis || '';
      const motorNumber = (foundAlist?.numeroMotor || foundClient?.motorNumber || '').toUpperCase();
      const ramvNumber = (foundAlist?.ramv || foundClient?.ramvNumber || '').toUpperCase();
      const motorcycleMileage = foundClient?.motorcycleMileage !== undefined
        ? foundClient.motorcycleMileage
        : (foundAlist?.kilometraje !== undefined ? foundAlist.kilometraje : '');

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
        motorcycleMileage: motorcycleMileage !== undefined && motorcycleMileage !== '' ? motorcycleMileage : prev.motorcycleMileage,
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

  // Subir fotos o videos por slot
  const handleTriggerPhotoUpload = (index: number) => {
    activeSlotRef.current = { type: 'photo', index };
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
      photoInputRef.current.click();
    }
  };

  const handleTriggerVideoUpload = (index: number) => {
    activeSlotRef.current = { type: 'video', index };
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
      videoInputRef.current.click();
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const active = activeSlotRef.current;
    if (!file || !active || active.type !== 'photo') return;
    setUploadingSlot({ type: 'photo', index: active.index });
    try {
      const compressed = await compressImageBase64(file);
      if (compressed) {
        setPhotoSlots((prev) => {
          const next = [...prev];
          next[active.index] = compressed;
          return next;
        });

        // Subida asíncrona a Supabase Storage bucket warranty-media
        uploadWarrantyMedia(compressed, `foto_movil_${active.index + 1}`)
          .then((cloudUrl) => {
            if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
              setPhotoSlots((prev) => {
                const next = [...prev];
                next[active.index] = cloudUrl;
                return next;
              });
            }
          })
          .catch((err) => console.warn('Subida en background falló:', err));
      }
    } catch (err) {
      console.error('Error al comprimir foto:', err);
      alert('Error al comprimir la fotografía.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const active = activeSlotRef.current;
    if (!file || !active || active.type !== 'video') return;

    const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB max
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      alert('El video supera el límite de 25 MB. Por favor seleccione o grabe un clip técnico breve de 15 a 20 segundos.');
      e.target.value = '';
      return;
    }

    setUploadingSlot({ type: 'video', index: active.index });
    try {
      // Previsualización local inmediata
      const previewUrl = URL.createObjectURL(file);
      setVideoSlots((prev) => {
        const next = [...prev];
        next[active.index] = previewUrl;
        return next;
      });

      // Comprimir video en el dispositivo móvil si supera 1.5 MB
      let videoToUpload: File | Blob | string = file;
      if (file.size > 1.5 * 1024 * 1024) {
        try {
          const compressed = await compressVideoBase64(file, 640, 480, 20);
          if (compressed && compressed.length > 50) {
            videoToUpload = compressed;
          }
        } catch (compErr) {
          console.warn('Compresión móvil de video falló:', compErr);
        }
      }

      // Subida del video optimizado a Supabase Storage
      const cloudUrl = await uploadWarrantyMedia(videoToUpload, `video_movil_${active.index + 1}`);
      if (cloudUrl && (cloudUrl.startsWith('http://') || cloudUrl.startsWith('https://'))) {
        setVideoSlots((prev) => {
          const next = [...prev];
          next[active.index] = cloudUrl;
          return next;
        });
      } else {
        if (typeof videoToUpload === 'string') {
          setVideoSlots((prev) => {
            const next = [...prev];
            next[active.index] = videoToUpload as string;
            return next;
          });
        } else {
          const compressed = await compressVideoBase64(file, 640, 480, 20);
          if (compressed) {
            setVideoSlots((prev) => {
              const next = [...prev];
              next[active.index] = compressed;
              return next;
            });
          }
        }
      }
    } catch (err) {
      console.error('Error al procesar video móvil:', err);
      alert('Error al procesar y comprimir el video.');
    } finally {
      setUploadingSlot(null);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotoSlots((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  const handleRemoveVideo = (idx: number) => {
    setVideoSlots((prev) => {
      const next = [...prev];
      next[idx] = null;
      return next;
    });
  };

  // Validación y envío del formulario
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (uploadingSlot !== null) {
      alert('Por favor espere a que termine de cargarse el archivo seleccionado antes de emitir la solicitud.');
      return;
    }

    if (!formData.clientName.trim() || !formData.clientIdNumber.trim()) {
      setActiveTab('cliente');
      alert('Por favor ingrese la cédula y el nombre del cliente.');
      return;
    }

    if (destinationType === 'garante' && !formData.targetBrand.trim()) {
      setActiveTab('cliente');
      alert('Por favor seleccione la Marca Garantía registrada.');
      return;
    }

    if (!formData.motorcycleBrand.trim()) {
      setActiveTab('moto');
      alert('Por favor ingrese la marca de la motocicleta.');
      return;
    }

    if (!formData.issueDescription.trim()) {
      setActiveTab('reclamo');
      alert('Por favor detalle la falla reportada en el reclamo técnico.');
      return;
    }

    const loadedPhotos = photoSlots.filter(Boolean) as string[];
    const loadedVideos = videoSlots.filter(Boolean) as string[];

    const resolvedTarget =
      destinationType === 'matriz' ? 'StarMotos Matriz' : formData.targetBrand.trim();

    const newReq: WarrantyRequest = {
      id: `gar-${Date.now()}`,
      requestNumber: `GAR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: 'Hoy, Solicitud Emitida',
      createdTimestamp: Date.now(),
      clientName: formData.clientName.trim(),
      clientIdNumber: formData.clientIdNumber.trim(),
      clientPhone: formData.clientPhone.trim(),
      tallerOrigin: formData.tallerOrigin.trim() || defaultTallerOrigin,
      tallerOriginId: defaultTallerOriginId,
      warrantyType: 'marca',
      destinationType: destinationType,
      targetBrand: resolvedTarget,
      garanteName: resolvedTarget,
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
      resolutionType: undefined,
      diagnosticPhotos: [...loadedPhotos, ...loadedVideos],
      status: destinationType === 'matriz' ? 'enviada_matriz' : 'en_revision',
      estimatedCost: 0,
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
      {/* Selector para Foto */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {/* Selector para Video */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFileChange}
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

          {/* Tipo de Póliza: Solo Matriz (admin) puede seleccionar Plus o GPS; Taller fija Garantía Oficial de Marca */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Tipo de Póliza</label>
            {viewerRole === 'admin' ? (
              <select
                value={formData.warrantyType || 'marca'}
                onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value as any })}
                className="w-full px-3 py-2.5 bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-xs font-bold text-blue-900 outline-none"
              >
                <option value="marca">Garantía Oficial de Marca</option>
                <option value="plus_taller">Garantía Plus StarMotos</option>
                <option value="gps">Garantía Dispositivo GPS Satelital</option>
              </select>
            ) : (
              <div className="w-full px-3 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-blue-900">Garantía Oficial de Marca</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded uppercase">
                  Oficial
                </span>
              </div>
            )}
          </div>

          {/* Destino del Reclamo: Matriz vs Garante de Marca */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-zinc-700">
              Destino del Reclamo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setDestinationType('matriz');
                  setFormData((prev) => ({ ...prev, targetBrand: 'StarMotos Matriz' }));
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  destinationType === 'matriz'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 bg-transparent'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>A Matriz</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDestinationType('garante');
                  setFormData((prev) => ({ ...prev, targetBrand: registeredBrands[0] || '' }));
                }}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  destinationType === 'garante'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 bg-transparent'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Garantía de Marca</span>
              </button>
            </div>

            {destinationType === 'matriz' ? (
              <div className="w-full px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900">StarMotos Sede Matriz</span>
                <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[8px] font-bold rounded uppercase">
                  Central
                </span>
              </div>
            ) : (
              <select
                required
                value={formData.targetBrand}
                onChange={(e) => setFormData({ ...formData, targetBrand: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white cursor-pointer"
              >
                <option value="" disabled>Seleccione la Marca Registrada</option>
                {registeredBrands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            )}
            <p className="text-[10px] text-zinc-400">
              {destinationType === 'matriz'
                ? 'Se enviará a Matriz/Almacén (ideal para marcas no registradas en el sistema).'
                : 'Se enviará al buzón del garante oficial registrado.'}
            </p>
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Marca</label>
              <input
                type="text"
                list="mobile-brands-datalist"
                value={formData.motorcycleBrand}
                onChange={(e) => setFormData({ ...formData, motorcycleBrand: e.target.value })}
                placeholder="Marca de la moto"
                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 outline-none focus:border-blue-600 focus:bg-white"
              />
              <datalist id="mobile-brands-datalist">
                {ALL_POPULAR_BRANDS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Modelo</label>
              <input
                type="text"
                value={formData.motorcycleModel}
                onChange={(e) => setFormData({ ...formData, motorcycleModel: e.target.value })}
                placeholder="Modelo de la moto"
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
                  placeholder="Ej: 5000"
                  value={formData.motorcycleMileage}
                  onChange={(e) => setFormData({ ...formData, motorcycleMileage: e.target.value === '' ? '' : Number(e.target.value) })}
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
            <span>3. Reclamo & Diagnóstico</span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. BLOQUE 4: INSPECCIÓN VISUAL DEL DAÑO (FOTOGRAFÍAS Y VIDEOS)             */}
      {/* ========================================================================= */}
      {activeTab === 'fotos' && (
        <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
            <h4 className="text-xs sm:text-sm font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span>Evidencias Técnicas</span>
            </h4>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  photoSlots.filter(Boolean).length > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                {photoSlots.filter(Boolean).length}/5 Fotos
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  videoSlots.filter(Boolean).length > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-50 text-zinc-600 border-zinc-200'
                }`}
              >
                {videoSlots.filter(Boolean).length}/2 Videos
              </span>
            </div>
          </div>

          {/* Sección 1: Fotos de Peritaje */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-800 uppercase tracking-wide flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                1. Fotos de Peritaje (Hasta 5 - Opcionales)
              </span>
              <span className="text-[10px] text-zinc-400">WebP ultraligero</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {photoSlots.map((photo, idx) => {
                const guide = PHOTO_SLOT_GUIDES[idx];
                const isUploading = uploadingSlot?.type === 'photo' && uploadingSlot?.index === idx;

                return (
                  <div
                    key={`mob-photo-${idx}`}
                    className={`relative rounded-xl border-2 p-2 flex flex-col justify-between ${
                      photo
                        ? 'border-emerald-300 bg-zinc-900'
                        : 'border-dashed border-zinc-300 bg-zinc-50/70 hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-zinc-700 truncate">{guide.title}</span>
                      {photo ? (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded">
                          ✓ Lista
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                          Opcional
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => !isUploading && handleTriggerPhotoUpload(idx)}
                      className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-zinc-100"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center p-1 text-center">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-1" />
                          <span className="text-[9px] font-bold text-blue-600">Comprimiendo...</span>
                        </div>
                      ) : photo ? (
                        <>
                          <img src={photo} alt={guide.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomImage(photo);
                              }}
                              className="w-7 h-7 rounded bg-white/90 text-zinc-900 flex items-center justify-center"
                              title="Ampliar foto"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerPhotoUpload(idx);
                              }}
                              className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center"
                              title="Reemplazar foto"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              className="w-7 h-7 rounded bg-red-600 text-white flex items-center justify-center"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-zinc-400">
                          <Camera className="w-5 h-5 mb-0.5" />
                          <span className="text-[10px] font-bold text-zinc-700">+ Subir Foto</span>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-500 mt-1 truncate">{guide.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sección 2: Videos Demostrativos */}
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-600" />
                2. Videos Demostrativos (Hasta 2 - Opcionales)
              </span>
              <span className="text-[10px] text-zinc-400">WebM ligero (&lt; 35s)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {videoSlots.map((video, idx) => {
                const guide = VIDEO_SLOT_GUIDES[idx];
                const isUploading = uploadingSlot?.type === 'video' && uploadingSlot?.index === idx;

                return (
                  <div
                    key={`mob-video-${idx}`}
                    className={`relative rounded-xl border-2 p-2.5 flex flex-col justify-between ${
                      video
                        ? 'border-purple-400 bg-zinc-900'
                        : 'border-dashed border-purple-300 bg-purple-50/30 hover:border-purple-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-purple-950 truncate flex items-center gap-1">
                        <Film className="w-3 h-3 text-purple-600" /> {guide.title}
                      </span>
                      {video ? (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded">
                          ✓ Video Listo
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                          Opcional
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => !isUploading && handleTriggerVideoUpload(idx)}
                      className="relative w-full aspect-video rounded-lg overflow-hidden flex items-center justify-center cursor-pointer bg-zinc-950"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center p-2 text-center">
                          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-1" />
                          <span className="text-[10px] font-bold text-purple-300">Optimizando video...</span>
                        </div>
                      ) : video ? (
                        <>
                          <video src={video} className="w-full h-full object-cover opacity-80" preload="metadata" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center shadow-lg">
                              <Play className="w-4 h-4 fill-white ml-0.5 text-white" />
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setZoomImage(video);
                              }}
                              className="px-2.5 py-1 rounded bg-white text-zinc-900 text-[10px] font-bold flex items-center gap-1"
                              title="Reproducir video"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Ver</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTriggerVideoUpload(idx);
                              }}
                              className="p-1.5 rounded bg-purple-600 text-white"
                              title="Reemplazar video"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveVideo(idx);
                              }}
                              className="p-1.5 rounded bg-red-600 text-white"
                              title="Eliminar video"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-purple-400">
                          <Film className="w-6 h-6 mb-1 text-purple-500" />
                          <span className="text-xs font-bold text-purple-900">+ Subir Video #{idx + 1}</span>
                          <span className="text-[9px] text-zinc-500">{guide.desc}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
