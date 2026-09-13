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

## Correo saliente — Resend (CONFIGURADO 2026-09-13; prueba enviada OK)

El dominio ya está verificado en Resend: en Cloudflare existen `resend._domainkey`
(DKIM), `send.margaritarenace.com.ve` MX → amazonses y su SPF. La recepción es
Cloudflare Email Routing (MX route*.mx.cloudflare.net) → Gmail del dueño: Resend
solo envía; las respuestas llegan por Email Routing. Desde el VPS el SMTP saliente
(465/587) está bloqueado; la API HTTPS de Resend sí sale (probado: 401 sin clave).

Crear `/etc/margarita-renace/correo.env` (chmod 600):

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
CORREO_DESDE="Margarita Renace <reservas@margaritarenace.com.ve>"
CORREO_RESPONDER_A=reservas@margaritarenace.com.ve
```

y `pm2 restart margarita-renace`. La clave se crea en resend.com → API Keys
(permiso «Sending access», dominio margaritarenace.com.ve). El remitente puede
ser cualquier @margaritarenace.com.ve; conviene que exista como regla de Email
Routing para recibir respuestas. Sin el archivo, el panel avisa y ofrece
WhatsApp/enlace.

## Reglas

- Las cláusulas se cambian en el código y se sube `VERSION`; un contrato firmado
  conserva su versión y su hash. **Que un abogado revise las cláusulas** antes del
  primer contrato real (política de cancelación 7 d / 48 h, depósito, jurisdicción
  Porlamar, firma electrónica según el Decreto-Ley de Mensajes de Datos).
- Voz de IDENTIDAD.md (tú, corto). Montos en US$; bolívares a tasa USDT del día
  de pago (cláusula tercera), igual que el resto del sitio.
- El token es la llave: no se muestra en listados públicos ni se indexa.


## Nivel 2 (2026-09-13, noche): prueba para peritaje, OTP, correo con marca

- **Migración 016**: integrantes (jsonb), tarifa por noche, limpieza, tasa de
  referencia USDT congelada al crear (Binance P2P), método de pago, `doc_hash`,
  código OTP (hash), `evidencia` (IP, agente, idioma, zona horaria, pantalla,
  SHA-256 de la imagen y del texto), `sello` Ed25519 + `sello_clave`; tabla
  `contratos_eventos` (bitácora: creado, enviado_*, abierto, codigo_*, firmado,
  copia_enviada, anulado).
- **Flujo del huésped**: abre el enlace (se registra la apertura) → si hay correo,
  pide el **código de 6 dígitos** (Resend, vence en 15 min) → nombre, documento,
  firma a mano (dedo o ratón) → acepta. El servidor guarda la evidencia, calcula
  `firma_hash = sha256(texto ⏎ hora ⏎ token ⏎ sha256(imagen))` y lo **sella** con la
  clave Ed25519 de `/etc/margarita-renace/firma.key` (pública en `firma.pub`,
  guardada también en el contrato). Sin correo (solo WhatsApp) no hay OTP y así
  consta en el certificado.
- **/contrato/<token>/verificar**: recalcula huellas, comprueba el sello, muestra
  datos técnicos y bitácora. Es lo que se le da a un perito o abogado.
- **Cláusulas v2026-09-13.2**: ocupación indebida (doble tarifa por día), detalle
  tarifa×noches+limpieza con equivalente en Bs, integrantes con documento, prueba
  electrónica (Decreto-Ley 1.204, GO 37.148; art. 1.363 CC). Se tomó como base el
  contrato anterior de «Alquileres Margarita» (Valeria Zarate) y se amplió.
- **Correos con marca** (`lib/correo-plantillas.ts`): invitación, código y copia
  firmada; logo PNG en `public/correo-logo.png`, CSS en línea, texto plano al lado.
  Remitente «Valeria de Margarita Renace <reservas@…>».
- **Gmail «Promociones»**: es clasificación de Gmail, no spam. Para que caigan en
  Principal: (1) el dueño arrastra uno a Principal y responde «Sí» a «hacer esto
  siempre»; (2) agregar **DMARC** en Cloudflare: `_dmarc` TXT
  `v=DMARC1; p=quarantine; rua=mailto:reservas@margaritarenace.com.ve`
  (hoy no existe); (3) remitente con nombre de persona, asunto con datos concretos
  y poco HTML — ya aplicado. La reputación mejora con los envíos reales.


## Nivel 3 (2026-09-13): prueba de tiempo independiente

- **Sello RFC 3161** (`lib/sellado-tiempo.ts`): sobre `firma_hash`, pedido a
  DigiCert (respaldo Sectigo, FreeTSA) con `openssl ts`. Se guarda el .tsr
  (base64) y se verifica en /verificar contra la raíz del sistema
  (`/etc/ssl/certs/ca-certificates.crt`). Es el mismo estándar de DocuSign/Adobe.
- **Anclaje en Bitcoin** con OpenTimestamps (`ots`, instalado con pip). La prueba
  nace «pendiente» y `actualizarOts` la mejora (máx. una vez por hora, al abrir
  /verificar) hasta «anclado» cuando el calendario la mete en un bloque.
- Descargas para peritaje en `/contrato/<token>/prueba?tipo=hash|tsr|ots|firma`,
  con los comandos de verificación impresos en /verificar.
- Migración 017. Eventos nuevos: sello_tiempo, bitcoin_pendiente, bitcoin_anclado.
- **Marco legal (honesto):** en Venezuela la «firma electrónica certificada» solo
  la emite un Proveedor de Servicios de Certificación acreditado por SUSCERTE
  (p. ej. PROCERT). La nuestra es firma electrónica con prueba reforzada (OTP al
  correo, evidencia del dispositivo, hash, sello Ed25519 propio, sello de tiempo
  de autoridad externa y anclaje Bitcoin): tiene valor probatorio conforme al
  Decreto-Ley 1.204 (arts. 4, 6, 16) y el art. 1.363 CC, y un perito puede
  verificarla sin confiar en nosotros. Si un día se quiere certificada, se
  integra un PSC; el resto queda igual.
