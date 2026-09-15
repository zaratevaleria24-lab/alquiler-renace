'use client';

import { ArrowLeft } from 'lucide-react';

import { puedeVolverAtras } from '@/lib/atras';

// Botón de volver de la ficha de un lugar.
//
// EL PROBLEMA: entrar a un lugar desde la guía era un callejón. Arriba solo
// había una miga de pan en gris de 13 px —«Guía / Agua y gas»— que ni parece
// un botón ni se acierta con el pulgar, y la barra fija de abajo solo ofrecía
// «Ir». Quien entraba a mirar un sitio y quería seguir viendo la lista tenía
// que usar el botón del navegador, que en el teléfono queda lejos del pulgar,
// y a veces ni existe (una guía abierta desde el QR o desde Instagram se abre
// dentro de la app, sin barra de navegación).
//
// DOS CASOS Y UNA SOLA PIEZA:
//
//   · Llegó navegando por el sitio → `history.back()`. Vuelve EXACTAMENTE a
//     donde estaba: su posición en la lista, su filtro, su búsqueda. Llevarlo
//     al índice de la categoría le borraría todo eso.
//   · Llegó de fuera (QR, Instagram, Google, enlace compartido) → no hay a qué
//     volver, así que el enlace lleva al índice de su categoría, que es el
//     sitio con más probabilidad de interesarle.
//
// Se distingue mirando si la página anterior era de este mismo dominio. Sin
// JavaScript es un enlace normal al índice: nunca deja de funcionar.

export default function VolverGuia({
  href,
  texto,
}: {
  href: string;
  texto: string;
}) {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (puedeVolverAtras()) {
          e.preventDefault();
          window.history.back();
        }
      }}
      className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-control px-2 text-ui font-medium text-brand-deep transition-colors hover:bg-white/70"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      Volver a {texto}
    </a>
  );
}
