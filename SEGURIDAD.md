# Seguridad — auditoría y estado (2026-09-13)

Revisión a fondo pedida por el dueño («todo tiene que estar protegido con las
mejores prácticas»). Qué se revisó, qué estaba bien, qué se corrigió y qué queda.

## Bien desde antes
- **Postgres** en Docker escuchando solo en `127.0.0.1:5434`; contraseña de 32
  caracteres; sin SSL porque nunca sale de la máquina.
- **Contraseñas del panel** con scrypt (memory-hard, OWASP) + sal aleatoria +
  comparación en tiempo constante; **bloqueo tras 8 intentos / 15 min**
  (`login_attempts`).
- **Cookie de sesión** `httpOnly`, `secure`, `sameSite=lax`.
- **Consultas** siempre parametrizadas (`$1…`), nunca concatenadas.
- **Subidas**: tamaño máximo, decodificación con sharp (si no es imagen, se
  rechaza), nombre y carpeta saneados (sin path traversal).
- **Secretos fuera del repo** en `/etc/margarita-renace/*.env` (chmod 600).
- **nginx**: HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy;
  panel con cabeceras estrictas y `noindex`; bloqueo de rutas de escáner (444).
- **fail2ban** (sshd, nginx-*, recidive) + **ufw**; solo 22/80/443 públicos (y el
  proxy personal del dueño en 8388, ver memoria).
- **Backups** diarios locales (`/root/backups/backup-margarita.sh`, 03:45).
- Panel en subdominio propio; `/admin` en el dominio público da 404.

## Corregido hoy
1. **Rol de base de datos con mínimo privilegio.** La app usaba `margarita`, que
   es SUPERUSER (usuario bootstrap del contenedor; no se puede degradar). Se creó
   `margarita_app` (solo SELECT/INSERT/UPDATE/DELETE + secuencias, con
   privilegios por defecto para tablas futuras) y `.env` apunta a él. `margarita`
   queda solo para migraciones (`docker exec … psql -U margarita`). Copia del
   `.env` anterior en `/root/backups/margarita/.env.bak-*`.
2. **JSON-LD escapado** (`lib/schema.ts`): `<` → `<`, así un nombre o
   descripción con `</script>` no puede inyectar HTML en las páginas públicas.
3. **Códigos OTP de contratos con freno**: máximo 5 envíos/hora y 60 s entre
   envíos por contrato; 10 códigos fallidos/hora bloquean el intento. Evita que
   alguien con el enlace use nuestro Resend para bombardear al huésped o adivine
   el código.
4. **fail2ban `nginx-bad-request`**: el dueño quedó BANEADO (186.167.174.159) por
   5 respuestas 400 en `/_next/static` durante un despliegue (chunks viejos).
   Desbaneado; `maxretry` 5 → 30 en 10 min. Los 400 de chunks viejos durante un
   build son normales.

## Pendiente (decisión del dueño / próximos pasos)
- **Copias fuera del servidor** (R2 es ideal: `backup-margarita.sh` → bucket).
  Hoy si se pierde el VPS se pierden los backups.
- **CSP** (Content-Security-Policy): Next usa scripts en línea; requiere nonce
  por petición. Mejora real contra XSS, trabajo medio.
- **2FA en el panel** (TOTP con app de autenticación). Trabajo bajo-medio.
- **Rotación**: el dueño pidió NO rotar claves; se custodian. Si alguna se filtra,
  rotar esa sola (Resend, Apify, Google, R2) y `pm2 restart`.
- **Actualizaciones**: imagen de Postgres y paquetes npm (`npm audit`) cada mes.
- Contratos: la IP del firmante se guarda a propósito como prueba (cláusula 12
  lo informa). El resto del sitio sigue sin guardar IPs.


## Acceso al panel por código (2026-09-13, a pedido del dueño)

El login pide UN código (`PANEL_CODIGO` en `/etc/margarita-renace/panel.env`,
hoy **1234**, «por ahora»). Entra como la primera cuenta creada. Protecciones:
comparación en tiempo constante; 8 fallos por IP / 15 min (login_attempts,
usuario `__codigo__`); techo global de 30 fallos / 15 min desde cualquier origen.
Para volver al usuario+contraseña basta borrar el archivo. **Un código de 4
dígitos es débil**: subirlo a 8+ dígitos o cambiarlo por 2FA cuando el dueño
lo decida (`printf 'PANEL_CODIGO=…' > /etc/margarita-renace/panel.env && pm2 restart margarita-renace`).

## Calendario: secreto compartido (2026-09-13)

`/etc/margarita-renace/calendario.env` → `CALENDARIO_SECRETO` (48 hex, 0600). Lo
usan el cron local y el Email Worker de Cloudflare para llamar a
`/api/calendario/sync` y `/api/airbnb/correo`; ambas rutas responden 404 sin
él (comparación en tiempo constante, `lib/calendario-secreto.ts`). El webhook
guarda el correo crudo (máx. 2 MB) y solo actúa sobre `reservas` con origen
`airbnb-correo`; nunca toca reservas manuales ni de iCal. El worker rechaza
remitentes que no sean de Airbnb o Google.
