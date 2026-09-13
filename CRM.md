# CRM y cupón de bienvenida (2026-09-13)

**Qué es**: un popup (`components/CuponBienvenida.tsx`) que ofrece **5 % en la
primera reserva directa + la guía de la isla** a cambio de **nombre y correo**.
Aparece una vez por navegador (localStorage `mr:cupon`), a los 6 s o al bajar un
35 %, en las páginas públicas salvo /reservas, /enlaces, /contrato y el panel.
Con Motion, en el estilo Amanecer. Honeypot contra bots.

**Por qué nombre + correo (y no teléfono)**: el correo es lo que permite email
marketing y enviar el código; el nombre personaliza. Pedir WhatsApp de entrada
baja la conversión; queda el campo `telefono` en la tabla para pedirlo después
(en /reservas o al firmar el contrato).

**Flujo**: `app/acciones/cupon.ts` → `registrarContacto` (tabla `contactos`,
migración 021: nombre, email único, teléfono, cupón único `RENACE5-XXXX`, %,
origen, página, utm_*, consentimiento, fechas de correo y uso) → correo con
Resend (`correoCupon`: código, botón a `/reservas?cupon=…`, enlace a la guía) →
la pantalla muestra el código y dos botones (calcular con descuento / abrir la guía).

**Uso del cupón**: `/reservas` lo lee de la URL o del campo «Código de descuento»,
lo valida (`validarCuponAction` → `descuentoDe`), resta el 5 % y lo incluye en
el mensaje de WhatsApp. Marcar `cupon_usado_at` cuando se confirma la reserva
(hoy manual: el dueño lo ve en el WhatsApp; pendiente automatizar al crear el
contrato).

**Panel**: /admin/contactos — lista, cifras (total, 7 días, cupones usados),
borrar, **Exportar CSV** (`/admin/contactos/csv`) para Brevo/Mailchimp o una
campaña con Resend.

**Probado** (2026-09-13): alta desde /nosotros, correo enviado, cupón aplicado en
/reservas (fila de prueba borrada).
