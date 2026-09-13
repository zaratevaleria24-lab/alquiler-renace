'use client';

import TarjetaGuia from '@/components/TarjetaGuia';
import { POR_PAGINA, enCategoria, type Lugar } from '@/lib/guia-comun';

// POR QUÉ CLIENTE: si las 100 tarjetas se renderizan como componentes de
// servidor, Next mete el árbol entero (HTML) DOS veces en la página: una como
// HTML y otra serializada para hidratar. La guía pesaba 1,25 MB. Como
// componente cliente el servidor sigue pintando el HTML (SEO intacto) pero al
// payload solo van los datos compactos. FiltroGuia sigue mandando sobre el DOM
// (data-cat, hidden, .paginada) exactamente igual que antes.
export default function ListaGuia({ lugares, cat }: { lugares: Lugar[]; cat: string }) {
  let n = 0;
  return (
    <ul id="grid-guia" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {lugares.map((l, k) => {
        const coincide = cat ? enCategoria(l, cat) : true;
        if (coincide) n++;
        return <TarjetaGuia key={l.id} l={l} prioridad={k < 2} oculta={!coincide} paginada={coincide && n > POR_PAGINA} />;
      })}
    </ul>
  );
}
