import type {Metadata} from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import './globals.css'; // Global styles
import { SITE } from '@/lib/site';
import { graph, organizationSchema, websiteSchema } from '@/lib/schema';
import { headers } from 'next/headers';
import { SiteFooter } from '@/components/SiteFooter';
import { getContacto } from '@/lib/settings';
import { SmoothScroll } from '@/components/SmoothScroll';

// Sistema de TRES tipografías con roles separados (ver REFERENCIA-DISENO.md).
// Antes eran dos: Fraunces (una serif decorativa, algo "wonky") y Jost (una sans
// geométrica). Se cambian por un trío editorial más sobrio y, sobre todo, se
// suma la CURSIVA de la serif, que es el sello visual del sistema: cada titular
// se parte en romana + cursiva dentro de la misma frase.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '600'],
  // La cursiva es imprescindible: sin ella no existe el recurso del titular
  // partido, que es de donde sale la personalidad.
  style: ['normal', 'italic'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  // Pesos 400 y 500 nada más. La referencia prohíbe 600/700 en texto corrido, y
  // con razón: el peso alto en párrafos es lo que hacía sentir la página densa.
  weight: ['400', '500'],
  display: 'swap',
});

// Monoespaciada para cifras y metadatos: precios, capacidad, fechas, coordenadas.
// Es lo que da el aire "técnico y ordenado" y, de paso, alinea los números en
// columna —una tabla de precios en sans proporcional nunca cuadra.
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  // metadataBase resuelve absolutas todas las URLs relativas de OG y canonical.
  // Sin esto Next avisa en build y las og:image salen relativas, que ningún
  // scraper de redes sociales resuelve.
  metadataBase: new URL(SITE.url),
  title: {
    default:
      'Alquiler de Apartamentos y Autos en Isla de Margarita | Margarita Renace',
    // Las páginas de zona ponen su propio título y heredan la marca.
    template: '%s | Margarita Renace',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'alquiler Isla de Margarita',
    'apartamentos Isla de Margarita',
    'alquiler de apartamentos Margarita',
    'alquiler de autos Margarita',
    'posadas Isla de Margarita',
    'vacaciones Isla de Margarita',
    'alojamiento Pampatar',
    'alquiler Porlamar',
    'apartamentos Costa Azul Margarita',
    'Playa El Yaque kitesurf',
    'Juan Griego',
    'Nueva Esparta',
    'Venezuela',
  ],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  category: 'travel',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SITE.ogLocale,
    url: SITE.url,
    siteName: SITE.name,
    title: 'Alquiler de Apartamentos y Autos en Isla de Margarita',
    description: SITE.description,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Margarita Renace — alquiler de apartamentos y autos en Isla de Margarita',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alquiler de Apartamentos y Autos en Isla de Margarita',
    description: SITE.shortDescription,
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      // Clave en un sitio de alojamientos: sin esto Google recorta las
      // miniaturas y el sitio pierde presencia en Imágenes y en Discover.
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  formatDetection: {
    telephone: true,
    address: true,
  },
  other: {
    // Meta geográficas heredadas: Google ya no las usa, pero varios
    // directorios y agregadores de viaje sí las leen. Cuestan nada.
    'geo.region': `${SITE.region.country}-${SITE.region.state}`,
    'geo.placename': `${SITE.region.island}, ${SITE.region.state}`,
    'geo.position': `${SITE.geo.lat};${SITE.geo.lng}`,
    ICBM: `${SITE.geo.lat}, ${SITE.geo.lng}`,
  },
  // Cuando tengas los códigos de Google Search Console y Bing Webmaster Tools
  // van acá, y el dominio se verifica sin tocar el DNS:
  // verification: { google: 'xxx', other: { 'msvalidate.01': 'xxx' } },
};

export default async function RootLayout({children}: {children: React.ReactNode}) {
  // El footer es del sitio PÚBLICO y se estaba colando en el panel, que vive en
  // su propio subdominio. Se decide por Host: el panel no debe mostrar las zonas
  // ni el aviso de tarifas, que son contenido de cara al visitante.
  const host = (await headers()).get('host') ?? '';
  const esPanel = host.startsWith('admin.');
  // El contacto vive en la base y se edita en /admin/contenido.
  const contacto = await getContacto();

  return (
    <html
      // es-VE en vez de es: es una señal geográfica real, no solo de idioma.
      lang={SITE.locale}
      className={`${sourceSerif.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Identidad de entidad del sitio: un solo @graph presente en todas
            las páginas. Las de zona añaden sus propios nodos. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: graph(organizationSchema(contacto), websiteSchema()),
          }}
        />
      </head>
      {/* Fondo hueso, no blanco puro: la mitad del efecto de la paleta viene de
          que las superficies sean cálidas. El teal sobre #FFF se ve barato;
          sobre arena, no. */}
      <body className="bg-paper text-ink font-sans antialiased" suppressHydrationWarning>
        {/* El scroll suave es para el sitio público; en un panel de gestión
            estorba al desplazarse por tablas largas. */}
        {!esPanel && <SmoothScroll />}
        {children}
        {/* En el layout, no en cada página: aparece igual en el home y en las
            9 landings de zona, y su enlazado interno viaja con él. */}
        {!esPanel && <SiteFooter />}
      </body>
    </html>
  );
}
