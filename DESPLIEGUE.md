# Despliegue — Margarita Renace

Notas de **este servidor** (Hetzner). Para el código y las convenciones de
diseño del proyecto, ver `CLAUDE.md`. Mapa general del servidor:
`/root/proyectos/README.md`.

Desplegado el 2026-07-25. Antes de esa fecha este directorio solo tenía un
checklist de convenciones; el código vino del repo
`zaratevaleria24-lab/alquiler-renace`.

## En una línea

Next.js 15 (App Router, todo estático) → PM2 `margarita-renace` en
`127.0.0.1:3002` → nginx con TLS → Cloudflare → https://margaritarenace.com.ve

## Recursos

| Qué | Valor |
|---|---|
| Directorio | `/root/proyectos/margarita-renace/` |
| Proceso PM2 | `margarita-renace` (`ecosystem.config.cjs`) |
| Puerto | 3002, bind a `127.0.0.1` |
| Dominio | `margaritarenace.com.ve` (+ `www` → 301 al apex) |
| nginx | `/etc/nginx/sites-available/margarita-renace` |
| TLS | Let's Encrypt (apex + www), renovación automática de certbot |
| Logs | `/var/log/nginx/margarita-access.log`, `margarita-error.log` |
| Datos | **ninguno** — sin BD, sin backend, sin persistencia |

Sin script de backup a propósito: los listados son un array hardcodeado en
`app/page.tsx` y no hay nada que se guarde. El día que aparezca una BD hay que
crear `/root/backups/backup-margarita-renace.sh` y sumarlo al crontab de root.

## Desplegar un cambio

```bash
cd /root/proyectos/margarita-renace
git pull
nice -n 15 npm run build        # nice: 3.7GB de RAM compartidos con producción
pm2 restart margarita-renace
curl -sI https://margaritarenace.com.ve | head -1
```

No hace falta copiar nada a `/var/www/`: nginx proxea a Next, que sirve `.next/`
y `public/` por su cuenta. Si algún día hay `.env`, ojo: `pm2 restart` NO relee
el entorno — hay que `pm2 delete margarita-renace && pm2 start
ecosystem.config.cjs --only margarita-renace`.

El `ecosystem.config.cjs` invoca el binario de `next` directamente en vez de
`npm run start`: por npm, `next start` ignora la variable `HOSTNAME` y abre en
`*:3002` (todas las interfaces). Con `-H 127.0.0.1` el bind a loopback es
explícito y verificable con `ss -tlnp | grep 3002`.

## Tres cosas que no son obvias

### 1. Cloudflare está en modo SSL "Full", no "Full (strict)"

El dominio está detrás del proxy de Cloudflare (nube naranja, NS `penny` y
`stanley.ns.cloudflare.com`). CF se conecta al origen **por el 443** y acepta
cualquier certificado. Consecuencias:

- Los desafíos ACME llegan por 443, no por 80. Por eso `/.well-known/acme-challenge/`
  está en los dos bloques del vhost, y también en el catch-all
  (`000-catch-all`) — eso último es lo que permitió emitir el primer
  certificado antes de que este vhost existiera.
- El tráfico llega con IPs de Cloudflare. El vhost trae un bloque `real_ip` con
  los rangos de CF y `real_ip_header CF-Connecting-IP` para que los logs
  muestren visitantes reales. **Si los logs vuelven a mostrar IPs de CF,
  refrescar los rangos** desde `cloudflare.com/ips-v4` y `ips-v6`.
- Pasar CF a "Full (strict)" ahora es seguro y recomendable: el origen ya tiene
  certificado válido de Let's Encrypt.

### 2. Nada de CDNs externos: Venezuela los bloquea

El público del sitio está en Venezuela, donde los CDNs externos están
bloqueados. Un recurso servido desde `unsplash.com`, `unpkg`, Google Fonts, etc.
simplemente **no carga** para el usuario final.

- Las 26 fotos de propiedades y avatares vivían en `images.unsplash.com`. El
  2026-07-25 se descargaron a `public/images/` y se reescribieron las 56
  referencias de `app/page.tsx` a rutas locales. **Al agregar listados nuevos,
  la foto va a `public/`, nunca a una URL externa.**
- Las tipografías (Fraunces, Jost) usan `next/font/google`, que las descarga
  **en build** y las autohospeda. Eso sí es seguro: no es CDN en runtime.
- `next.config.ts` todavía tiene `images.remotePatterns` apuntando a
  `picsum.photos`, herencia del scaffold de AI Studio. No se usa en el código.

### 3. Dos fotos estaban rotas de origen

`photo-1525113990974` (foto principal de "Villa Playa Caribe") y
`photo-1489980508314` (avatar de la anfitriona Gabriela Rojas) daban **404 en
Unsplash** — las borraron de allá, así que ya se veían rotas en el sitio, incluso
fuera de Venezuela. Al autohospedar se sustituyeron por fotos vivas del mismo
set: la Villa quedó con otra foto de su propia galería, y el avatar con uno
reutilizado de otro anfitrión.

**Las dos son relleno pendiente de reemplazo por material real.** Ya hay una
foto real en `public/properties/los-geranios-a/`, así que la dirección es esa.

## Pendientes conocidos

- Todo el producto vive en un solo componente cliente de ~1500 líneas
  (`app/page.tsx`), con los listados hardcodeados. Sin BD ni API.
- Los autos no están modelados: el tipo `Property` es solo de apartamentos.
- El panel de administración planeado va en un subdominio aparte. Cuando exista
  necesita su propio vhost; si no, cae en el catch-all y no responde.
- `firebase-tools` sigue en devDependencies y pide Node ≥ 22 (acá hay Node 20).
  No afecta build ni runtime; se puede quitar.
- `CLAUDE.md` dice que las fuentes son `Cormorant_Garamond`, pero
  `app/layout.tsx` carga `Fraunces`. La doc del repo quedó desactualizada ahí.
