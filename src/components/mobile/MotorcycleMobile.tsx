// src/components/mobile/MotorcycleMobile.tsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { MotorcycleClientData } from '../../types/customer';

interface Props {
  motorcycle: MotorcycleClientData;
  onUpdateMotorcycle: (updated: MotorcycleClientData) => void;
}

export const MotorcycleMobile: React.FC<Props> = ({ motorcycle, onUpdateMotorcycle }) => {
  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isSaved, setIsSaved] = useState(false);

  // Función para interceptar teclas no numéricas
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
    if (allowed.includes(e.key)) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* Encabezado sin contenedor externo */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Ficha de mi Motocicleta
          </h2>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Guardado
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* Primera Sección: Placa de la Moto */}
        <div className="flex items-center justify-between gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center bg-white text-zinc-950 px-2.5 py-0.5 rounded border border-zinc-300 font-mono shrink-0 shadow-sm">
              <div className="flex items-center gap-1 text-[6px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.2">
                <span className="w-2 h-1 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[0.5px]" />
                <span>EC</span>
              </div>
              <span className="text-xs font-black tracking-wide leading-tight mt-0.5">
                {motoForm.plate || 'S/P'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-900">
                Placa del Vehículo
              </label>
              <span className="text-[10px] text-zinc-500">
                Identificación oficial ANT
              </span>
            </div>
          </div>

          <div className="w-32 sm:w-36">
            <input
              type="text"
              value={motoForm.plate}
              onChange={(e) => setMotoForm({ ...motoForm, plate: e.target.value.toUpperCase() })}
              placeholder="PBX-8492"
              className="w-full bg-white border border-zinc-300 focus:border-blue-600 text-zinc-900 rounded-xl px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-center"
            />
          </div>
        </div>

        {/* Campos Independientes de la Motocicleta */}
        <div className="space-y-3">
          {/* Marca */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Marca
            </label>
            <div className="relative">
              <Bike className="w-3.5 h-3.5 absolute left-3 top-3 text-red-500" />
              <input
                type="text"
                value={motoForm.brand}
                onChange={(e) => setMotoForm({ ...motoForm, brand: e.target.value })}
                placeholder="Ej. Benelli, Yamaha, Honda..."
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Modelo
            </label>
            <div className="relative">
              <Bike className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-600" />
              <input
                type="text"
                value={motoForm.model}
                onChange={(e) => setMotoForm({ ...motoForm, model: e.target.value })}
                placeholder="Ej. TRK 502X ABS, FZ-25..."
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-medium placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Año - Teclado Numérico Estricto */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700">
                Año de Fabricación
              </label>
              <span className="text-[10px] text-amber-600 font-mono font-bold">Solo números</span>
            </div>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-amber-500" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={motoForm.year || ''}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMotoForm({ ...motoForm, year: val ? Number(val) : 0 });
                }}
                placeholder="Ej. 2024"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Cilindraje */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Cilindraje
            </label>
            <div className="relative">
              <Zap className="w-3.5 h-3.5 absolute left-3 top-3 text-yellow-500" />
              <input
                type="text"
                value={motoForm.displacement}
                onChange={(e) => setMotoForm({ ...motoForm, displacement: e.target.value })}
                placeholder="Ej. 500 cc, 250 cc..."
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Color
            </label>
            <div className="relative">
              <Palette className="w-3.5 h-3.5 absolute left-3 top-3 text-purple-500" />
              <input
                type="text"
                value={motoForm.color}
                onChange={(e) => setMotoForm({ ...motoForm, color: e.target.value })}
                placeholder="Ej. Gris Antracita / Rojo Racing..."
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Número de Chasis / VIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Número de Chasis / VIN
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-500" />
              <input
                type="text"
                value={motoForm.vin}
                onChange={(e) => setMotoForm({ ...motoForm, vin: e.target.value.toUpperCase() })}
                placeholder="VIN (17 caracteres)"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono uppercase placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Kilometraje Actual - Teclado Numérico Estricto */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-700">
                Kilometraje Actual
              </label>
              <span className="text-[10px] text-blue-600 font-mono font-bold">Solo números</span>
            </div>
            <div className="relative">
              <Gauge className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-600" />
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={7}
                value={motoForm.currentKm || ''}
                onKeyDown={handleNumericKeyDown}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setMotoForm({ ...motoForm, currentKm: val ? Number(val) : 0 });
                }}
                placeholder="Ej. 14250"
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold placeholder:text-zinc-400"
              />
            </div>
          </div>

          {/* Aceite Habitual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Aceite Habitual
            </label>
            <div className="relative">
              <Fuel className="w-3.5 h-3.5 absolute left-3 top-3 text-amber-500" />
              <select
                value={motoForm.preferredOil}
                onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
              >
                <option value="Motul 7100 10W-40 100% Sintético">Motul 7100 10W-40 (Sintético)</option>
                <option value="Motul 5100 15W-50 Semi-Sintético">Motul 5100 15W-50 (Semi-sintético)</option>
                <option value="Castrol Power1 10W-40 4T">Castrol Power1 10W-40</option>
                <option value="Yamalube 10W-40 4T Full Synthetic">Yamalube 10W-40</option>
                <option value="Recomendación Oficial del Mecánico">Recomendación de Taller</option>
              </select>
            </div>
          </div>

          {/* Preferencia Repuestos */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Preferencia Repuestos
            </label>
            <div className="relative">
              <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-500" />
              <select
                value={motoForm.preferredPartsQuality}
                onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                className="w-full bg-white border border-zinc-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-zinc-900 rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
              >
                <option value="originales_oem">100% Originales OEM</option>
                <option value="alternativos_premium">Alternativos de Alta Gama</option>
              </select>
            </div>
          </div>

          {/* Síntomas o Fallas Detectadas */}
          <div>
            <label className="block text-xs font-semibold text-amber-600 mb-1">
              Síntomas o Fallas Detectadas
            </label>
            <textarea
              value={motoForm.reportedSymptoms}
              onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
              rows={3}
              placeholder="Ruidos, frenos, encendido o detalles para el mecánico..."
              className="w-full bg-white border border-zinc-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-zinc-900 rounded-xl p-2.5 text-xs placeholder:text-zinc-400 transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-200">
          <button
            type="submit"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow transition flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ficha</span>
          </button>
        </div>
      </form>
    </div>
  );
};
