# Contratos de hospedaje (2026-09-13)

El dueño pidió «un formato de contrato con cláusulas que el cliente firme, enviado
desde el correo corporativo». Está hecho sin servicios de terceros: el contrato
se genera en el sitio, el huésped lo firma en un enlace privado desde el teléfono
y queda constancia. Panel: **/admin/contratos**.

## Piezas

| Pieza | Archivo |
|---|---|
| Migración | `db/migrations/015-contratos.sql` (tabla `contratos`) |
| Cláusulas (14 + particulares), con VERSION | `lib/contratos-clausulas.ts` — seguro para cliente, solo texto |
| Consultas, token, firma, hash | `lib/contratos.ts` |
| Correo saliente (nodemailer) | `lib/correo.ts` — lee `/etc/margarita-renace/correo.env` |
| Documento (cabecera, cláusulas, firmas) | `components/ContratoDocumento.tsx` |
| Página pública de firma | `app/contrato/[token]/` (page, FirmaContrato canvas, actions) |
| Panel: lista, alta, datos legales | `app/admin/(panel)/contratos/` |
| Ficha: enviar, WhatsApp, copiar, anular, imprimir | `app/admin/(panel)/contratos/[id]/` |
| Datos legales del arrendador | claves `razon_social`, `rif`, `representante`, `representante_cedula`, `domicilio_fiscal`, `correo_corporativo`, `contrato_checkin`, `contrato_checkout`, `contrato_deposito` en `site_settings` (pantalla `contratos`) |

## Flujo

1. En el panel: inmueble, huésped, cédula (opcional), correo o WhatsApp, fechas,
   total, anticipo, depósito, condiciones particulares → **Crear**.
2. Ficha del contrato: **Enviar por correo** (si hay SMTP y correo), **Mandar por
   WhatsApp** (abre wa.me con el enlace), o **Copiar** el enlace.
3. El huésped abre `/contrato/<token>` (token de 32 hex, única llave; `noindex`,
   sin barra ni pie), lee, escribe nombre y documento, **firma con el dedo** en un
   lienzo, marca «leí y acepto» y firma. Se guarda: nombre, documento, PNG de la
   firma, fecha/hora, User-Agent (no IP) y `firma_hash` = sha256(texto completo +
   fecha + token). El estado pasa a `firmado` y ya no se puede modificar ni anular.
4. Si hay SMTP, sale copia al correo corporativo y al huésped. La página firmada
   sirve de copia: «Imprimir» → PDF del navegador (CSS de impresión, A4).

## Correo saliente — PENDIENTE DE CONFIGURAR

Crear `/etc/margarita-renace/correo.env` (chmod 600) con:

```
SMTP_HOST=smtp.ejemplo.com
SMTP_PORT=587
SMTP_USER=hola@margaritarenace.com.ve
SMTP_PASS=********
CORREO_DESDE="Margarita Renace <hola@margaritarenace.com.ve>"
```

y reiniciar (`pm2 restart margarita-renace`). Google Workspace: smtp.gmail.com:587
con contraseña de aplicación. Zoho: smtp.zoho.com:587. cPanel: mail.dominio:465.
Sin el archivo, el panel avisa y ofrece WhatsApp/enlace: nunca se bloquea.

## Reglas

- Las cláusulas se cambian en el código y se sube `VERSION`; un contrato firmado
  conserva su versión y su hash. **Que un abogado revise las cláusulas** antes del
  primer contrato real (política de cancelación 7 d / 48 h, depósito, jurisdicción
  Porlamar, firma electrónica según el Decreto-Ley de Mensajes de Datos).
- Voz de IDENTIDAD.md (tú, corto). Montos en US$; bolívares a tasa USDT del día
  de pago (cláusula tercera), igual que el resto del sitio.
- El token es la llave: no se muestra en listados públicos ni se indexa.
