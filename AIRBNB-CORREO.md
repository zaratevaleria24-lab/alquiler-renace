# Airbnb por correo: el buzón como fuente de eventos

Airbnb no da API a anfitriones individuales. Lo que sí da, y en segundos, es un
**correo por cada cosa que pasa** en la cuenta. Ese buzón es un flujo de eventos
completo: reservas, cancelaciones, cambios, mensajes, evaluaciones, pagos. La
idea (del dueño, 2026-09-13) es engancharlo para disparar acciones y llenar
datos, con el iCal como fuente de verdad de las fechas.

## Qué manda Airbnb y qué se puede hacer con cada correo

| Correo de Airbnb | Datos que trae | Acción automática |
|---|---|---|
| Reserva confirmada | Apartamento, nombre del huésped, llegada, salida, huéspedes, código HM…, pago | Bloquear noches al instante (`reservas`, origen `airbnb-correo`, con el código) · forzar sync iCal del apartamento · crear contacto en CRM (tipo huésped, comercio «Airbnb») · programar bienvenida QR |
| Solicitud de reserva (sin Reserva Inmediata) | Igual, estado pendiente | Bloqueo provisional 24 h · aviso por WhatsApp al dueño |
| Cancelación | Código HM… | Liberar las noches · marcar contacto · forzar sync |
| Cambio de reserva | Fechas nuevas | Actualizar la reserva por código |
| Recordatorio «llega mañana» | Nombre, apartamento | Enviar guía + QR del apartamento (`/guia?apto=`) por WhatsApp o correo |
| Evaluación recibida | Texto real de la reseña, estrellas | Guardarla en `resenas` como borrador para que el dueño la apruebe (reseña real, no inventada) |
| Nuevo mensaje | Nombre, primeras líneas | Aviso al dueño; nada automático hacia el huésped |
| Pago enviado | Monto, fecha, reserva | Registro de ingresos por apartamento (finanzas) |

Regla: **el correo dispara, el iCal confirma.** Si el parser falla, el correo
igual fuerza la sincronización iCal y las fechas quedan bloqueadas en minutos.

## Cómo llega el correo al servidor

1. Las notificaciones de Airbnb llegan hoy al Gmail del dueño (por confirmar).
2. Un filtro de Gmail («de: automated@airbnb.com O express@airbnb.com») reenvía
   a `airbnb@margaritarenace.com.ve`. Gmail pide verificar esa dirección una vez.
3. Cloudflare Email Routing (ya recibe el correo del dominio) manda esa
   dirección a un **Email Worker**.
4. El worker comprueba remitente y firma DKIM de Airbnb, y hace POST del
   correo crudo a `https://margaritarenace.com.ve/api/airbnb/correo` con un
   secreto compartido (custodiado en `/etc/margarita-renace/`).
5. La ruta guarda el correo crudo en `airbnb_eventos` (siempre, aunque no lo
   entienda), lo clasifica, extrae campos y ejecuta la acción.

Alternativas descartadas: IMAP al Gmail cada minuto (mete credenciales de la
cuenta personal en el servidor) y cambiar el correo de la cuenta de Airbnb a
uno del dominio (es también el correo de acceso; riesgo innecesario).

## Cómo se casan correo e iCal (congruencia)

- El iCal de Airbnb trae en cada evento la URL de la reserva con el código
  HM…; el correo trae el mismo código. Se deduplica por código, nunca por fechas.
- Sync iCal de fondo cada 10 min (cron) además del sync a demanda actual (1 h).
- Reconciliación diaria: noches que Airbnb tiene tomadas y el sitio no, o al
  revés, generan un aviso al dueño. El panel muestra «calendario actualizado
  hace N min» por apartamento.
- Del panel hacia Airbnb sigue siendo lento (Airbnb importa cada varias horas).
  Reserva directa confirmada → registrar en el panel al momento, y para lo
  urgente bloquear a mano en Airbnb.

## Qué ve el visitante (la parte de «disponible de verdad»)

- Calendario de dos meses en el modal y en la ficha, días tomados tachados (hecho).
- Buscar por fechas en la portada: solo aparecen los apartamentos libres.
- Etiquetas honestas en las tarjetas: «Libre este fin de semana», «Próxima
  fecha libre: 3 de octubre». Nada de «quedan 2» inventados.
- «Disponibilidad al día · hace N min» junto al calendario, con la hora real.
- Fechas en el mensaje de WhatsApp (hecho) y precongelar el contrato con ellas.

## Pasos y orden propuesto

1. Dueño: pegar los 4 iCal de Airbnb en el panel e importar los 4 nuestros en Airbnb.
2. Cron de sync cada 10 min + indicador «actualizado hace N min».
3. Dirección `airbnb@`, worker de Cloudflare, ruta `/api/airbnb/correo`, tabla
   `airbnb_eventos`. Primer parser: reserva confirmada y cancelación.
4. Reenvío desde Gmail y prueba con una reserva real de prueba.
5. Después: CRM automático, reseñas como borrador, bienvenida QR, pagos.

## Riesgos que no se pueden ignorar

- Airbnb cambia el formato de sus correos sin avisar: por eso se guarda el
  crudo, se parsea con reglas simples y cualquier fallo cae al sync iCal.
- Los correos no traen el correo ni el teléfono del huésped: el contacto CRM
  nace solo con nombre y fechas; el resto lo completa el dueño al hablar.
- Un correo reenviado por Gmail conserva las cabeceras originales en el
  cuerpo, pero la firma DKIM del reenvío es de Google: la verificación debe
  mirar el mensaje original adjunto, no el sobre externo.
