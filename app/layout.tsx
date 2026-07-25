import type {Metadata} from 'next';
import { Fraunces, Jost } from 'next/font/google';
import './globals.css'; // Global styles

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
  title: 'Margarita Renace | Alquiler de Apartamentos y Autos',
  description: 'Alquila apartamentos y autos en Isla de Margarita. Reservas fáciles, propiedades verificadas y la mejor experiencia caribeña.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jost.variable}`}>
      <body className="bg-white text-[#1A1A1A] font-sans font-light antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
