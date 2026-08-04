'use client';

/**
 * Pointer position in viewport CSS px, for the thread's cursor deflection.
 * Module singleton for the same reason the scroll store is one: the render
 * loop must never cause a React render.
 */
export const pointer = {
  x: 0,
  y: 0,
  active: false,
};

export function watchPointer() {
  if (typeof window === 'undefined') return () => {};
  // Desktop pointers only — the brief is explicit, and on touch the "cursor"
  // would sit wherever the last tap was and drag the thread with it.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return () => {};
  }

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
  };
  const leave = () => {
    pointer.active = false;
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  document.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);

  return () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', move);
    document.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', leave);
  };
}
