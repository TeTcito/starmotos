// src/components/common/ModalPortal.tsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // 1. Guardar y bloquear el scroll en body y html
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // 2. Guardar y bloquear scroll en los contenedores <main> y aside de escritorio
    const scrollContainers = document.querySelectorAll<HTMLElement>('main, aside');
    const prevContainers: { el: HTMLElement; overflow: string }[] = [];
    scrollContainers.forEach((el) => {
      prevContainers.push({ el, overflow: el.style.overflow });
      el.style.overflow = 'hidden';
    });

    // 3. Cerrar con la tecla Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Limpieza al desmontar o cerrar
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      prevContainers.forEach(({ el, overflow }) => {
        el.style.overflow = overflow;
      });
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 w-screen h-screen z-[99999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-3xl w-full ${maxWidth} shadow-2xl border border-zinc-200 overflow-hidden flex flex-col select-text animate-scale-up ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
