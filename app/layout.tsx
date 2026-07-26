import type {Metadata} from 'next';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css'; // Global styles
import { SITE } from '@/lib/site';
import { graph, organizationSchema, websiteSchema } from '@/lib/schema';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['500', '600', '700'],
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600'],
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

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      // es-VE en vez de es: es una señal geográfica real, no solo de idioma.
      lang={SITE.locale}
      className={`${fraunces.variable} ${jost.variable}`}
    >
      <head>
        {/* Identidad de entidad del sitio: un solo @graph presente en todas
            las páginas. Las de zona añaden sus propios nodos. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: graph(organizationSchema(), websiteSchema()),
          }}
        />
      </head>
      <body className="bg-white text-[#1A1A1A] font-sans font-light antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
