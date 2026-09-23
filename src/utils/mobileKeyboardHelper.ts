// src/utils/mobileKeyboardHelper.ts
/**
 * Asistente para teclado virtual en dispositivos móviles:
 * - Evita que el teclado virtual tape los campos de formulario.
 * - Desplaza suavemente el campo en foco para que quede centrado y visible por encima del teclado.
 * - Monitorea cambios en window.visualViewport para adaptarse cuando el teclado sube o baja.
 */

function getScrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement;
  while (parent && parent !== document.body && parent !== document.documentElement) {
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

let activeScrollParent: HTMLElement | null = null;
let blurTimeout: any = null;

export function initMobileKeyboardHelper() {
  if (typeof window === 'undefined') return;

  const scrollToActiveElement = (target: HTMLElement) => {
    try {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch (_) {
      try {
        target.scrollIntoView(false);
      } catch (__) {}
    }
  };

  const handleFocusIn = (e: FocusEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT';

    if (!isInput) return;

    // Solo activar en pantallas móviles o táctiles
    const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window;
    if (!isMobile) return;

    if (blurTimeout) {
      clearTimeout(blurTimeout);
      blurTimeout = null;
    }

    // Agregar padding de colchón al contenedor de scroll para permitir desplazar hasta arriba
    const scrollParent = getScrollParent(target);
    if (scrollParent) {
      activeScrollParent = scrollParent;
      scrollParent.classList.add('mobile-keyboard-pad');
    }

    // Desplazamiento escalonado para sincronizar con la animación de apertura del teclado móvil
    requestAnimationFrame(() => scrollToActiveElement(target));
    setTimeout(() => scrollToActiveElement(target), 120);
    setTimeout(() => scrollToActiveElement(target), 280);
    setTimeout(() => scrollToActiveElement(target), 450);
  };

  const handleFocusOut = () => {
    if (blurTimeout) clearTimeout(blurTimeout);
    blurTimeout = setTimeout(() => {
      const active = document.activeElement as HTMLElement | null;
      const isInputActive =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT');

      if (!isInputActive && activeScrollParent) {
        activeScrollParent.classList.remove('mobile-keyboard-pad');
        activeScrollParent = null;
      }
    }, 250);
  };

  // Escuchar eventos globales de foco
  window.addEventListener('focusin', handleFocusIn, { passive: true });
  window.addEventListener('focusout', handleFocusOut, { passive: true });

  // Escuchar resize de visualViewport (estándar para teclado virtual en Android / iOS)
  if (window.visualViewport) {
    const handleViewportResize = () => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT')
      ) {
        scrollToActiveElement(active);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize, { passive: true });
  }
}
