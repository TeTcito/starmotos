// src/components/desktop/GarantiaPlusCustomerCard.tsx
import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  Bike,
  Wrench,
  CheckCircle2,
  FileText,
  DollarSign,
  MapPin,
  User,
  ArrowRight,
  Phone,
  AlertCircle,
  CreditCard,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import {
  GarantiaPlusRecord,
  ClientProfile,
  MotorcycleClientData,
  MaintenanceRecord,
} from '../../types/customer';
import { WhatsAppIcon } from '../WhatsAppIcon';
import { AbonoTransferenciaModal } from '../common/AbonoTransferenciaModal';

interface Props {
  garantiaPlus: {
    hasGarantiaPlus: boolean;
    record?: GarantiaPlusRecord;
    daysRemaining: number;
    isExpired: boolean;
  };
  onScheduleMaintenance?: () => void;
  onSubmitAbono?: (data: {
    alistamientoId?: string;
    monto: number;
    comprobanteUrl: string;
    bancoOrigen?: string;
    numeroComprobante?: string;
    notas?: string;
  }) => Promise<boolean>;
  profile?: ClientProfile;
  motorcycle?: MotorcycleClientData;
}

export const GarantiaPlusCustomerCard: React.FC<Props> = ({
  garantiaPlus,
  onScheduleMaintenance,
  onSubmitAbono,
  profile,
  motorcycle,
}) => {
  const { record, daysRemaining, isExpired } = garantiaPlus;
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);

  if (!record) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 shadow-sm max-w-lg mx-auto">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">Membresía Garantía Plus</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
          Aún no tienes una membresía de Garantía Plus activa para tu motocicleta.
        </p>
      </div>
    );
  }

  // Cálculos contables precisos
  const valorTotal = Number(record.valorServicio || 0);
  const abonado = record.abono !== undefined && record.abono !== null
    ? Number(record.abono)
    : Number(record.montoPagado || 0);
  const saldoPendiente = record.saldoPendiente !== undefined && record.saldoPendiente !== null
    ? Number(record.saldoPendiente)
    : Math.max(0, valorTotal - abonado);
  const isPaidInFull = saldoPendiente <= 0.01;
  const isPartialPayment = abonado > 0 && !isPaidInFull;
  const paymentProgressPercent = valorTotal > 0
    ? Math.min(100, Math.max(0, Math.round((abonado / valorTotal) * 100)))
    : 100;

  const startDateFormatted = record.fechaServicio
    ? new Date(record.fechaServicio + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'No registrada';

  const endDateFormatted = record.fechaVencimiento
    ? new Date(record.fechaVencimiento + 'T00:00:00').toLocaleDateString('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'Indefinida';

  // Porcentaje estimado de vigencia (asumiendo 365 días base)
  const totalDays = 365;
  const elapsedDays = Math.max(0, totalDays - Math.max(0, daysRemaining));
  const progressPercent = Math.min(100, Math.max(5, Math.round((elapsedDays / totalDays) * 100)));

  // Objeto sintético de mantenimiento para el modal de abonos por transferencia
  const gpMaintenanceRecord: MaintenanceRecord = {
    id: record.id,
    otNumber: record.numeroTicket || 'GP-OFICIAL',
    invoiceNumber: record.numeroFactura || `FAC-${record.id.slice(-6).toUpperCase()}`,
    date: record.fechaServicio || new Date().toISOString().split('T')[0],
    mileage: Number(record.kilometraje) || 0,
    branchName: record.sede || 'StarMotos Matriz Central',
    workSummary: [
      'Membresía Oficial Garantía Plus StarMotos',
      ...(record.observaciones ? [record.observaciones] : ['Mantenimientos y mano de obra 100% cubiertos']),
    ],
    partsReplaced: ['Póliza Garantía Plus Oficial'],
    totalPaid: abonado,
    technicianName: record.tecnicoResponsable || 'Técnico Especialista StarMotos',
    totalCost: valorTotal,
    saldoPendiente: saldoPendiente,
    abono: abonado,
    alistamientoId: record.id,
    solicitudAbonoPendiente: record.solicitudAbonoPendiente,
    fotos: record.fotos || [],
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-fade-in pb-12 font-sans">
      {/* 1. HERO BANNER VIP */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl border border-amber-400/40">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/30 text-amber-200 text-xs font-black uppercase tracking-wider">
              <span>👑 Membresía VIP Oficial</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              <span>Red Nacional StarMotos</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
              Garantía Plus StarMotos
            </h2>
            <p className="text-xs sm:text-sm text-amber-50 leading-relaxed font-medium">
              Tu motocicleta cuenta con cobertura prioritaria VIP en cualquiera de nuestras sedes a nivel nacional. Mantenimientos preventivos, lubricación y mano de obra especializada 100% garantizados.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-white/90">
              <span className="font-mono bg-black/20 px-2.5 py-1 rounded-lg border border-white/20">
                Ticket: <strong>{record.numeroTicket || 'GP-OFICIAL'}</strong>
              </span>
              <span className="bg-black/20 px-2.5 py-1 rounded-lg border border-white/20">
                Emisión: <strong>{record.sede || 'StarMotos Matriz Central'}</strong>
              </span>
            </div>
          </div>

          <div className="w-full sm:w-auto sm:shrink-0 flex flex-col items-center sm:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 sm:min-w-[210px]">
            <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">
              Estado de Cobertura
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xl font-black uppercase tracking-tight">
                {isExpired ? 'Vencida' : 'Activa & Vigente'}
              </span>
            </div>
            {!isExpired ? (
              <div className="flex flex-col items-center sm:items-end gap-1.5 mt-0.5">
                <span className="text-xs font-semibold text-emerald-100 bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  Quedan ~{daysRemaining} días
                </span>
                {!isPaidInFull && (
                  <span className="text-[11px] font-bold text-amber-200 bg-amber-950/60 border border-amber-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Clock className="w-3 h-3 text-amber-300" />
                    <span>Saldo pend.: ${saldoPendiente.toFixed(2)}</span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-red-200 bg-red-950/40 px-2.5 py-0.5 rounded-full">
                Expiró
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. ALERTA DESTACADA DE SALDO PENDIENTE (SI EL CLIENTE DEJÓ SOLO UN ABONO) */}
      {!isPaidInFull && (
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50/70 to-amber-50 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-black text-amber-950">
                  {isPartialPayment ? 'Abono Parcial Registrado' : 'Pago de Membresía Pendiente'}
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-300">
                  Saldo por Liquidar: ${saldoPendiente.toFixed(2)} USD
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Tu Garantía Plus se encuentra <strong>activa</strong> con un abono registrado de{' '}
                <strong className="text-amber-950 font-bold">${abonado.toFixed(2)} USD</strong> de un total de{' '}
                <strong>${valorTotal.toFixed(2)} USD</strong>.{' '}
                {record.esCredito
                  ? `Membresía financiada a crédito (${record.mesesCredito || 3} meses).`
                  : 'Cuentas con cobertura técnica activa mientras completas la liquidación de tu saldo restante.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            {onSubmitAbono && profile && motorcycle && (
              <button
                type="button"
                onClick={() => setIsAbonoModalOpen(true)}
                className="w-full md:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Abonar por Transferencia</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. BARRA DE VIGENCIA TEMPORAL */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Vigencia del Servicio</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-600">
            <span>Inicio: <strong>{startDateFormatted}</strong></span>
            <span>•</span>
            <span>Vence: <strong>{endDateFormatted}</strong></span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
          <div
            className={`h-full transition-all duration-1000 ${
              isExpired
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500'
            }`}
            style={{ width: isExpired ? '100%' : `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
          <span>Fecha de activación</span>
          <span>{isExpired ? 'Periodo culminado' : `${daysRemaining} días restantes de cobertura`}</span>
          <span>Fecha de expiración</span>
        </div>
      </div>

      {/* 4. DOS COLUMNAS: FICHA TÉCNICA Y BENEFICIOS VIP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Izquierda: Ficha Técnica de Registro */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Bike className="w-4 h-4 text-blue-600" />
            <span>Ficha del Vehículo Vinculado</span>
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Motocicleta</span>
              <span className="text-zinc-900 font-bold mt-0.5 block">{record.modeloMarca || 'N/A'}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Placa</span>
              <span className="text-zinc-900 font-mono font-black mt-0.5 block">{record.placa || 'S/P'}</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Número de Chasis (VIN)</span>
              <span className="text-zinc-900 font-mono font-semibold mt-0.5 block truncate" title={record.chasis}>
                {record.chasis || 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Número de Motor</span>
              <span className="text-zinc-900 font-mono font-semibold mt-0.5 block truncate" title={record.numeroMotor}>
                {record.numeroMotor || 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Color & Año</span>
              <span className="text-zinc-900 font-semibold mt-0.5 block">
                {record.color || 'Estándar'} {record.year ? `(${record.year})` : ''}
              </span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-[10px] text-zinc-400 font-bold uppercase block">Km al Ingreso</span>
              <span className="text-zinc-900 font-mono font-bold mt-0.5 block">
                {record.kilometraje?.toLocaleString() || 0} km
              </span>
            </div>
          </div>

          {/* Técnico y Sede */}
          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
            <div className="flex items-center justify-between text-blue-900 font-bold">
              <span>Atendido por:</span>
              <span>{record.atendidoPor || 'Matriz Central'}</span>
            </div>
            <div className="flex items-center justify-between text-blue-700">
              <span>Técnico Responsable:</span>
              <span className="font-medium">{record.tecnicoResponsable || 'Técnico Especialista'}</span>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Beneficios Exclusivos VIP */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Beneficios Exclusivos Cubiertos</span>
          </h3>

          <div className="space-y-2.5 text-xs text-zinc-700">
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold">Mantenimientos Preventivos 100% Cubiertos:</strong>
                <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                  Cambios de aceite, calibración de válvulas, sincronización de motor y lubricación de transmisión sin costo adicional.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-950 font-bold">Turno Preferencial VIP:</strong>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  Recepción prioritaria en taller sin esperas prolongadas en todas las sedes StarMotos del país.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
              <Wrench className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-blue-950 font-bold">Mano de Obra Certificada:</strong>
                <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                  Inspección técnica general por mecánicos máster certificados con repuestos originales OEM.
                </p>
              </div>
            </div>
          </div>

          {/* Observaciones técnicas */}
          {record.observaciones && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Observaciones del Contrato
              </span>
              <p className="text-zinc-700 italic leading-relaxed">
                "{record.observaciones}"
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. ESTADO DE CUENTA Y FICHA FINANCIERA COMPLETA */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Header con título y badge de estado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-100 gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isPaidInFull ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-zinc-900 tracking-tight">
                Estado Financiero de la Membresía
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Desglose de inversión total, abonos acreditados y saldo pendiente
              </p>
            </div>
          </div>

          <div>
            {isPaidInFull ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cancelado al 100% • Al día</span>
              </span>
            ) : isPartialPayment ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Abono Parcial ({paymentProgressPercent}% Cubierto)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Saldo Pendiente por Liquidar</span>
              </span>
            )}
          </div>
        </div>

        {/* 3 Tarjetas de Métricas Contables: Total, Abonado, Pendiente */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Tarjeta 1: Total Contratado */}
          <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
              Inversión Total Membresía
            </span>
            <div className="text-2xl font-black font-mono text-zinc-900 tracking-tight">
              ${valorTotal.toFixed(2)}
            </div>
            <span className="text-[11px] text-zinc-500 block">
              Costo total contratado
            </span>
          </div>

          {/* Tarjeta 2: Total Abonado */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Abonado / Pagado
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono text-emerald-700 tracking-tight">
              ${abonado.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-700/90 font-medium block">
              {paymentProgressPercent}% acreditado ({record.metodoPago || 'Efectivo'})
            </span>
          </div>

          {/* Tarjeta 3: Saldo Pendiente */}
          <div
            className={`p-4 rounded-2xl border space-y-1 transition-all ${
              isPaidInFull
                ? 'bg-zinc-50 border-zinc-200/80 text-zinc-400'
                : 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isPaidInFull ? 'text-zinc-500' : 'text-amber-800'
                }`}
              >
                Saldo Pendiente
              </span>
              {!isPaidInFull && <AlertCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
            </div>
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                isPaidInFull ? 'text-zinc-500' : 'text-amber-900'
              }`}
            >
              ${saldoPendiente.toFixed(2)}
            </div>
            <span
              className={`text-[11px] font-medium block ${
                isPaidInFull ? 'text-emerald-600 font-bold' : 'text-amber-700'
              }`}
            >
              {isPaidInFull ? '¡Póliza completamente al día!' : 'Valor por liquidar'}
            </span>
          </div>
        </div>

        {/* Barra de progreso de pago */}
        <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700">Progreso de Pago de la Membresía</span>
            <span className="font-mono font-bold text-zinc-800">{paymentProgressPercent}% pagado</span>
          </div>
          <div className="w-full h-3.5 bg-zinc-200 rounded-full overflow-hidden flex shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-700"
              style={{ width: `${paymentProgressPercent}%` }}
              title={`Abonado: $${abonado.toFixed(2)}`}
            />
            {!isPaidInFull && (
              <div
                className="h-full bg-amber-400 transition-all duration-700"
                style={{ width: `${100 - paymentProgressPercent}%` }}
                title={`Pendiente: $${saldoPendiente.toFixed(2)}`}
              />
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Abonado: <strong className="text-zinc-800">${abonado.toFixed(2)}</strong>
            </span>
            {!isPaidInFull && (
              <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Saldo Restante: <strong className="text-amber-950">${saldoPendiente.toFixed(2)}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Notificación si hay solicitud de abono en revisión */}
        {record.solicitudAbonoPendiente?.estado === 'pendiente' && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3 animate-fade-in">
            <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="text-blue-900 block font-bold">
                Comprobante de abono enviado en proceso de validación
              </strong>
              <p className="text-blue-800 leading-relaxed font-medium">
                Has enviado un comprobante de abono por{' '}
                <strong>${Number(record.solicitudAbonoPendiente.monto).toFixed(2)} USD</strong> (
                {record.solicitudAbonoPendiente.bancoOrigen || 'Transferencia Bancaria'}). Nuestro equipo administrativo
                está validando la transacción. Tu saldo se actualizará automáticamente una vez aprobado.
              </p>
            </div>
          </div>
        )}

        {/* Fila inferior: Datos fiscales y Botones de acción */}
        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-zinc-100">
          <div className="space-y-1 text-xs text-zinc-600 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Factura SRI:</span>
              <strong className="text-zinc-800">{record.numeroFactura || 'Por emitir'}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Modalidad:</span>
              <span className="text-zinc-700 font-semibold">
                {record.esCredito
                  ? `Crédito Directo (${record.mesesCredito || 3} Meses)`
                  : `Contado / Abonos (${record.metodoPago || 'Efectivo'})`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            {!isPaidInFull && onSubmitAbono && profile && motorcycle && (
              <button
                type="button"
                onClick={() => setIsAbonoModalOpen(true)}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Abonar por Transferencia</span>
              </button>
            )}

            {onScheduleMaintenance && (
              <button
                type="button"
                onClick={onScheduleMaintenance}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Agendar Mantenimiento</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <a
              href={`https://wa.me/593939316698?text=${encodeURIComponent(
                `Hola StarMotos, soy ${record.nombres} ${record.apellidos}. Tengo activa mi Garantía Plus (${
                  record.placa || record.modeloMarca
                }, Ticket: ${record.numeroTicket || 'GP-OFICIAL'}). He abonado $${abonado.toFixed(
                  2
                )} y tengo un saldo pendiente de $${saldoPendiente.toFixed(2)}. Quisiera coordinar un pago/mantenimiento.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-white" />
              <span>Atención Asesor</span>
            </a>
          </div>
        </div>
      </div>

      {/* Modal para reportar abono por transferencia */}
      {onSubmitAbono && profile && motorcycle && (
        <AbonoTransferenciaModal
          isOpen={isAbonoModalOpen}
          onClose={() => setIsAbonoModalOpen(false)}
          history={[gpMaintenanceRecord]}
          profile={profile}
          motorcycle={motorcycle}
          onSubmitAbono={onSubmitAbono}
        />
      )}
    </div>
  );
};
