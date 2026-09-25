// src/components/common/RatingServiceModal.tsx
import React, { useState } from 'react';
import { Star, Wrench, User, Calendar, ShieldCheck, X, Check, MessageSquare } from 'lucide-react';
import { TallerOrder } from '../../types/customer';
import { ModalPortal } from './ModalPortal';

interface RatingServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: TallerOrder | null;
  onSubmitRating: (ratingData: { stars: number; comment: string; orderId: string }) => void;
}

const STAR_LABELS: Record<number, { text: string; color: string }> = {
  1: { text: 'Insatisfecho - Necesita mejorar', color: 'text-red-600' },
  2: { text: 'Regular - Podría ser mejor', color: 'text-orange-600' },
  3: { text: 'Bueno - Servicio conforme', color: 'text-amber-600' },
  4: { text: 'Muy Bueno - Gran atención técnica', color: 'text-blue-600' },
  5: { text: '¡Excelente Servicio y Atención!', color: 'text-emerald-600' },
};

export const RatingServiceModal: React.FC<RatingServiceModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmitRating,
}) => {
  const [stars, setStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!order) return null;

  const activeStars = hoveredStars !== null ? hoveredStars : stars;
  const currentLabel = STAR_LABELS[activeStars] || STAR_LABELS[5];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsSubmitting(true);
    onSubmitRating({
      stars,
      comment: comment.trim(),
      orderId: order.id,
    });
    setIsSubmitting(false);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 animate-slide-in flex flex-col max-h-[90vh]">
        {/* Header con Gradiente y Estrellita */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <Star className="w-6 h-6 fill-white text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-100">
                Tu opinión nos importa
              </span>
              <h3 className="text-base font-black tracking-tight text-white">
                Calificar Servicio Técnico
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll si es necesario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Tarjeta de Resumen: Cliente, Moto y Orden */}
          <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {order.otNumber}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Orden Entregada</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-zinc-700 pt-1 border-t border-zinc-200/80">
              <div>
                <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Cliente</span>
                <span className="font-bold text-zinc-900 truncate block text-xs">{order.clientName}</span>
                <span className="text-[10px] text-zinc-500 font-mono">C.I. {order.clientIdNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block font-semibold uppercase">Vehículo</span>
                <span className="font-bold text-zinc-900 truncate block text-xs">{order.motorcycleInfo || 'Motocicleta'}</span>
                <span className="text-[10px] text-blue-700 font-mono font-bold">Placa: {order.plate || 'S/P'}</span>
              </div>
            </div>
          </div>

          {/* Tarjeta de Detalle del Servicio Recibido */}
          <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
              <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Servicio Recibido en Taller</span>
            </div>

            <div className="text-zinc-700 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Técnico que le atendió:</span>
                <span className="font-bold text-zinc-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {order.mechanicName || 'Técnico Especialista'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Fecha de atención:</span>
                <span className="font-mono text-zinc-800 font-medium">{order.entryDate}</span>
              </div>
              {order.servicesSummary && (
                <div className="pt-1.5 border-t border-blue-100 flex items-start gap-1.5">
                  <span className="text-zinc-500 shrink-0">Trabajos:</span>
                  <span className="text-zinc-800 font-semibold">{order.servicesSummary}</span>
                </div>
              )}
              {order.totalCost > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-blue-100">
                  <span className="text-zinc-500">Total Invertido:</span>
                  <span className="font-mono font-black text-blue-700 text-xs">
                    ${Number(order.totalCost).toFixed(2)} USD
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Estrellitas Interactivas de Calificación */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200 text-center space-y-2.5">
            <label className="block text-xs font-black uppercase text-amber-950 tracking-wider">
              ¿Cómo calificarías la atención de tu técnico?
            </label>

            <div className="flex items-center justify-center gap-2 py-1 select-none">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isLit = starValue <= activeStars;
                return (
                  <button
                    key={starValue}
                    type="button"
                    onClick={() => setStars(starValue)}
                    onMouseEnter={() => setHoveredStars(starValue)}
                    onMouseLeave={() => setHoveredStars(null)}
                    className="p-1 rounded-xl transition-all transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                    aria-label={`${starValue} de 5 estrellas`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isLit
                          ? 'fill-amber-400 text-amber-500 drop-shadow-sm'
                          : 'fill-zinc-100 text-zinc-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="h-5 flex items-center justify-center">
              <span className={`text-xs font-extrabold tracking-tight transition-all ${currentLabel.color}`}>
                {currentLabel.text}
              </span>
            </div>
          </div>

          {/* Cuadro de Observación / Comentario */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase text-zinc-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Observaciones y Comentarios</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos qué tal fue tu experiencia con el técnico, la puntualidad, el trato o cualquier sugerencia para el taller StarMotos..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs font-medium outline-none focus:border-amber-500 focus:bg-white resize-none text-zinc-900 transition"
            />
            <p className="text-[10px] text-zinc-400">
              Tus comentarios ayudan directamente a evaluar y reconocer a los técnicos de taller.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 font-bold hover:bg-zinc-100 text-xs transition cursor-pointer text-center"
            >
              Calificar más tarde
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Star className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Guardando...' : 'Enviar Calificación'}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalPortal>
  );
};
