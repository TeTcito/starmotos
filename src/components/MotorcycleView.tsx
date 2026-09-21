// src/components/MotorcycleView.tsx
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
import { MotorcycleClientData } from '../types/customer';

interface Props {
  motorcycle: MotorcycleClientData;
  onUpdateMotorcycle: (updated: MotorcycleClientData) => void;
}

export const MotorcycleView: React.FC<Props> = ({ motorcycle, onUpdateMotorcycle }) => {
  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in pb-12">
      {/* Encabezado sin contenedor externo */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-red-500" />
          <h2 className="text-base font-bold text-white">
            Ficha de mi Motocicleta
          </h2>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Guardado
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Campos Independientes de la Motocicleta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Placa del Vehículo */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Placa del Vehículo
            </label>
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <div className="flex items-center gap-2 text-zinc-500">
                <Bike className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-zinc-400 font-medium">Matrícula</span>
              </div>
              <div className="flex flex-col items-center bg-zinc-950 text-white px-2.5 py-0.5 rounded border border-zinc-800 font-mono shrink-0 shadow-xs">
                <div className="flex items-center gap-1 text-[6px] font-black tracking-widest text-zinc-400 uppercase border-b border-zinc-800 pb-0.2">
                  <span className="w-2 h-1 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[0.5px]" />
                  <span>EC</span>
                </div>
                <input
                  type="text"
                  value={motoForm.plate}
                  onChange={(e) => setMotoForm({ ...motoForm, plate: e.target.value.toUpperCase() })}
                  placeholder="PBX-8492"
                  className="w-24 text-center text-xs font-black tracking-wider bg-transparent border-none outline-none uppercase p-0 text-white"
                />
              </div>
            </div>
          </div>
          {/* Marca */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Marca
            </label>
            <div className="relative">
              <Bike className="w-3.5 h-3.5 absolute left-3 top-3 text-red-400" />
              <input
                type="text"
                value={motoForm.brand}
                onChange={(e) => setMotoForm({ ...motoForm, brand: e.target.value })}
                placeholder="Ej. Benelli, Yamaha, Honda..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Modelo
            </label>
            <div className="relative">
              <Bike className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-400" />
              <input
                type="text"
                value={motoForm.model}
                onChange={(e) => setMotoForm({ ...motoForm, model: e.target.value })}
                placeholder="Ej. TRK 502X ABS, FZ-25..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-medium"
              />
            </div>
          </div>

          {/* Año */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Año de Fabricación
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-3 text-amber-400" />
              <input
                type="number"
                value={motoForm.year}
                onChange={(e) => setMotoForm({ ...motoForm, year: Number(e.target.value) })}
                placeholder="2024"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Cilindraje */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Cilindraje
            </label>
            <div className="relative">
              <Zap className="w-3.5 h-3.5 absolute left-3 top-3 text-yellow-400" />
              <input
                type="text"
                value={motoForm.displacement}
                onChange={(e) => setMotoForm({ ...motoForm, displacement: e.target.value })}
                placeholder="Ej. 500 cc, 250 cc..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Color
            </label>
            <div className="relative">
              <Palette className="w-3.5 h-3.5 absolute left-3 top-3 text-purple-400" />
              <input
                type="text"
                value={motoForm.color}
                onChange={(e) => setMotoForm({ ...motoForm, color: e.target.value })}
                placeholder="Ej. Gris Antracita / Rojo Racing..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs"
              />
            </div>
          </div>

          {/* Número de Chasis / VIN */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Número de Chasis / VIN
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
              <input
                type="text"
                value={motoForm.vin}
                onChange={(e) => setMotoForm({ ...motoForm, vin: e.target.value.toUpperCase() })}
                placeholder="VIN (17 caracteres)"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono uppercase"
              />
            </div>
          </div>

          {/* Kilometraje Actual */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Kilometraje Actual
            </label>
            <div className="relative">
              <Gauge className="w-3.5 h-3.5 absolute left-3 top-3 text-blue-400" />
              <input
                type="number"
                value={motoForm.currentKm}
                onChange={(e) => setMotoForm({ ...motoForm, currentKm: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Aceite Habitual */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Aceite Habitual
            </label>
            <div className="relative">
              <Fuel className="w-3.5 h-3.5 absolute left-3 top-3 text-amber-400" />
              <select
                value={motoForm.preferredOil}
                onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
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
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Preferencia Repuestos
            </label>
            <div className="relative">
              <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
              <select
                value={motoForm.preferredPartsQuality}
                onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 text-white rounded-xl pl-9 pr-3 py-2 text-xs cursor-pointer"
              >
                <option value="originales_oem">100% Originales OEM</option>
                <option value="alternativos_premium">Alternativos de Alta Gama</option>
              </select>
            </div>
          </div>

          {/* Síntomas o Fallas Detectadas */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-amber-400 mb-1">
              Síntomas o Fallas Detectadas
            </label>
            <textarea
              value={motoForm.reportedSymptoms}
              onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
              rows={3}
              placeholder="Ruidos, frenos, encendido o detalles para el mecánico..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 text-white rounded-xl p-2.5 text-xs placeholder:text-zinc-600 transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-zinc-800">
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-5 rounded-xl shadow transition flex items-center gap-1.5 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ficha</span>
          </button>
        </div>
      </form>
    </div>
  );
};
