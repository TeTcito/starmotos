// src/components/desktop/MotorcycleDesktop.tsx
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

export const MotorcycleDesktop: React.FC<Props> = ({ motorcycle, onUpdateMotorcycle }) => {
  const [motoForm, setMotoForm] = useState<MotorcycleClientData>(motorcycle);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateMotorcycle(motoForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Encabezado de Sección */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Ficha Técnica de mi Motocicleta
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Información del vehículo, especificaciones técnicas y reporte preventivo para los mecánicos de StarMotos
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 bg-emerald-950/60 px-3.5 py-1.5 rounded-xl border border-emerald-500/30 animate-fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            Ficha Actualizada Exitosamente
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 w-full">
        {/* 1. Sección Placa de la Moto (Ancho Completo Proporcional) */}
        <div className="flex items-center justify-between gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 w-full">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center bg-white text-zinc-950 px-3 py-1 rounded-md border border-zinc-300 font-mono shrink-0 shadow">
              <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest text-zinc-800 uppercase border-b border-zinc-200 pb-0.5">
                <span className="w-3 h-1.5 bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 rounded-[0.5px]" />
                <span>ECUADOR</span>
              </div>
              <span className="text-base font-black tracking-wider leading-tight mt-0.5">
                {motoForm.plate || 'SIN-PLACA'}
              </span>
            </div>

            <div>
              <label className="block text-sm font-bold text-white">
                Placa Registrada en ANT
              </label>
              <p className="text-xs text-zinc-400">
                Identificador oficial vehicular para el historial técnico y garantías de taller
              </p>
            </div>
          </div>

          <div className="w-48">
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Modificar Placa
            </label>
            <input
              type="text"
              value={motoForm.plate}
              onChange={(e) => setMotoForm({ ...motoForm, plate: e.target.value.toUpperCase() })}
              placeholder="PBX-8492"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 text-white rounded-xl px-3.5 py-2 text-sm font-mono font-bold uppercase tracking-wider text-center"
            />
          </div>
        </div>

        {/* 2. Cuadrícula Proporcional de Campos de Izquierda a Derecha */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* Marca */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Marca
            </label>
            <div className="relative">
              <Bike className="w-4 h-4 absolute left-3.5 top-3 text-red-400" />
              <input
                type="text"
                value={motoForm.brand}
                onChange={(e) => setMotoForm({ ...motoForm, brand: e.target.value })}
                placeholder="Ej. Benelli, Yamaha, Honda"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition"
              />
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Modelo
            </label>
            <div className="relative">
              <Bike className="w-4 h-4 absolute left-3.5 top-3 text-blue-400" />
              <input
                type="text"
                value={motoForm.model}
                onChange={(e) => setMotoForm({ ...motoForm, model: e.target.value })}
                placeholder="Ej. TRK 502X ABS, FZ-25"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium transition"
              />
            </div>
          </div>

          {/* Año de Fabricación */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Año de Fabricación
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-3 text-amber-400" />
              <input
                type="number"
                value={motoForm.year}
                onChange={(e) => setMotoForm({ ...motoForm, year: Number(e.target.value) })}
                placeholder="2024"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition"
              />
            </div>
          </div>

          {/* Cilindraje */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Cilindraje
            </label>
            <div className="relative">
              <Zap className="w-4 h-4 absolute left-3.5 top-3 text-yellow-400" />
              <input
                type="text"
                value={motoForm.displacement}
                onChange={(e) => setMotoForm({ ...motoForm, displacement: e.target.value })}
                placeholder="Ej. 500 cc, 250 cc"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono transition"
              />
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Color y Acabado
            </label>
            <div className="relative">
              <Palette className="w-4 h-4 absolute left-3.5 top-3 text-purple-400" />
              <input
                type="text"
                value={motoForm.color}
                onChange={(e) => setMotoForm({ ...motoForm, color: e.target.value })}
                placeholder="Ej. Gris Antracita / Rojo Racing"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm transition"
              />
            </div>
          </div>

          {/* Número de Chasis / VIN */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Número de Chasis / VIN
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-3.5 top-3 text-emerald-400" />
              <input
                type="text"
                value={motoForm.vin}
                onChange={(e) => setMotoForm({ ...motoForm, vin: e.target.value.toUpperCase() })}
                placeholder="17 caracteres alfanuméricos"
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono uppercase transition"
              />
            </div>
          </div>

          {/* Kilometraje Actual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Kilometraje Actual (Odómetro)
            </label>
            <div className="relative">
              <Gauge className="w-4 h-4 absolute left-3.5 top-3 text-blue-400" />
              <input
                type="number"
                value={motoForm.currentKm}
                onChange={(e) => setMotoForm({ ...motoForm, currentKm: Number(e.target.value) })}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono font-bold transition"
              />
            </div>
          </div>

          {/* Aceite Habitual */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Aceite Habitual Preferido
            </label>
            <div className="relative">
              <Fuel className="w-4 h-4 absolute left-3.5 top-3 text-amber-400" />
              <select
                value={motoForm.preferredOil}
                onChange={(e) => setMotoForm({ ...motoForm, preferredOil: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-pointer transition"
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
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Preferencia de Repuestos
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3.5 top-3 text-emerald-400" />
              <select
                value={motoForm.preferredPartsQuality}
                onChange={(e) => setMotoForm({ ...motoForm, preferredPartsQuality: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm cursor-pointer transition"
              >
                <option value="originales_oem">100% Originales OEM de Fábrica</option>
                <option value="alternativos_premium">Alternativos de Calidad Premium</option>
              </select>
            </div>
          </div>

          {/* Síntomas o Fallas Detectadas (Ocupa todo el ancho) */}
          <div className="col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-amber-400 mb-1.5">
              Síntomas, Ruidos o Fallas Detectadas por el Conductor
            </label>
            <textarea
              value={motoForm.reportedSymptoms}
              onChange={(e) => setMotoForm({ ...motoForm, reportedSymptoms: e.target.value })}
              rows={3}
              placeholder="Describa ruidos anormales, comportamiento de frenos, embrague, sistema eléctrico o detalles que los mecánicos deban revisar..."
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-xl p-3.5 text-sm placeholder:text-zinc-600 transition"
            />
          </div>
        </div>

        {/* Botón de Guardado */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500">
            Esta información es utilizada por los mecánicos para la preparación de los insumos antes de su cita.
          </p>

          <button
            type="submit"
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-lg shadow-red-600/20 transition flex items-center gap-2 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ficha de la Moto</span>
          </button>
        </div>
      </form>
    </div>
  );
};
