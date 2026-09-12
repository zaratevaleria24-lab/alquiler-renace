# Calendario y sincronización con Airbnb

Añadido el 2026-08-04. Una sola fuente de verdad para las noches ocupadas:
lo que se registra en el panel y lo que se reserva en Airbnb terminan en la
tabla `reservas`, y de ahí salen el multicalendario del panel y el calendario
de disponibilidad de cada página de propiedad.

## Las piezas

| Pieza | Archivo | Qué hace |
|---|---|---|
| Migración | `db/migrations/008-calendario.sql` | Tablas `reservas` e `ical_feeds`, columna `properties.ical_token` |
| iCal | `lib/ical.ts` | Parser y generador RFC 5545 mínimo, sin dependencias |
| Lógica | `lib/calendario.ts` | Sync a demanda (caché 60 min, patrón de `lib/tasas.ts`), consultas, resumen del mes |
| Panel | `app/admin/(panel)/calendario/` | Multicalendario (filas = propiedades, columnas = noches), CRUD de reservas y bloqueos, gestión de feeds |
| API pública | `app/api/disponibilidad/[slug]` | Rangos ocupados fusionados, sin datos de huéspedes |
| API export | `app/api/ical/[token]` | El .ics de reservas manuales que Airbnb importa |
| Widget | `components/CalendarioDisponibilidad.tsx` | Calendario de la página de propiedad, integrado en `ReservaPanel` |

No hay demonio ni cron: los feeds se refrescan al abrir el calendario del
panel o al consultar disponibilidad pública, solo si llevan más de una hora
sin refrescar. El botón «Sincronizar ahora» del panel fuerza todos.

## Conectar una propiedad con Airbnb (pasos para la dueña)

La conexión son **dos URLs**, una en cada dirección. Todo se hace desde
`/admin/calendario`, sección «Sincronización con Airbnb».

1. **Traer Airbnb al panel.** En Airbnb: Calendario → Disponibilidad →
   Conectar otro calendario → **Exportar calendario**. Airbnb muestra una URL
   `https://www.airbnb.com/calendar/ical/…ics`; se pega en el campo
   «Conectar» de la propiedad. Las reservas de Airbnb aparecen al instante
   (el primer sync es inmediato) y de ahí en adelante se refrescan solas.

2. **Llevar el panel a Airbnb.** Debajo del mismo bloque está la URL de
   exportación de la propiedad (`/api/ical/<token>`). En Airbnb: Calendario →
   Disponibilidad → Conectar otro calendario → **Importar calendario**, pegar
   esa URL y darle un nombre («Margarita Renace»). Desde entonces, toda
   reserva o cierre registrado en el panel le bloquea las fechas a Airbnb.

Ojo: Airbnb refresca los calendarios importados **cada varias horas**, no al
minuto. Para lo urgente (una reserva de hoy para hoy) conviene además cerrar
las fechas a mano en Airbnb.

Booking u otro canal que hable iCal se conecta exactamente igual: el selector
de la izquierda del campo «Conectar» solo cambia la etiqueta.

## Decisiones que conviene no olvidar

- **check_out es exclusivo** (convención iCal/hotelera): la noche de la
  salida ya está libre y el día de salida de uno puede ser el de llegada de
  otro. Todos los solapes se comparan como `[check_in, check_out)`.
- **Fechas como texto `YYYY-MM-DD` de punta a punta.** node-postgres convierte
  `date` a `Date` en la zona del servidor y corre los días; se selecciona con
  `to_char()` y nunca se sale del texto. «Hoy» se calcula en America/Caracas
  (`hoyCaracas()`).
- **Lo importado no se edita en el panel**: su dueño es Airbnb y el próximo
  sync lo repondría. El diálogo lo explica en vez de dejar editar en vano.
- **Las reservas manuales que chocan se rechazan** (`error=choca`): impedir el
  doble alquiler es la razón de ser del calendario. Lo importado no se valida
  contra solapes: si Airbnb y el panel se contradicen, eso tiene que VERSE en
  el multicalendario, no rechazarse en silencio.
- **El público solo ve rangos fusionados**: ni origen, ni estado, ni cuántas
  reservas son. Las tentativas también bloquean de cara al público.
- **El export lleva token secreto por propiedad** y no incluye nombres ni
  teléfonos de huéspedes. Regenerar el token (a mano en la base, de momento)
  revoca la URL.
- **Solo se muestran propiedades `is_real`** en el multicalendario; los 11
  listados de relleno no alquilan. Si ninguna está marcada real, se enseñan
  las publicadas para que la pantalla no quede vacía.
- El **ingreso estimado** del mes usa el monto pactado (`total_usd`)
  prorrateado a las noches del mes, o noches × tarifa si no se pactó. En
  propiedades con precio a consultar la tarifa es 0: registrar el monto
  pactado es lo que hace útil esa cifra.
