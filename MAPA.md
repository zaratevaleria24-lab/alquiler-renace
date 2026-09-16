# Mapa de la isla — /mapa

Creado el 2026-09-16. Pestaña propia en la barra, con los **110 lugares de la
guía que tienen coordenadas** y los **4 apartamentos**. La guía contesta «¿qué
hay?»; el mapa contesta «¿qué tengo cerca?».

## Lo que lo hace distinto de un mapa cualquiera

**A pie desde.** Se toca un apartamento en la tira de chips y el mapa dibuja un
círculo de 1 km, filtra los puntos a los que caen dentro y lista los seis más
cercanos con su distancia («Guayoyo Gastro Bar · 250 m»). Es la pregunta real
del huésped —*¿qué tengo a la vuelta?*— y de paso enseña el barrio a quien
todavía no ha reservado. La ficha de cualquier punto muestra «A 250 m de Bahía
Mágica» mientras haya un apartamento elegido, o «de donde estás» si el visitante
compartió su ubicación.

## Por qué NO es Google Maps

El mapa anterior (`components/MapaGuia.tsx`, borrado en este commit) llevaba
desde el 15/09 desconectado: la clave de Google no autoriza este dominio y el
botón solo sabía disculparse. Además el SDK de Google cobra por carga y se
descarga de un dominio ajeno, que en Venezuela es la mitad de las veces que un
mapa no abre. Ahora **todo el mapa es nuestro**:

| Pieza | Qué es | Dónde vive |
|---|---|---|
| Teselas | Basemap de Protomaps (OpenStreetMap, ODbL), recorte de la isla y la costa firme, z0–15 | `/var/www/margarita-uploads/mapa/margarita.pmtiles` · 17 MB |
| Fuentes | Glifos de Noto Sans Regular, rangos latinos | `…/mapa/fonts/` · 76 KB en uso |
| Iconos | Sprite `light` de Protomaps | `…/mapa/sprites/v4/` |
| Motor | MapLibre GL 5 + `pmtiles`, cargados con `import()` solo en `/mapa` | `node_modules` |

Sin clave, sin cuota, sin costo por carga y sin una sola petición a un servidor
ajeno. El navegador pide el `.pmtiles` **por rangos de bytes**: ver la isla
entera cuesta ~96 KB, no 17 MB.

### Cómo se rehace el archivo de teselas

```bash
# binario único, sin dependencias: https://github.com/protomaps/go-pmtiles
pmtiles extract https://build.protomaps.com/AAAAMMDD.pmtiles margarita.pmtiles \
  --bbox=-65.40,9.90,-63.20,11.70 --maxzoom=15
cp margarita.pmtiles /var/www/margarita-uploads/mapa/
```

El recuadro llega hasta la costa de Cumaná a propósito: recortado solo a la isla,
al alejar el mapa la tierra firme aparecía como mar. Cada zoom más pesa el doble;
con z15 basta para ver calles y sobra para los rótulos.

## Las tres trampas que costaron tiempo (no repetirlas)

1. **`h-[calc(100svh-4rem)]` no es CSS válido.** En Tailwind los espacios del
   `calc()` van con guion bajo: `h-[calc(100svh_-_4rem)]`. Sin ellos la regla se
   descarta, la caja queda en 0 de alto y el mapa **no pide una sola tesela**:
   parece un fallo del protocolo pmtiles y es el alto.
2. **La hoja de MapLibre le pone `position: relative` al contenedor**, así que
   un `absolute inset-0` encima no lo estira. El div del mapa lleva su propio
   `h-full w-full`.
3. **El sprite y los glifos tienen que ser URL absolutas.** Con una ruta
   relativa MapLibre rechaza el estilo entero: «Invalid sprite URL … must be
   absolute». Se arman con `window.location.origin` en el cliente.

## MapLibre 5, no 6

Con **maplibre-gl 6.10 el mapa no carga**: el protocolo `pmtiles` resuelve el
TileJSON (se ve la petición del encabezado) y después no se pide ninguna tesela,
sin error ni excepción. Con **5.24 funciona sin tocar nada más**, así que el
paquete está fijado ahí. Si algún día se sube a 6, la prueba es mirar la red:
tienen que aparecer varias peticiones con `Range:` al `.pmtiles`, no una sola.

## Presupuesto de rendimiento

Medido en un viewport de teléfono, con todo cargado: **830 KB**, dentro del
tope de 1 MB de `PRINCIPIOS.md`. El detalle importa: los tres tipos de letra que
pide el estilo de Protomaps (Regular, Medium, Itálica) eran 228 KB de glifos, y
se fuerza **una sola familia** para todo el mapa; quedaron 76 KB. Los iconos de
los puntos se dibujan en un `<canvas>` (`pinEmoji`) y se registran con
`addImage`: 130 marcadores HTML moviéndose con el mapa es lo que hace que un
mapa se sienta lento en un teléfono.

## Datos

- `lib/mapa.ts` (servidor) arma los puntos; `lib/mapa-comun.ts` es la parte pura
  que también importa el componente cliente, igual que `guia-comun.ts`.
- Los alojamientos entran por la **migración 027**, que les agrega `latitud` y
  `longitud` **aproximadas**: el punto de la urbanización, nunca la puerta. La
  ficha lo dice. Dos apartamentos de la misma urbanización comparten coordenada
  y el mapa los separa unos metros al dibujar (`separa()`), sin tocar el dato.
- 16 lugares de la guía no tienen coordenadas y por eso no salen en el mapa
  (sí en la lista de texto de abajo). Se arreglan poniéndoles el lugar de Google
  desde `/admin/guia`.
- La caché es la etiqueta `TAG_GUIA`: al guardar algo en el panel de la guía se
  regeneran `/guia` y `/mapa`. Un cambio de precio de un apartamento entra
  cuando vence la hora.

## Ubicación del visitante

El botón «¿dónde estoy?» usa la geolocalización del navegador. La cabecera
`Permissions-Policy` la bloqueaba en todo el servidor, así que el sitio público
—y solo él— usa `snippets/security-headers-geo.conf`, idéntico al común salvo
`geolocation=(self)`. El dato se usa en el navegador y no se guarda ni se manda
a ningún lado.

## Lo que falta

- Confirmar en un teléfono de verdad: en el Chrome sin GPU del servidor se ve
  una costura vertical finita sobre la isla que puede ser del renderizador por
  software.
- Los 16 lugares sin coordenadas.
- El sprite `dark` está descargado pero no se usa: el sitio todavía no tiene
  modo oscuro.
