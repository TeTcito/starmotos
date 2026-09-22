// src/components/mobile/admin/AlistamientoMobile.tsx
import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Bike,
  Wrench,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import {
  AlistamientoClient,
  AlistamientoMotorcycle,
  AlistamientoService,
  MaintenanceType,
} from '../../../types/customer';

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

export const AlistamientoMobile: React.FC<Props> = ({
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
    <div className="space-y-4">
      {/* Pasos móviles */}
      <div className="flex rounded-xl bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            step === 1 ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          1. Cliente SRI
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            step === 2 ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          2. Moto
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${
            step === 3 ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-600'
          }`}
        >
          3. Servicio
        </button>
      </div>

      {/* Contenido según paso */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
        {step === 1 && (
          <div className="space-y-3.5">
            <form onSubmit={handleSearchClick} className="flex gap-2">
              <input
                type="text"
                value={cedulaInput}
                onChange={(e) => setCedulaInput(e.target.value)}
                placeholder="Cédula o RUC ecuatoriano..."
                className="flex-1 px-3 py-2 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg outline-none focus:border-blue-600"
              />
              <button
                type="submit"
                disabled={isSearchingSri}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shrink-0"
              >
                {isSearchingSri ? 'Buscando...' : 'Buscar SRI'}
              </button>
            </form>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Razón Social SRI</label>
                <input
                  type="text"
                  value={client.fullName}
                  onChange={(e) => setClient({ ...client, fullName: e.target.value })}
                  placeholder="Se auto-rellena con SRI..."
                  className="w-full px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Teléfono Móvil</label>
                <input
                  type="tel"
                  value={client.phone}
                  onChange={(e) => setClient({ ...client, phone: e.target.value })}
                  placeholder="0998745612"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Correo Facturación</label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => setClient({ ...client, email: e.target.value })}
                  placeholder="cliente@correo.com"
                  className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!client.fullName}
                className="w-full py-2 bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <span>Paso 2: Datos de la Moto</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3.5">
            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Marca</label>
                <input
                  type="text"
                  value={motorcycle.brand}
                  onChange={(e) => setMotorcycle({ ...motorcycle, brand: e.target.value })}
                  placeholder="Ej: Benelli, CFMOTO..."
                  className="w-full px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Modelo</label>
                <input
                  type="text"
                  value={motorcycle.model}
                  onChange={(e) => setMotorcycle({ ...motorcycle, model: e.target.value })}
                  placeholder="Ej: TRK 502X..."
                  className="w-full px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Placa</label>
                <input
                  type="text"
                  value={motorcycle.plate}
                  onChange={(e) => setMotorcycle({ ...motorcycle, plate: e.target.value.toUpperCase() })}
                  placeholder="PBX-8492"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Color</label>
                <input
                  type="text"
                  value={motorcycle.color || ''}
                  onChange={(e) => setMotorcycle({ ...motorcycle, color: e.target.value })}
                  placeholder="Ej: Rojo / Negro / Blanco"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Chasis (VIN)</label>
                <input
                  type="text"
                  value={motorcycle.chassisNumber}
                  onChange={(e) => setMotorcycle({ ...motorcycle, chassisNumber: e.target.value.toUpperCase() })}
                  placeholder="17 dígitos"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-lg"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!motorcycle.brand || !motorcycle.model}
                className="flex-1 py-2 bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg"
              >
                Paso 3: Servicio
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Tipo Servicio</label>
              <select
                value={service.maintenanceType}
                onChange={(e) =>
                  setService({ ...service, maintenanceType: e.target.value as MaintenanceType })
                }
                className="w-full px-3 py-2 text-xs font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
              >
                <option value="preventivo">Preventivo</option>
                <option value="engrasado">Engrasado & Kit</option>
                <option value="mantenimiento_completo">Mantenimiento Completo</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Costo Total ($ USD)</label>
              <input
                type="number"
                step="0.01"
                value={service.cost}
                onChange={(e) => setService({ ...service, cost: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold text-blue-600 bg-zinc-50 border border-zinc-300 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-0.5">Observaciones</label>
              <textarea
                rows={2}
                value={service.observations}
                onChange={(e) => setService({ ...service, observations: e.target.value })}
                placeholder="Ruidos, revisiones especiales..."
                className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-2 border border-zinc-300 text-zinc-700 text-xs font-bold rounded-lg"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
