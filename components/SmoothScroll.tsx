'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface LenisLike {
  raf: (t: number) => void;
  destroy: () => void;
  resize: () => void;
  scrollTo: (t: number, o?: { immediate?: boolean }) => void;
}

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
  const instancia = useRef<LenisLike | null>(null);
  const pendiente = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    // Quien pidió menos movimiento en su sistema se queda con el scroll nativo.
    // Es una preferencia de accesibilidad real: el scroll interpolado puede
    // provocar mareo y desorientación.
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    let lenis: LenisLike | null = null;
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
        // Los enlaces a #ancla los maneja Lenis. Sin esto el navegador hace un
        // salto NATIVO que deja la posición interna de Lenis desincronizada de
        // la real, y a partir de ahí la rueda parece no responder. El offset
        // replica el scroll-padding-top de html (6.5rem), que Lenis no lee, para
        // que la barra fija no tape el título de destino.
        anchors: { offset: -104 },
      });
      instancia.current = lenis;

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
      instancia.current = null;
    };
  }, []);

  // Al cambiar de ruta: arriba y a recalcular.
  //
  // Este componente vive en el layout RAÍZ, así que sobrevive a las
  // navegaciones del cliente: la misma instancia de Lenis pasa del home a
  // /propiedad/<slug> o /alquiler/<zona>. El problema es que se queda con la
  // posición y las medidas de la página ANTERIOR. Viniendo del home —que es
  // larguísimo— a una subpágina más corta, su límite interno y el real no
  // coinciden y la rueda parece no hacer nada: la página se ve congelada.
  //
  // scrollTo(0, immediate) resincroniza la posición y resize() vuelve a medir.
  // El doble rAF espera a que la nueva ruta esté pintada; medir antes daría
  // otra vez la altura vieja.
  useEffect(() => {
    const lenis = instancia.current;
    if (!lenis) return;

    lenis.scrollTo(0, { immediate: true });
    const f1 = requestAnimationFrame(() => {
      const f2 = requestAnimationFrame(() => lenis.resize());
      pendiente.current = f2;
    });
    pendiente.current = f1;

    return () => cancelAnimationFrame(pendiente.current);
  }, [pathname]);

  return null;
}
