// src/components/desktop/admin/AlistamientoDesktop.tsx
import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Bike,
  Wrench,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import {
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
  MaintenanceType,
} from '../../../types/customer';
import { cleanNumberInput, selectOnFocus } from '../../../utils/numberUtils';
import { getRegisteredBrands } from '../../../data/mockMultiRoleData';

interface Props {
  client: AlistamientoClient;
  setClient: React.Dispatch<React.SetStateAction<AlistamientoClient>>;
  motorcycle: AlistamientoMotorcycle;
  setMotorcycle: React.Dispatch<React.SetStateAction<AlistamientoMotorcycle>>;
  service: AlistamientoService;
  setService: React.Dispatch<React.SetStateAction<AlistamientoService>>;
  isSearchingSri: boolean;
  onSearchSri: (idNumber: string) => void;
  onSubmit: () => boolean;
}

export const AlistamientoDesktop: React.FC<Props> = ({
  client,
  setClient,
  motorcycle,
  setMotorcycle,
  service,
  setService,
  isSearchingSri,
  onSearchSri,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cedulaInput, setCedulaInput] = useState(client.idNumber || '');

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (cedulaInput.trim()) {
      onSearchSri(cedulaInput.trim());
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onSubmit();
    if (success) {
      setStep(1);
      setCedulaInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-600" />
          <span>Alistamiento & Recepción de Nuevos Clientes</span>
        </h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Ingreso en 3 pasos con consulta y validación automática del padrón fiscal SRI Ecuador.
        </p>
      </div>

      {/* Indicador de Progreso de 3 Pasos */}
      <div className="grid grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
            step === 1
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20'
              : 'bg-[#f0f6fc] text-zinc-700 border-[#b8d1ea] hover:bg-blue-50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              step === 1 ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}
          >
            1
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Paso 1</p>
            <p className="text-xs font-bold">Datos del Cliente (SRI)</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStep(2)}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
            step === 2
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20'
              : 'bg-[#f0f6fc] text-zinc-700 border-[#b8d1ea] hover:bg-blue-50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              step === 2 ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}
          >
            2
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Paso 2</p>
            <p className="text-xs font-bold">Ficha de la Motocicleta</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStep(3)}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 ${
            step === 3
              ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20'
              : 'bg-[#f0f6fc] text-zinc-700 border-[#b8d1ea] hover:bg-blue-50'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              step === 3 ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}
          >
            3
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">Paso 3</p>
            <p className="text-xs font-bold">Servicio, Factura y Costo</p>
          </div>
        </button>
      </div>

      {/* Contenido del Paso Activo */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-xs">
        {/* PASO 1: CLIENTE Y CONSULTA SRI */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Búsqueda Automática en SRI Ecuador</h3>
                <p className="text-xs text-zinc-500">
                  Ingrese el número de cédula (10 dígitos) o RUC (13 dígitos) para recuperar la Razón Social.
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-mono">
                API SRI Pública
              </span>
            </div>

            {/* Barra de Búsqueda SRI */}
            <form onSubmit={handleSearchClick} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cedulaInput}
                  onChange={(e) => setCedulaInput(e.target.value)}
                  placeholder="Ej: 1724890123 o 1792345678001"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm font-mono bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingSri}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
              >
                {isSearchingSri ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>{isSearchingSri ? 'Consultando SRI...' : 'Buscar Contribuyente'}</span>
              </button>
            </form>

            {/* Formulario de Datos del Cliente */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Razón Social / Nombres Completos (SRI)
                </label>
                <input
                  type="text"
                  value={client.fullName}
                  onChange={(e) => setClient({ ...client, fullName: e.target.value })}
                  placeholder="Se auto-rellenará al consultar el SRI..."
                  className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Tipo de Contribuyente
                </label>
                <input
                  type="text"
                  value={client.tipoContribuyente}
                  onChange={(e) => setClient({ ...client, tipoContribuyente: e.target.value })}
                  placeholder="Persona Natural / Sociedad..."
                  className="w-full px-3.5 py-2 text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Teléfono / WhatsApp Móvil
                </label>
                <input
                  type="tel"
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  placeholder="0998745612"
                  className="w-full px-3.5 py-2 text-xs font-mono text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Correo para Facturación SRI
                </label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full px-3.5 py-2 text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Dirección Domiciliaria
                </label>
                <input
                  type="text"
                  value={client.address}
                  onChange={(e) => setClient({ ...client, address: e.target.value })}
                  placeholder="Av. Principal y Secundaria, Quito"
                  className="w-full px-3.5 py-2 text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!client.fullName}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <span>Siguiente: Datos de la Moto</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: DATOS DE LA MOTOCICLETA */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Ficha Técnica del Vehículo</h3>
                <p className="text-xs text-zinc-500">
                  Ingrese las características técnicas de la motocicleta que ingresa a servicio.
                </p>
              </div>
              <Bike className="w-5 h-5 text-blue-600" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Marca</label>
                <input
                  type="text"
                  list="registered-brands-datalist"
                  value={motorcycle.brand}
                  onChange={(e) => setMotorcycle({ ...motorcycle, brand: e.target.value })}
                  placeholder="Ej: Benelli, CFMOTO, Yamaha..."
                  className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
                <datalist id="registered-brands-datalist">
                  {getRegisteredBrands().map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Modelo</label>
                <input
                  type="text"
                  value={motorcycle.model}
                  onChange={(e) => setMotorcycle({ ...motorcycle, model: e.target.value })}
                  placeholder="Ej: TRK 502X ABS, MT-03..."
                  className="w-full px-3.5 py-2 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Placa (Ecuador)</label>
                <input
                  type="text"
                  value={motorcycle.plate}
                  onChange={(e) => setMotorcycle({ ...motorcycle, plate: e.target.value.toUpperCase() })}
                  placeholder="Ej: PBX-8492 o S/P"
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Número de Chasis (VIN)
                </label>
                <input
                  type="text"
                  value={motorcycle.chassisNumber}
                  onChange={(e) => setMotorcycle({ ...motorcycle, chassisNumber: e.target.value.toUpperCase() })}
                  placeholder="Ej: LBBP57008PA049182 (17 caracteres)"
                  className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Año Modelo</label>
                <input
                  type="number"
                  value={motorcycle.year}
                  onFocus={selectOnFocus}
                  onChange={(e) => {
                    const clean = cleanNumberInput(e.target.value);
                    setMotorcycle({ ...motorcycle, year: clean === '' ? 0 : Number(clean) });
                  }}
                  className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">Color / Acabado</label>
                <input
                  type="text"
                  value={motorcycle.color}
                  onChange={(e) => setMotorcycle({ ...motorcycle, color: e.target.value })}
                  placeholder="Ej: Gris Antracita con chasis Rojo Racing"
                  className="w-full px-3.5 py-2 text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold flex items-center gap-2 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Paso 1</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!motorcycle.brand || !motorcycle.model}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
              >
                <span>Siguiente: Servicio y Factura</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: SERVICIO, OBSERVACIONES Y COSTO */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Tipo de Mantenimiento y Costo</h3>
                <p className="text-xs text-zinc-500">
                  Seleccione el plan de trabajo solicitado y registre el número de factura emitida.
                </p>
              </div>
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Tipo de Mantenimiento
                </label>
                <select
                  value={service.maintenanceType}
                  onChange={(e) =>
                    setService({ ...service, maintenanceType: e.target.value as MaintenanceType })
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-bold text-zinc-900 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="preventivo">Mantenimiento Preventivo (Aceite + Filtro + Puntos Clave)</option>
                  <option value="engrasado">Engrasado General & Ajuste de Kit de Arrastre</option>
                  <option value="mantenimiento_completo">
                    Mantenimiento Completo Mayor (Válvulas + Escáner Delphi + Suspensión)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Costo Total Estimado ($ USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={service.cost}
                    onFocus={selectOnFocus}
                    onChange={(e) => {
                      const clean = cleanNumberInput(e.target.value);
                      setService({ ...service, cost: clean === '' ? 0 : Number(clean) });
                    }}
                    className="w-full pl-8 pr-3.5 py-2 text-xs font-bold font-mono text-blue-600 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Número de Factura SRI (Opcional)
                </label>
                <input
                  type="text"
                  value={service.invoiceNumber}
                  onChange={(e) => setService({ ...service, invoiceNumber: e.target.value })}
                  placeholder="Ej: 001-002-0008892"
                  className="w-full px-3.5 py-2 text-xs font-mono text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase text-zinc-600 mb-1">
                  Observaciones Técnicas / Reclamos del Cliente
                </label>
                <textarea
                  rows={3}
                  value={service.observations}
                  onChange={(e) => setService({ ...service, observations: e.target.value })}
                  placeholder="Detallar condiciones de recepción, vibraciones, estado de pastillas o solicitud de repuestos especiales..."
                  className="w-full px-3.5 py-2 text-xs text-zinc-700 bg-zinc-50 border border-zinc-300 rounded-xl focus:border-blue-600 focus:bg-white outline-none resize-none"
                />
              </div>
            </div>

            {/* Resumen del Registro */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-blue-900 block">
                  {client.fullName || 'Cliente no registrado'} — {motorcycle.brand} {motorcycle.model}
                </span>
                <span className="text-zinc-600 text-[11px]">
                  C.I: {client.idNumber} | Placa: {motorcycle.plate || 'S/P'} | Servicio: {service.maintenanceType}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total a Facturar</span>
                <span className="text-base font-black text-blue-700 font-mono">${service.cost.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 text-xs font-bold flex items-center gap-2 hover:bg-zinc-50 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Paso 2</span>
              </button>

              <button
                type="submit"
                className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Alistamiento & Emitir Factura</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
