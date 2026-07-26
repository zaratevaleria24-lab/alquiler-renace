import Link from 'next/link';
import { ZONES } from '@/lib/listings';
import { HOME_FAQ } from '@/lib/faq';
import { faqSchema, graph } from '@/lib/schema';

// Secciones de contenido del home que existen por SEO y GEO.
//
// Son componentes presentacionales sin estado: no llevan 'use client' propio,
// pero al importarlos app/page.tsx (que sí es cliente) viajan en su bundle. El
// costo es de texto, y a cambio el HTML prerenderizado del home lleva:
//   - Enlaces internos a las 9 landings de zona. Sin esto serían páginas
//     huérfanas: estarían en el sitemap pero sin un solo enlace apuntándolas,
//     que es la forma más rápida de que Google las considere de bajo valor.
//   - Un bloque de preguntas frecuentes con FAQPage schema. Es la pieza que más
//     mueve la aguja en GEO: los motores generativos citan respuestas directas
//     y autocontenidas, y esto se las sirve en bandeja.

export function ZoneLinksSection() {
  return (
    <section
      aria-labelledby="zonas-de-la-isla"
      className="mt-24 border-t border-[#E6D7C2] pt-14"
    >
      <h2
        id="zonas-de-la-isla"
        className="font-serif text-2xl md:text-3xl text-[#007380] font-semibold"
      >
        Alquiler por zonas de la Isla de Margarita
      </h2>
      <p className="mt-3 max-w-2xl text-sm md:text-base text-[#1A1A1A]/75 leading-relaxed">
        Cada zona de la isla tiene su carácter: bahías de agua calma en el sur,
        olas en la costa atlántica, viento constante en El Yaque y atardeceres en
        Juan Griego. Elige la que encaja con tu viaje.
      </p>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ZONES.map((zone) => (
          <li key={zone.slug}>
            <Link
              href={`/alquiler/${zone.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-[#E6D7C2] bg-white/70 p-5 backdrop-blur-sm transition-all hover:border-[#007380]/40 hover:shadow-md"
            >
              <span className="font-serif text-lg text-[#007380] font-semibold group-hover:underline">
                Alquiler en {zone.name}
              </span>
              <span className="mt-2 text-xs text-[#1A1A1A]/60">
                {zone.properties.length}{' '}
                {zone.properties.length === 1
                  ? 'alojamiento'
                  : 'alojamientos'}
                {zone.minPrice !== null && ` · desde US$${zone.minPrice}/noche`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function FaqSection() {
  return (
    <section
      aria-labelledby="preguntas-frecuentes"
      className="mt-24 border-t border-[#E6D7C2] pt-14"
    >
      {/* FAQPage schema: habilita el rich result de preguntas en Google y le da
          a los motores de IA texto ya estructurado en pares pregunta/respuesta. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: graph(faqSchema(HOME_FAQ)) }}
      />

      <h2
        id="preguntas-frecuentes"
        className="font-serif text-2xl md:text-3xl text-[#007380] font-semibold"
      >
        Preguntas frecuentes sobre alquilar en Isla de Margarita
      </h2>

      {/* <details> nativo en vez de acordeón con JavaScript: el contenido está
          en el HTML aunque no se haya hidratado nada, así que los crawlers lo
          leen completo y no cuesta ni un byte de JS. */}
      <div className="mt-8 divide-y divide-[#E6D7C2] border-y border-[#E6D7C2]">
        {HOME_FAQ.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer items-start justify-between gap-4 text-left font-medium text-[#1A1A1A] marker:content-none">
              <h3 className="text-base md:text-lg">{item.q}</h3>
              <span
                aria-hidden="true"
                className="mt-1 shrink-0 text-[#007380] transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 pr-8 text-sm md:text-base leading-relaxed text-[#1A1A1A]/80">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

/**
 * Bloque de texto con contexto real del destino. Google y los motores de IA
 * premian páginas que dicen algo sobre el lugar, no solo que listan inventario.
 */
export function AboutIslandSection() {
  return (
    <section
      aria-labelledby="sobre-la-isla"
      className="mt-24 border-t border-[#E6D7C2] pt-14 pb-8"
    >
      <h2
        id="sobre-la-isla"
        className="font-serif text-2xl md:text-3xl text-[#007380] font-semibold"
      >
        Alquilar apartamento en Isla de Margarita
      </h2>
      <div className="mt-5 grid gap-6 md:grid-cols-2 text-sm md:text-base leading-relaxed text-[#1A1A1A]/80">
        <div className="space-y-4">
          <p>
            La Isla de Margarita es la principal del estado Nueva Esparta, en el
            Caribe venezolano. Tiene más de 50 playas repartidas entre dos
            costas de carácter muy distinto: el sur y el este, con bahías
            protegidas y aguas calmas como Pampatar y Manzanillo, y la costa
            atlántica, con oleaje fuerte y playas de surf como Parguito.
          </p>
          <p>
            Alquilar un apartamento en vez de tomar un hotel tiene sentido en
            Margarita por dos razones concretas: las estadías tienden a ser
            largas y la cocina propia pesa mucho en el presupuesto de un viaje
            familiar. La mayoría de las urbanizaciones residenciales de la isla
            incluyen piscina, estacionamiento y vigilancia.
          </p>
        </div>
        <div className="space-y-4">
          <p>
            Se llega por aire al Aeropuerto Internacional Santiago Mariño, en el
            sur de la isla cerca de El Yaque, o por ferry desde Puerto La Cruz y
            Cumaná. Desde el aeropuerto, Porlamar y Costa Azul quedan a unos 20
            minutos y las playas del norte a unos 45.
          </p>
          <p>
            El clima es cálido y estable todo el año, entre 27 y 31 °C, sin
            estaciones marcadas. La temporada alta coincide con Navidad,
            Carnaval, Semana Santa y julio-agosto; el resto del año hay mejores
            tarifas y playas más vacías.
          </p>
        </div>
      </div>
    </section>
  );
}
