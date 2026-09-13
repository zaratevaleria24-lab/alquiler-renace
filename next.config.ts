import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      // El límite por defecto es 1MB: no alcanza para subir fotos desde el
      // panel. 15MB permite varias fotos de teléfono por envío; sharp las
      // reduce a WebP en el servidor, así que a disco llega mucho menos.
      bodySizeLimit: '15mb',
    },
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  // La página de la bio se llama /enlaces —el sitio está en español— pero
  // «linktree» y «links» es como la nombra todo el mundo, y una dirección que
  // se dicta por teléfono o se teclea de memoria no puede fallar por eso.
  async redirects() {
    return [
      // 2026-09-12: «Apartamento Costa Azul» pasó a llamarse «Bahía Mágica». La
      // URL vieja está en Google y en enlaces compartidos: 301 a la nueva.
      { source: '/propiedad/apartamento-costa-azul', destination: '/propiedad/bahia-magica', permanent: true },
      { source: '/propiedad/loft-playa-el-yaque', destination: '/propiedad/los-geranios-lujo', permanent: true },
      { source: '/propiedad/penthouse-porlamar-centro', destination: '/propiedad/agua-mar', permanent: true },
      { source: '/links', destination: '/enlaces', permanent: true },
      { source: '/linktree', destination: '/enlaces', permanent: true },
      { source: '/bio', destination: '/enlaces', permanent: true },
    ];
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
