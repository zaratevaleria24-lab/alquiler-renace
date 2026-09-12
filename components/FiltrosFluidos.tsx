'use client';

import { useEffect, useRef, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Hace que los filtros de /en-venta se apliquen SOLOS al cambiar cualquier
// control, sin recargar la página: navegación de cliente (solo viaja el
// contenido nuevo, no el HTML entero), sin mover el scroll y con el panel
// quieto. El formulario sigue siendo GET normal: sin JavaScript, «Aplicar»
// funciona igual. Mientras llega el resultado, el listado baja un poco la
// opacidad para que se sienta la respuesta inmediata.

export default function FiltrosFluidos({ children, action }: { children: ReactNode; action: string }) {
  const router = useRouter();
  const [pendiente, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raiz = ref.current;
    if (!raiz) return;
    const alCambiar = (e: Event) => {
      const form = (e.target as HTMLElement).closest('form');
      if (!form) return;
      const q = new URLSearchParams(new FormData(form) as unknown as Record<string, string>);
      for (const [k, v] of [...q.entries()]) if (v === '') q.delete(k);
      const url = q.toString() ? `${action}?${q}` : action;
      start(() => router.replace(url, { scroll: false }));
    };
    raiz.addEventListener('change', alCambiar);
    return () => raiz.removeEventListener('change', alCambiar);
  }, [router, action]);

  useEffect(() => {
    document.getElementById('grid-venta')?.classList.toggle('opacity-60', pendiente);
    document.getElementById('grid-venta')?.classList.toggle('transition-opacity', true);
  }, [pendiente]);

  return <div ref={ref} aria-busy={pendiente}>{children}</div>;
}
