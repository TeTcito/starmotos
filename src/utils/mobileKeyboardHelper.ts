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
    if (parent.dataset.noKeyboardPad) {
      parent = parent.parentElement;
      continue;
    }
    const style = window.getComputedStyle(parent);
    const overflowY = style.overflowY;
    // Solo considerar un scroll parent si es el contenedor principal de la vista (>350px de alto)
    if ((overflowY === 'auto' || overflowY === 'scroll') && parent.clientHeight >= 350) {
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
    // Si el elemento ya es visible cómodamente en la pantalla, no forzar scroll
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

    // Si ya está visible por encima de donde saldría el teclado, no mover
    if (rect.top >= 70 && rect.bottom <= viewportHeight * 0.65) {
      return;
    }

    try {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
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

    // Solo agregar colchón si el campo está en la parte baja de la pantalla
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const isNearBottom = rect.bottom > viewportHeight * 0.6;

    if (isNearBottom) {
      const scrollParent = getScrollParent(target);
      if (scrollParent) {
        activeScrollParent = scrollParent;
        scrollParent.classList.add('mobile-keyboard-pad');
      }
    }

    // Desplazamiento no agresivo solo si es necesario
    requestAnimationFrame(() => scrollToActiveElement(target));
    setTimeout(() => scrollToActiveElement(target), 250);
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
