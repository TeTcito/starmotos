// src/components/common/GpsModule.tsx
import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  CheckCircle2,
  Clock,
  User,
  Bike,
  Cpu,
  MapPin,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  Camera,
  X,
  Radio,
  Sparkles,
  Smartphone,
  Phone,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GpsRecord } from '../../types/customer';

// Helper de Estado GPS
export const getGpsStatusInfo = (estado: string) => {
  if (estado === 'activa' || estado === 'activo') {
    return {
      canonical: 'activa',
      label: 'Servicio Activo',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      barColor: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    };
  }
  return {
    canonical: 'pendiente',
    label: 'Pendiente Aprobación',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    barColor: 'bg-amber-500',
    icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  };
};

// =========================================================================
// 1. TARJETA CUADRADA GPS (ESTILO GARANTÍA)
// =========================================================================

interface GpsSquareCardProps {
  record: GpsRecord;
  onClick: () => void;
}

export const GpsSquareCard: React.FC<GpsSquareCardProps> = ({ record, onClick }) => {
  const statusInfo = getGpsStatusInfo(record.estado);
  const hasPhotos = record.fotos && record.fotos.length > 0;

  return (
    <div
      onClick={onClick}
      className="group bg-white border-2 border-zinc-200 hover:border-blue-500 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-[325px] select-none relative overflow-hidden active:scale-99"
    >
      {/* Barra superior de acento según estado */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${statusInfo.barColor}`} />

      {/* Cabecera de la Tarjeta */}
      <div>
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {record.ticketNumber}
            </span>
            <span className="text-[10px] uppercase font-bold text-zinc-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-600" />
              <span>{record.sede || 'Matriz'}</span>
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
          >
            {statusInfo.icon}
            <span>{statusInfo.label}</span>
          </div>
        </div>

        {/* Datos Principales (Cliente & Vehículo) */}
        <div className="mt-2.5 space-y-2">
          {/* Cliente */}
          <div className="flex items-start gap-2">
            <User className="w-3.5 h-3.5 text-zinc-400 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-black text-zinc-900 truncate block">
                {record.nombres} {record.apellidos}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                C.I: {record.cedulaRuc} • Tel: {record.celular1}
              </span>
            </div>
          </div>

          {/* Motocicleta */}
          <div className="flex items-start gap-2">
            <Bike className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
            <div className="truncate">
              <span className="text-xs font-bold text-blue-950 truncate block">
                {record.modeloMarca}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                Placa: <strong className="text-zinc-700">{record.placa || 'S/P'}</strong>
                {record.chasis && ` • VIN: ${record.chasis.slice(-6)}`}
              </span>
            </div>
          </div>

          {/* Resumen Hardware GPS & Vigencia */}
          <div className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-150 text-[11px] text-zinc-600 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-800 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-600" />
                <span>IMEI GPS:</span>
              </span>
              <span className="font-mono text-cyan-950 font-bold">{record.serieGps}</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">SIM:</span>
              <span className="font-mono text-zinc-700">{record.serieChip}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-200/60 pt-1">
              <span>Vigencia:</span>
              <span className="font-semibold text-zinc-700">{record.fechaInicio} al {record.fechaVencimiento}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de la Tarjeta */}
      <div className="mt-3 pt-3 border-t border-zinc-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 block">
            Estado Servicio
          </span>
          {record.estado === 'activa' ? (
            <span className="text-xs font-black font-mono text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Usuario Asignado</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Pendiente Aprobación
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {hasPhotos && (
            <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-0.5 bg-zinc-100 px-1.5 py-0.5 rounded mr-1">
              <Camera className="w-3 h-3 text-zinc-500" />
              <span>{record.fotos!.length}</span>
            </span>
          )}
          <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
            Ver Ficha
          </span>
          <div className="w-5 h-5 rounded-full bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center text-xs transition-colors">
            →
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. FICHA TÉCNICA DETALLADA GPS (ESTILO WARRANTY FORM VIEW)
// =========================================================================

interface GpsFormViewProps {
  record: GpsRecord;
  onBack: () => void;
  onAssignCredentials?: (recordId: string, user: string, pass: string) => void;
  onSendWhatsApp?: (record: GpsRecord) => void;
  showToast?: (text: string, type?: 'success' | 'info' | 'error') => void;
  isMobile?: boolean;
}

export const GpsFormView: React.FC<GpsFormViewProps> = ({
  record,
  onBack,
  onAssignCredentials,
  onSendWhatsApp,
  showToast,
  isMobile = false,
}) => {
  const statusInfo = getGpsStatusInfo(record.estado);

  // Estados locales para credenciales
  const [inputUser, setInputUser] = useState(
    record.gpsUser || `gps_${record.placa.toLowerCase().replace(/[^a-z0-9]/g, '') || record.cedulaRuc.slice(-6)}`
  );
  const [inputPass, setInputPass] = useState(
    record.gpsPassword || `Star${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast?.(`Copiado: ${text}`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGenerateRandomUser = () => {
    const cleanPlate = record.placa.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanCedula = record.cedulaRuc.slice(-4);
    setInputUser(`star_${cleanPlate || cleanCedula}`);
  };

  const handleGenerateRandomPassword = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    setInputPass(`Gps*${num}`);
  };

  const handleApprove = () => {
    if (!inputUser.trim() || !inputPass.trim()) {
      alert('Por favor ingrese el usuario y la contraseña para la app satelital.');
      return;
    }
    if (onAssignCredentials) {
      onAssignCredentials(record.id, inputUser.trim(), inputPass.trim());
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#0284c7', '#2563eb', '#10b981'],
      });
      showToast?.('✓ Solicitud GPS aprobada y credenciales asignadas.', 'success');
    }
  };

  // WhatsApp directo al cliente
  const handleWhatsAppClick = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp(record);
      return;
    }
    const rawPhone = (record.celular1 || record.celular2 || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('593')
      ? rawPhone
      : rawPhone.startsWith('0')
      ? `593${rawPhone.slice(1)}`
      : `593${rawPhone}`;
    const msg = encodeURIComponent(
      `Hola *${record.nombres}*, te contactamos de *StarMotos GPS Central* respecto a la instalación de tu dispositivo satelital en tu moto *${record.modeloMarca}* (Placa: *${record.placa}*).`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HEADER SUPERIOR CON BOTÓN VOLVER Y ACCIONES */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>

          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                Ficha GPS: <span className="font-mono text-blue-600">{record.ticketNumber}</span>
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
              >
                {statusInfo.icon}
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Sede: <strong className="text-zinc-800">{record.sede || 'Matriz Central'}</strong> • Solicitud:{' '}
              <strong className="text-zinc-800">{record.fechaSolicitud}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Imprimir / PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-zinc-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
            title="Generar PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>PDF</span>
          </button>

          {/* Botón WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Contactar al cliente vía WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contactar</span>
          </button>

          {/* Botón Acción Rápida si pendiente */}
          {record.estado === 'pendiente' && (
            <button
              type="button"
              onClick={handleApprove}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Aceptar & Dictaminar</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. LÍNEA DE TIEMPO DE TRAZABILIDAD (ESTILO GARANTE) */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
        <h4 className="text-xs font-black uppercase text-zinc-500 tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Trazabilidad del Flujo de Monitoreo GPS</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Paso 1: Matriz */}
          <div className="p-4 rounded-xl border bg-emerald-50/70 border-emerald-300 text-emerald-900 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              1
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">1. Registro en Matriz</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {record.sede || 'Matriz'} registró la compra del equipo y vinculó la motocicleta.
              </p>
            </div>
          </div>

          {/* Paso 2: Auditoría Técnica */}
          <div className="p-4 rounded-xl border bg-emerald-50/70 border-emerald-300 text-emerald-900 flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              2
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">2. Inspección Técnica Satelital</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                Verificación de IMEI ({record.serieGps}) y SIM ({record.serieChip}).
              </p>
            </div>
          </div>

          {/* Paso 3: Dictamen */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              record.estado === 'activa'
                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                : 'bg-amber-50/70 border-amber-300 text-amber-900 animate-pulse'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                record.estado === 'activa'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              3
            </div>
            <div className="text-xs sm:text-sm">
              <span className="font-bold block text-zinc-900">3. Dictamen & Aceptación Oficial</span>
              <p className="text-xs text-zinc-600 mt-0.5">
                {record.estado === 'activa'
                  ? '✓ Solicitud Aceptada con Credenciales Activas.'
                  : 'En espera de generación de credenciales por el Operador GPS.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 3 COLUMNAS: CLIENTE, MOTOCICLETA Y HARDWARE GPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ========================================================= */}
        {/* COLUMNA 1: DATOS DEL CLIENTE & SEDE                       */}
        {/* ========================================================= */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-200 transition-colors">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <span>1. Datos del Cliente & Sede</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Cédula o RUC</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 flex items-center">
                {record.cedulaRuc}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Nombre Completo</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 flex items-center">
                {record.nombres} {record.apellidos}
              </div>
            </div>

            {/* Teléfonos (3 celulares) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-zinc-700">Celular Principal</label>
                <a
                  href={`https://api.whatsapp.com/send?phone=593${record.celular1.replace(/\D/g, '').replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-900 flex items-center justify-between">
                <span>📱 {record.celular1}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Principal</span>
              </div>
            </div>

            {record.celular2 && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Celular Secundario</label>
                <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 flex items-center">
                  📞 {record.celular2}
                </div>
              </div>
            )}

            {record.celular3 && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Celular Adicional</label>
                <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 flex items-center">
                  📞 {record.celular3}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Sede de Emisión</label>
              <div className="h-11 px-4 bg-cyan-50 border border-cyan-200 rounded-xl text-xs sm:text-sm font-bold text-cyan-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-600" />
                <span>{record.sede || 'Sede Matriz'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 2: DATOS DE LA MOTOCICLETA                        */}
        {/* ========================================================= */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-200 transition-colors">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <span>2. Motocicleta Asociada</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Modelo y Marca</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 flex items-center">
                {record.modeloMarca}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Placa Oficial</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono font-bold text-zinc-900 flex items-center justify-between">
                <span>{record.placa || 'SIN PLACA'}</span>
                <span className="text-[10px] font-bold bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded">ECU</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de Chasis (VIN)</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 flex items-center justify-between">
                <span className="truncate">{record.chasis}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(record.chasis, 'chasis')}
                  className="p-1 hover:bg-zinc-200 rounded text-zinc-500 cursor-pointer"
                  title="Copiar VIN"
                >
                  {copiedField === 'chasis' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Número de Motor</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-mono text-zinc-800 flex items-center">
                {record.numeroMotor || 'No registrado'}
              </div>
            </div>

            {record.color && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Color de la Unidad</label>
                <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 flex items-center">
                  {record.color}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMNA 3: HARDWARE GPS, SIMCARD & VIGENCIA              */}
        {/* ========================================================= */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-zinc-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-cyan-200 transition-colors">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-zinc-900">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <span>3. Hardware Satelital & Vigencia</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Serie del GPS (IMEI)</label>
              <div className="h-11 px-4 bg-cyan-50 border border-cyan-200 rounded-xl text-sm font-mono font-bold text-cyan-950 flex items-center justify-between">
                <span>{record.serieGps}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(record.serieGps, 'imei')}
                  className="p-1 hover:bg-cyan-100 rounded text-cyan-700 cursor-pointer"
                  title="Copiar IMEI"
                >
                  {copiedField === 'imei' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Serie de Chip (SIM / Operadora)</label>
              <div className="h-11 px-4 bg-cyan-50 border border-cyan-200 rounded-xl text-sm font-mono font-bold text-zinc-900 flex items-center justify-between">
                <span>{record.serieChip}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(record.serieChip, 'chip')}
                  className="p-1 hover:bg-cyan-100 rounded text-zinc-700 cursor-pointer"
                  title="Copiar SIM"
                >
                  {copiedField === 'chip' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Fecha Inicio</label>
                <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold text-zinc-800 flex items-center">
                  {record.fechaInicio}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 mb-1">Fecha Vencimiento</label>
                <div className="h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-semibold text-zinc-800 flex items-center">
                  {record.fechaVencimiento}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Técnico Instalador Encargado</label>
              <div className="h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm font-bold text-zinc-800 flex items-center">
                {record.tecnicoResponsable || 'Técnico Matriz Central'}
              </div>
            </div>

            {record.observaciones && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Notas de Instalación</label>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-700 leading-relaxed">
                  {record.observaciones}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. EVIDENCIAS FOTOGRÁFICAS DE LA INSTALACIÓN */}
      {record.fotos && record.fotos.length > 0 && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <h3 className="text-sm sm:text-base font-black text-zinc-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Evidencias Fotográficas de la Instalación ({record.fotos.length})</span>
            </h3>
            <span className="text-xs text-zinc-500 font-medium">
              Haga clic sobre cualquier foto para visualizarla en alta resolución
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {record.fotos.map((foto, idx) => (
              <div
                key={idx}
                onClick={() => setPreviewImage(foto)}
                className="group relative rounded-xl overflow-hidden border border-zinc-200 aspect-square cursor-pointer shadow-2xs hover:shadow-md hover:border-blue-400 transition"
              >
                <img
                  src={foto}
                  alt={`Evidencia ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-zinc-900 text-[10px] font-bold px-2 py-1 rounded shadow-xs transition">
                    Ver Zoom
                  </span>
                </div>
                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Foto #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. DICTAMEN & ACEPTACIÓN OFICIAL GPS (ESTILO FORMULARIO DE GARANTE) */}
      <div className="bg-white border-2 border-blue-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900">
                Dictamen Técnico Oficial & Asignación de Credenciales Satelitales
              </h3>
              <p className="text-xs text-zinc-500">
                Control exclusivo del Operador GPS para emitir accesos al cliente y habilitar el rastreo en la app.
              </p>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeBg} ${statusInfo.badgeText} ${statusInfo.badgeBorder}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {record.estado === 'pendiente' ? (
          /* MODO EMISIÓN: PENDIENTE DE RESOLUCIÓN */
          <div className="space-y-5">
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Solicitud en espera de resolución oficial</strong>
                Revise que los datos de IMEI y SIM correspondan a la unidad física antes de generar las credenciales. Al aceptar, el estado cambiará a <strong>Activo</strong> y se notificará a Matriz.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Usuario GPS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800">
                    Usuario para App Satelital <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomUser}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sugerir Usuario</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={inputUser}
                  onChange={(e) => setInputUser(e.target.value)}
                  placeholder="ej. star_pde0459"
                  className="w-full h-11 px-4 bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none shadow-2xs"
                />
              </div>

              {/* Contraseña GPS */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800">
                    Contraseña para App Satelital <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Contraseña</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPass}
                    onChange={(e) => setInputPass(e.target.value)}
                    placeholder="Contraseña segura"
                    className="w-full h-11 pl-4 pr-10 bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-sm font-mono font-bold text-zinc-900 outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Observaciones del dictamen */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-800">
                Observaciones Técnicas del Operador (Opcional)
              </label>
              <textarea
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                placeholder="Indique notas de configuración, plataforma satelital o pruebas de encendido/corte de corriente..."
                rows={2}
                className="w-full p-3 bg-white border border-zinc-300 focus:border-blue-600 rounded-xl text-xs text-zinc-800 outline-none"
              />
            </div>

            {/* Botón Principal de Dictamen / Aceptación */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleApprove}
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Aceptar Solicitud & Asignar Credenciales Satelitales</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODO AUDITORÍA: YA ACTIVA / RESUELTA */
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Servicio Aceptado y Activado Oficialmente
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Aprobado el {record.fechaAprobacion || 'Fecha registrada'} por{' '}
                    <strong>{record.aprobadoPor || 'Operador GPS Central'}</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Reenviar WhatsApp</span>
              </button>
            </div>

            {/* Tarjetas de Credenciales Activas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Usuario Asignado</span>
                  <span className="text-sm font-mono font-black text-blue-900">{record.gpsUser || 'No registrado'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(record.gpsUser || '', 'user')}
                  className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedField === 'user' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                  <span>Copiar</span>
                </button>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Contraseña Asignada</span>
                  <span className="text-sm font-mono font-black text-zinc-900">
                    {showPassword ? record.gpsPassword || 'No registrada' : '••••••••••••'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-600 cursor-pointer"
                    title={showPassword ? 'Ocultar' : 'Ver'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(record.gpsPassword || '', 'pass')}
                    className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedField === 'pass' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                    <span>Copiar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL LIGHTBOX DE FOTO A PANTALLA COMPLETA */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition cursor-pointer z-10"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Evidencia en alta resolución"
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
