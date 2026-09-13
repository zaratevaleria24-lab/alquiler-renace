# CRM y cupón de bienvenida (2026-09-13)

**Qué es**: un popup (`components/CuponBienvenida.tsx`) que ofrece **10 % en la
primera reserva directa + la guía de la isla** a cambio de **nombre y correo**.
Aparece una vez por navegador (localStorage `mr:cupon`), a los 6 s o al bajar un
35 %, en las páginas públicas salvo /reservas, /enlaces, /contrato y el panel.
Con Motion, en el estilo Amanecer. Honeypot contra bots.

**Por qué nombre + correo (y no teléfono)**: el correo es lo que permite email
marketing y enviar el código; el nombre personaliza. Pedir WhatsApp de entrada
baja la conversión; queda el campo `telefono` en la tabla para pedirlo después
(en /reservas o al firmar el contrato).

**Flujo**: `app/acciones/cupon.ts` → `registrarContacto` (tabla `contactos`,
migración 021: nombre, email único, teléfono, cupón único `RENACE10-XXXX`, %,
origen, página, utm_*, consentimiento, fechas de correo y uso) → correo con
Resend (`correoCupon`: código, botón a `/reservas?cupon=…`, enlace a la guía) →
la pantalla muestra el código y dos botones (calcular con descuento / abrir la guía).

**Uso del cupón**: `/reservas` lo lee de la URL o del campo «Código de descuento»,
lo valida (`validarCuponAction` → `descuentoDe`), resta el 10 % y lo incluye en
el mensaje de WhatsApp. Marcar `cupon_usado_at` cuando se confirma la reserva
(hoy manual: el dueño lo ve en el WhatsApp; pendiente automatizar al crear el
contrato).

**Panel**: /admin/contactos — lista, cifras (total, 7 días, cupones usados),
borrar, **Exportar CSV** (`/admin/contactos/csv`) para Brevo/Mailchimp o una
campaña con Resend.

**Probado** (2026-09-13): alta desde /nosotros, correo enviado, cupón aplicado en
/reservas (fila de prueba borrada).


## Ajustes (2026-09-13, noche)
- **10 %** (antes 5): default de la tabla, códigos `RENACE10-XXXX`, correos y textos.
- **Vale para cualquier servicio** (apartamento, traslado, carro): es un código por
  correo, de un solo uso; se aplica en /reservas o dictándolo por WhatsApp.
- **Seguridad**: un cupón por correo (índice único; repetir devuelve el mismo),
  honeypot, límite en memoria 5 altas/hora por IP (hash) y 60/hora global,
  validación estricta del formato. El panel marca «usado» / «reactivar».
- **Experiencia**: el código se copia al tocarlo; debajo, los 4 apartamentos como
  chips → `/reservas?cupon=…&apto=<slug>` (apartamento preseleccionado).
- **Ratings inventados eliminados**: `properties.rating` en NULL y ya no se
  muestra en tarjetas ni en el cajón; solo la valoración real de Airbnb.
- Precio de los 4 apartamentos: **US$65/noche** (2026-09-13); textos y plantillas
  regenerados.
