'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Medidor de visitas del sitio público.
//
// Avisa a /api/visita en cada carga y en cada navegación del cliente. Vive en el
// layout raíz, así que cubre el home, las zonas, las fichas y /autos sin tener
// que acordarse de ponerlo en cada página.
//
// TRES DECISIONES:
//
// 1. `keepalive` en el fetch: sin eso, el aviso se cancela si el visitante se va
//    de la página antes de que termine — justo el caso que más interesa medir.
//
// 2. Se manda DESPUÉS de la primera pintura (dentro de un efecto) y sin
//    esperarlo: medir no puede retrasar lo que el visitante ve, y en Venezuela
//    la velocidad no es un lujo.
//
// 3. Un solo aviso por ruta, con un `ref` que recuerda la última enviada. En
//    desarrollo React monta los efectos dos veces, y sin esto cada visita
//    contaría doble.

/** Aviso suelto, para los clics. Exportado para que lo usen los botones. */
export function avisar(datos: {
  path?: string;
  kind?: 'whatsapp' | 'busqueda' | 'ver_propiedad' | 'enlace';
  propertyId?: string;
  meta?: { q?: string };
}): void {
  try {
    fetch('/api/visita', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: window.location.pathname,
        // Los dos datos que solo existen en el navegador y que dicen de dónde
        // llegó la persona: los parámetros del enlace (?utm_source=ig del
        // enlace de la bio, ?desde=qr del cuadro del apartamento) y la página
        // que la trajo. El servidor no puede deducir ninguno de los dos —su
        // cabecera `Referer` apunta a esta misma página—, así que si no viajan
        // acá se pierden. Se leen de `window` y no con `useSearchParams()`: ese
        // hook obliga a envolver el árbol en Suspense y sacaría al sitio entero
        // del renderizado estático, que es lo que lo hace rápido en Venezuela.
        query: window.location.search,
        ref: document.referrer,
        ...datos,
      }),
      keepalive: true,
    }).catch(() => {
      // Que no se registre una visita no es problema del visitante.
    });
  } catch {
    /* ignorado */
  }
}

export function Medidor() {
  const pathname = usePathname();
  const ultima = useRef<string | null>(null);

  useEffect(() => {
    if (ultima.current === pathname) return;
    ultima.current = pathname;
    avisar({ path: pathname });
  }, [pathname]);

  return null;
}
