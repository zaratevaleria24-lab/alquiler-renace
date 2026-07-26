// PM2 — Margarita Renace (margaritarenace.com.ve)
//
// Se usa `next start` (no el server.js de .next/standalone) a propósito: sirve
// .next/ y public/ directamente, así un `npm run build` queda activo con un
// simple `pm2 restart margarita-renace`, sin el paso manual de copiar
// public/ y .next/static dentro de standalone en cada rebuild.
//
// Bind a 127.0.0.1: nginx hace de proxy con TLS. Nunca exponer el 3002 directo.
// Recordatorio del servidor: PM2 ignora `env_file` en silencio. Si algún día
// esta app necesita un .env, cargarlo con require('dotenv') ACÁ, y aplicar los
// cambios con `pm2 delete margarita-renace && pm2 start ecosystem.config.cjs`
// (un `pm2 restart` NO relee el entorno).

module.exports = {
  apps: [
    {
      name: 'margarita-renace',
      cwd: '/root/proyectos/margarita-renace',
      // Se invoca el binario de next directamente, no `npm run start`: con npm,
      // `next start` ignora la variable HOSTNAME y abre en *:3002 (todas las
      // interfaces). Con -H el bind a loopback es explícito y verificable.
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3002',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: '3002',
        HOSTNAME: '127.0.0.1',
      },
    },
  ],
};
