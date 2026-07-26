'use client';

import { useEffect } from 'react';

// Scroll suave del sitio.
//
// POR QUÉ LENIS Y NO LOCOMOTIVE SCROLL, que fue lo que se pidió:
// son del MISMO estudio (darkroom.engineering) y Lenis es el sucesor moderno de
// Locomotive. Diferencias que importan acá:
//   · Peso: Lenis ~3KB comprimido; locomotive-scroll ~30KB. Con las conexiones
//     de Venezuela, 27KB de JS extra en la ruta crítica se notan.
//   · Locomotive v4 mueve un contenedor con transforms: rompe la barra de
//     scroll del sistema, pelea con position:sticky y estorba a lectores de
//     pantalla. Lenis interpola el scroll NATIVO, así que la barra sigue siendo
//     la de verdad, los anclajes funcionan y `position: sticky` no se rompe.
//   · Locomotive necesita atributos data-scroll repartidos por el markup.
//
// Si de todos modos se prefiere Locomotive, el cambio es de este archivo solo.
//
// El componente no renderiza nada: solo instala el bucle y lo limpia al salir.

export function SmoothScroll() {
  useEffect(() => {
    // Quien pidió menos movimiento en su sistema se queda con el scroll nativo.
    // Es una preferencia de accesibilidad real: el scroll interpolado puede
    // provocar mareo y desorientación.
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    // Carga diferida: Lenis no entra en el bundle inicial, así que no retrasa
    // la primera pintura ni la LCP. El scroll nativo funciona mientras llega.
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;

      lenis = new Lenis({
        // Duración del arrastre. Por encima de ~1.4s se siente pegajoso y la
        // gente pierde la sensación de control.
        duration: 1.05,
        // Curva exponencial: arranca rápido y frena largo, que es lo que da la
        // sensación "caro" sin retardar la respuesta al gesto.
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        // En táctil NO se interpola: el dedo debe mover la página 1:1 o se
        // siente roto. El suavizado es para rueda y teclado.
        smoothWheel: true,
        syncTouch: false,
        touchMultiplier: 1.6,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}
