// src/components/common/PrintableAlistamientoSheet.tsx
import React from 'react';
import {
  Bike,
  User,
  Wrench,
  Calendar,
  CheckCircle2,
  DollarSign,
  Camera,
  MapPin,
} from 'lucide-react';
import { AlistamientoFullRecord } from '../../types/customer';

interface Props {
  record: AlistamientoFullRecord;
}

const SERVICE_LABELS: Record<string, string> = {
  pdi: 'Alistamiento Pre-Entrega (PDI)',
  mantenimiento: 'Mantenimiento Preventivo',
  engrasado: 'Engrasado General y Ejes',
  ajuste_pernos: 'Ajuste y Torque de Pernos',
  cambio_aceite: 'Cambio de Aceite de Motor',
  calibracion_valvulas: 'Calibración de Válvulas',
  limpieza_carburador: 'Limpieza y Calibración de Carburador',
  revision_frenos: 'Revisión y Purga de Frenos',
  sistema_electrico: 'Auditoría Sistema Eléctrico',
  lavado: 'Lavado Técnico de Entrega',
};

export const PrintableAlistamientoSheet: React.FC<Props> = ({ record }) => {
  const serviceActions = record.serviciosRealizados || [];
  const photos = (record.fotos || []).filter((f) => Boolean(f) && typeof f === 'string');

  const clientFullName = `${record.nombres || ''} ${record.apellidos || ''}`.trim() || 'Cliente No Registrado';
  const totalVal = Number(record.valorServicio || 0);
  const paidVal = Number(record.montoPagado || 0);
  const balanceVal = Number(record.saldoPendiente || 0);

  return (
    <div className="printable-alistamiento-sheet bg-white text-zinc-950 text-[11px] leading-tight font-sans max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO INSTITUCIONAL OFICIAL                                       */}
      {/* ========================================================================= */}
      <div className="border-b-2 border-zinc-900 pb-3 flex items-start justify-between gap-6">
        {/* Logo Oficial de StarMotos y Membrete */}
        <div className="space-y-2">
          <img
            src="/logoheader.webp"
            alt="Logo StarMotos"
            className="h-10 sm:h-11 w-auto object-contain"
          />
          <div className="space-y-0.5">
            <h1 className="text-xs sm:text-sm font-black uppercase tracking-tight text-zinc-950">
              Recibo Oficial • Alistamiento & Servicio Técnico
            </h1>
            <p className="text-[10px] text-zinc-600 font-medium">
              Red Nacional de Talleres Autorizados & Sede Central StarMotos
            </p>
          </div>
        </div>

        {/* Folio / Ticket y Fecha de Emisión */}
        <div className="text-right shrink-0 whitespace-nowrap space-y-1">
          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 whitespace-nowrap">
              Ticket / N° Orden:
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-zinc-950 whitespace-nowrap">
              {record.numeroTicket || record.id}
            </span>
          </div>
          {record.numeroFactura && (
            <div className="text-[10.5px] font-mono text-zinc-700">
              Factura / Comprobante: <strong className="text-zinc-950">{record.numeroFactura}</strong>
            </div>
          )}
          <div className="flex items-center justify-end gap-1.5 text-[10.5px] text-zinc-600 font-medium whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="whitespace-nowrap">
              Fecha: {record.fechaServicio || record.createdAt}
              {record.horaServicio ? ` • ${record.horaServicio}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE 1 Y 2: DATOS DEL CLIENTE Y VEHÍCULO                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-8 break-inside-avoid">
        {/* 1. Datos del Cliente & Sede */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
            <User className="w-3.5 h-3.5 text-zinc-900" />
            <span>1. Datos del Cliente & Sede</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold w-36">Cédula o RUC:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">{record.cedulaRuc}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Cliente:</td>
                <td className="py-1 font-bold text-zinc-950">{clientFullName}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Teléfono(s):</td>
                <td className="py-1 font-bold text-zinc-950">
                  {record.celular1 || 'No registrado'}
                  {record.celular2 ? ` / ${record.celular2}` : ''}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Email:</td>
                <td className="py-1 text-zinc-800 font-medium">{record.email || 'No registrado'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Dirección:</td>
                <td className="py-1 text-zinc-800">{record.direccion || 'No registrada'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Origen / Almacén:</td>
                <td className="py-1 font-bold text-zinc-900">{record.origen || 'StarMotos'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Sede de Atención:</td>
                <td className="py-1 font-bold text-blue-900">{record.sede}</td>
              </tr>
              <tr>
                <td className="py-1 text-zinc-500 font-semibold">Atendido Por:</td>
                <td className="py-1 font-medium text-zinc-800">{record.atendidoPor || 'StarMotos'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Datos de la Motocicleta */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
            <Bike className="w-3.5 h-3.5 text-zinc-900" />
            <span>2. Datos del Vehículo</span>
          </div>
          <table className="w-full text-[10.5px]">
            <tbody>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold w-36">Marca y Modelo:</td>
                <td className="py-1 font-bold text-zinc-950">{record.modeloMarca}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Chasis / VIN:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">{record.chasis}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Número de Motor:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">{record.numeroMotor || 'S/N'}</td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Placa / RAMV:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">
                  {record.placa || 'SIN PLACA'} {record.ramv ? `• ${record.ramv}` : ''}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Color / Año:</td>
                <td className="py-1 text-zinc-800 font-medium">
                  {record.color || 'No especificado'} {record.year ? `• ${record.year}` : ''}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Kilometraje Entrada:</td>
                <td className="py-1 font-mono font-bold text-zinc-950">
                  {record.kilometraje !== undefined ? `${record.kilometraje.toLocaleString()} km` : '0 km'}
                </td>
              </tr>
              <tr className="border-b border-zinc-200">
                <td className="py-1 text-zinc-500 font-semibold">Próximo Servicio:</td>
                <td className="py-1 font-mono font-bold text-emerald-800">
                  {record.proximoMantenimientoKm ? `${record.proximoMantenimientoKm.toLocaleString()} km` : 'Según manual'}
                </td>
              </tr>
              <tr>
                <td className="py-1 text-zinc-500 font-semibold">Técnico Responsable:</td>
                <td className="py-1 font-bold text-zinc-900">{record.tecnicoResponsable || 'Técnico Oficial'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SERVICIOS REALIZADOS Y CHEQUEO DE FLUIDOS                              */}
      {/* ========================================================================= */}
      <div className="space-y-3 break-inside-avoid">
        <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
          <Wrench className="w-3.5 h-3.5 text-zinc-900" />
          <span>3. Servicios Realizados & Control de Fluidos</span>
        </div>

        {/* Acciones ejecutadas */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-zinc-500">Operaciones de Taller Ejecutadas:</span>
          {serviceActions.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {serviceActions.map((srv, idx) => {
                const label = SERVICE_LABELS[srv] || srv;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-zinc-500 italic">Alistamiento y verificación técnica general del vehículo.</p>
          )}
        </div>

        {/* Control de aceite & observaciones */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Control de Lubricación:</span>
            <div className="text-xs font-bold text-zinc-900">
              Estado: {record.aceite === 'sin_aceite' ? 'Sin Aceite' : 'Con Aceite'}
            </div>
            {record.tipoAceite && (
              <div className="text-[10.5px] text-zinc-700">
                Tipo: <strong className="text-zinc-900">{record.tipoAceite}</strong>
              </div>
            )}
            {record.nivelAceite && (
              <div className="text-[10.5px] text-zinc-700">
                Nivel: <strong className="text-zinc-900">{record.nivelAceite}</strong>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Observaciones Técnicas:</span>
            <p className="text-[10.5px] text-zinc-800 leading-relaxed font-medium">
              {record.observaciones || 'Vehículo revisado y entregado bajo estándares de calidad y seguridad StarMotos.'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIQUIDACIÓN ECONÓMICA Y DESGLOSE DE PAGO                               */}
      {/* ========================================================================= */}
      <div className="space-y-3 break-inside-avoid">
        <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
          <DollarSign className="w-3.5 h-3.5 text-zinc-900" />
          <span>4. Liquidación Económica & Desglose de Pago</span>
        </div>

        <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Valor Servicio</span>
            <span className="text-sm sm:text-base font-black font-mono text-zinc-950">
              ${totalVal.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Monto Pagado</span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-800">
              ${paidVal.toFixed(2)}
            </span>
          </div>

          <div className={`p-2.5 rounded-xl border ${balanceVal > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-zinc-50 border-zinc-200'}`}>
            <span className={`text-[10px] uppercase font-bold block ${balanceVal > 0 ? 'text-amber-700' : 'text-zinc-500'}`}>
              Saldo Pendiente
            </span>
            <span className={`text-sm sm:text-base font-black font-mono ${balanceVal > 0 ? 'text-amber-800' : 'text-zinc-950'}`}>
              ${balanceVal.toFixed(2)}
            </span>
          </div>

          <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Método de Pago</span>
            <span className="text-xs font-black text-blue-950">
              {record.metodoPago || 'Efectivo'}
              {record.esCredito && record.mesesCredito ? ` (${record.mesesCredito}m)` : ''}
            </span>
          </div>
        </div>

        {/* Historial de Abonos si existen */}
        {record.historialAbonos && record.historialAbonos.length > 0 && (
          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Registro de Abonos Realizados:</span>
            <table className="w-full text-[10px] border border-zinc-200 rounded-lg overflow-hidden">
              <thead className="bg-zinc-100 font-bold text-zinc-700">
                <tr>
                  <th className="p-1.5 text-left">Fecha</th>
                  <th className="p-1.5 text-left">Método</th>
                  <th className="p-1.5 text-right">Monto</th>
                  <th className="p-1.5 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {record.historialAbonos.map((abono, idx) => (
                  <tr key={abono.id || idx}>
                    <td className="p-1.5 font-mono">{abono.fecha} {abono.hora || ''}</td>
                    <td className="p-1.5 font-medium">{abono.metodoPago}</td>
                    <td className="p-1.5 text-right font-mono font-bold text-emerald-700">
                      ${Number(abono.monto).toFixed(2)}
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold text-zinc-900">
                      ${Number(abono.saldoRestante).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. REGISTRO FOTOGRÁFICO DE INSPECCIÓN                                    */}
      {/* ========================================================================= */}
      {photos.length > 0 && (
        <div className="space-y-2 break-inside-avoid">
          <div className="flex items-center gap-1.5 pb-1 border-b-2 border-zinc-900 font-black text-xs uppercase tracking-wide text-zinc-950">
            <Camera className="w-3.5 h-3.5 text-zinc-900" />
            <span>5. Registro Fotográfico de Inspección</span>
          </div>
          <div className="grid grid-cols-4 gap-3 pt-1">
            {photos.slice(0, 4).map((imgUrl, idx) => (
              <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
                <img
                  src={imgUrl}
                  alt={`Inspección ${idx + 1}`}
                  className="w-full h-24 object-cover"
                />
                <span className="block text-[9.5px] text-center font-bold text-zinc-600 py-1 bg-zinc-100">
                  Evidencia #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. FIRMAS DE CONFORMIDAD Y ENTREGA                                       */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t-2 border-zinc-900 space-y-8 break-inside-avoid">
        <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
          El cliente declara haber recibido el vehículo a su entera satisfacción, revisado en sus sistemas mecánicos y eléctricos
          según las normas técnicas de StarMotos y la garantía vigente de fábrica.
        </p>

        <div className="grid grid-cols-2 gap-16 pt-4 text-center">
          <div className="space-y-1">
            <div className="border-b border-zinc-900 w-3/4 mx-auto pb-8" />
            <span className="text-xs font-bold text-zinc-950 block">{clientFullName}</span>
            <span className="text-[10px] font-mono text-zinc-600 block">C.I / RUC: {record.cedulaRuc}</span>
            <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-zinc-400 block">
              Firma del Cliente
            </span>
          </div>

          <div className="space-y-1">
            <div className="border-b border-zinc-900 w-3/4 mx-auto pb-8" />
            <span className="text-xs font-bold text-zinc-950 block">
              {record.tecnicoResponsable || record.atendidoPor || 'Taller Autorizado'}
            </span>
            <span className="text-[10px] font-mono text-zinc-600 block">{record.sede}</span>
            <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-zinc-400 block">
              Firma y Sello de Taller StarMotos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
