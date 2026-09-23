// src/components/desktop/MotorcycleDesktop.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Gauge,
  Fuel,
  ShieldCheck,
  Save,
  CheckCircle2,
  Bike,
  Calendar,
  Zap,
  Palette,
  Hash,
  X,
} from 'lucide-react';
import { MotorcycleClientData } from '../../types/customer';
import { cleanNumberInput, selectOnFocus } from '../../utils/numberUtils';

interface Props {
  motorcycle: MotorcycleClientData;
  onUpdateMotorcycle: (updated: MotorcycleClientData) => void;
}

export const MotorcycleDesktop: React.FC<Props> = ({ motorcycle, onUpdateMotorcycle }) => {
  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isSaved, setIsSaved] = useState(false);

  // Sincronizar si las props cambian
  useEffect(() => {
    setMotoForm(motorcycle);
  }, [motorcycle]);

  // Detectar si hay cambios pendientes
  const hasChanges = useMemo(() => {
    return JSON.stringify(motoForm) !== JSON.stringify(motorcycle);
  }, [motoForm, motorcycle]);

  // Cancelar y restaurar valores iniciales
  const handleCancel = () => {
    setMotoForm(motorcycle);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Encabezado de Sección */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              Ficha Técnica de mi Motocicleta
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Información del vehículo, especificaciones técnicas y reporte preventivo para los mecánicos de StarMotos
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-300 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Ficha Actualizada Exitosamente
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full">
        {/* Cuadrícula Proporcional de Campos de Izquierda a Derecha */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* Placa del Vehículo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Placa del Vehículo
            </label>
            <div className="flex items-center justify-between bg-white border border-zinc-300 hover:border-zinc-400 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 text-zinc-900 rounded-xl pl-3.5 pr-2 py-2 text-sm transition shadow-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Bike className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-zinc-500">Matrícula</span>
              </div>
              <div className="flex flex-col items-center bg-zinc-50 text-zinc-950 px-2.5 py-0.5 rounded border border-zinc-300 font-mono shrink-0 shadow-xs focus-within:border-blue-600">
                <div className="flex items-center gap-1.5 text-[7px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.5">
                  <span className="w-2.5 h-1 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[0.5px]" />
                  <span>ECUADOR</span>
                </div>
                <input
                  type="text"
                  value={motoForm.plate}
                  onChange={(e) => setMotoForm({ ...motoForm, plate: e.target.value.toUpperCase() })}
                  placeholder="PBX-8492"
                  className="w-24 text-center text-xs font-black tracking-wider bg-transparent border-none outline-none uppercase p-0"
                />
              </div>
            </div>
          </div>
          {/* Marca */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Marca
            </label>
            <div className="relative">
              <Bike className="w-4 h-4 absolute left-3.5 top-3 text-red-500" />
              <input
                type="text"
                value={motoForm.brand}
                onChange={(e) => setMotoForm({ ...motoForm, brand: e.target.value })}
                placeholder="Ej. Benelli, Yamaha, Honda"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Modelo
            </label>
            <div className="relative">
              <Bike className="w-4 h-4 absolute left-3.5 top-3 text-blue-600" />
              <input
                type="text"
                value={motoForm.model}
                onChange={(e) => setMotoForm({ ...motoForm, model: e.target.value })}
                placeholder="Ej. TRK 502X ABS, FZ-25"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Año de Fabricación */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Año de Fabricación
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
              <input
                type="number"
                value={motoForm.year}
                onFocus={selectOnFocus}
                onChange={(e) => {
                  const clean = cleanNumberInput(e.target.value);
                  setMotoForm({ ...motoForm, year: clean === '' ? 0 : Number(clean) });
                }}
                placeholder="2024"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Cilindraje */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Cilindraje
            </label>
            <div className="relative">
              <Zap className="w-4 h-4 absolute left-3.5 top-3 text-yellow-500" />
              <input
                type="text"
                value={motoForm.displacement}
                onChange={(e) => setMotoForm({ ...motoForm, displacement: e.target.value })}
                placeholder="Ej. 500 cc, 250 cc"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Color y Acabado
            </label>
            <div className="relative">
              <Palette className="w-4 h-4 absolute left-3.5 top-3 text-purple-500" />
              <input
                type="text"
                value={motoForm.color}
                onChange={(e) => setMotoForm({ ...motoForm, color: e.target.value })}
                placeholder="Ej. Gris Antracita / Rojo Racing"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Número de Chasis / VIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Número de Chasis / VIN
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-3 text-emerald-500" />
              <input
                type="text"
                value={motoForm.vin}
                onChange={(e) => setMotoForm({ ...motoForm, vin: e.target.value.toUpperCase() })}
                placeholder="17 caracteres alfanuméricos"
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono uppercase transition placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Kilometraje Actual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Kilometraje Actual (Odómetro)
            </label>
            <div className="relative">
              <Gauge className="w-4 h-4 absolute left-3.5 top-3 text-blue-600" />
              <input
                type="number"
                value={motoForm.currentKm}
                onFocus={selectOnFocus}
                onChange={(e) => {
                  const clean = cleanNumberInput(e.target.value);
                  setMotoForm({ ...motoForm, currentKm: clean === '' ? 0 : Number(clean) });
                }}
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold transition"
              />
            </div>
          </div>

          {/* Aceite Habitual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Aceite Habitual Preferido
            </label>
            <div className="relative">
              <Fuel className="w-4 h-4 absolute left-3.5 top-3 text-amber-500" />
              <select
                value={motoForm.preferredOil}
                onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-pointer transition"
              >
                <option value="Motul 7100 10W-40 100% Sintético">Motul 7100 10W-40 (100% Sintético)</option>
                <option value="Motul 5100 15W-50 Semi-Sintético">Motul 5100 15W-50 (Semi-sintético)</option>
                <option value="Castrol Power1 10W-40 4T">Castrol Power1 10W-40</option>
                <option value="Yamalube 10W-40 4T Full Synthetic">Yamalube 10W-40</option>
                <option value="Recomendación Oficial del Mecánico">Recomendación Oficial del Taller</option>
              </select>
            </div>
          </div>

          {/* Preferencia Repuestos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              Preferencia de Repuestos
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-emerald-500" />
              <select
                value={motoForm.preferredPartsQuality}
                onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-pointer transition"
              >
                <option value="originales_oem">100% Originales OEM de Fábrica</option>
                <option value="alternativos_premium">Alternativos de Calidad Premium</option>
              </select>
            </div>
          </div>

          {/* Síntomas o Fallas Detectadas (Ocupa todo el ancho) */}
          <div className="col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-amber-600 mb-1.5">
              Síntomas, Ruidos o Fallas Detectadas por el Conductor
            </label>
            <textarea
              value={motoForm.reportedSymptoms}
              onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
              rows={3}
              placeholder="Describa ruidos anormales, comportamiento de frenos, embrague, sistema eléctrico o detalles que los mecánicos deban revisar..."
              className="w-full bg-white border border-zinc-300 hover:border-zinc-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-900 rounded-xl p-3.5 text-sm placeholder:text-zinc-400 transition"
            />
          </div>
        </div>

        {/* Barra de Acciones: Guardar y Cancelar (este último solo cuando hay cambios) */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
          <p className="text-xs text-zinc-500">
            {hasChanges
              ? 'Tienes modificaciones pendientes en la ficha técnica.'
              : 'Esta información es utilizada por los mecánicos para la preparación de los insumos antes de su cita.'}
          </p>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 font-bold text-sm transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-98 animate-fade-in"
              >
                <X className="w-4 h-4 text-zinc-500" />
                <span>Cancelar</span>
              </button>
            )}

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-red-600/20 transition flex items-center gap-2 active:scale-98 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Ficha de la Moto</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
