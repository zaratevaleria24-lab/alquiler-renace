# Referencia de diseño

Sistema aportado por la dueña el 2026-07-26 como **referencia**, no como
especificación a copiar. Ella fue explícita: *"esta página no tiene nada que ver
con alquileres y los colores tampoco, pero las tipografías, el diseño
minimalista y sus distribuciones son algo que me gustan como referencia.
Obviamente no ser radical."*

Guardado acá para que cualquier decisión visual futura se mida contra esto.

---

## Qué se adopta de la referencia

| Idea de la referencia | Cómo se aplicó acá |
|---|---|
| **Tres tipografías con roles separados** | Source Serif 4 (titulares) + Inter (texto) + JetBrains Mono (números, precios, metadatos) |
| **Titular partido en romana + CURSIVA** — "el 80% de la personalidad" | Aplicado a los titulares principales: primera mitad romana, segunda en cursiva y color de acento |
| **Tracking negativo agresivo en display** | −0.03em en el hero, −0.025em en los h2 |
| **Etiquetas al revés: +0.10em y mayúsculas** | Clase `.label-eyebrow` |
| **Cero sombras; la jerarquía con fondo y borde** | Se retiraron casi todas; queda la sombra dura solo en el botón principal |
| **Separación de secciones con `border-top` a ancho completo, no con cajas** | Ya se usaba; se reforzó |
| **Divisorias de 1px a baja opacidad** | Tokens `line` |
| **Retículas con divisorias compartidas en vez de `gap`** | Aplicado a la retícula de zonas |
| **Radios pequeños** (6px botones, 12px tarjetas) | Se bajaron los del sistema |
| **Números y precios en monoespaciada con tracking abierto** | Precios, capacidad y metadatos |
| **Tono: frases cortas, declarativas, sin superlativos** | Textos del hero y de las secciones |

## Qué NO se adopta, y por qué

- **La paleta oscura** (`#120F0D` de fondo, crema de texto). La referencia es un
  sitio oscuro; este es un sitio de alquiler vacacional en el Caribe, donde la
  luz y la arena son el argumento. Se mantiene la versión clara —que la propia
  referencia contempla en su sección 8— con neutros cálidos.
- **La prohibición total de sombras.** Se conserva una sombra dura en el botón
  principal: fue un pedido explícito anterior (neo-brutalismo sutil) y da la
  sensación de pulsación que a una interfaz plana le falta.
- **Los componentes concretos** (diario de la casa, retícula de pasos, píldora
  de anuncio con rating). Varios anunciarían datos que este sitio no tiene
  todavía: no hay reservas, ni 212 estancias, ni calendario real. Inventarlos
  sería exactamente el problema de los listados de relleno (ver `SEO.md`).

## El detalle central: romana + cursiva

Es el sello visual. La regla, tal cual la define la referencia:

> Cada titular grande se parte en dos mitades dentro de la MISMA frase.
> Primera mitad: serif romana, peso 400. Segunda mitad: serif CURSIVA, peso 300,
> en un tono más claro y cálido. La cursiva nunca lleva subrayado ni otro
> tamaño: solo cambia estilo, peso y color.

Ejemplos aplicados a este sitio:

- `Apartamentos y carros *en Isla de Margarita*`
- `Alquiler por zonas *de la isla*`
- `Preguntas frecuentes *sobre alquilar aquí*`

Al escribir un titular nuevo, partirlo así. Si la frase no admite el corte de
forma natural, es señal de que el titular está mal redactado.

---

## Prompt original (íntegro, para consulta)

Se conserva completo porque su nivel de detalle es útil como vara de medir,
aunque solo se haya adoptado una parte.

<details>
<summary>Ver el sistema completo de la referencia</summary>

**Tipografías:** Source Serif 4 (titulares, h1–h4, logotipo, nombres de
propiedad; pesos 400 romana y 300 cursiva) · Inter (párrafos, navegación,
botones, formularios; pesos 400 y 500, nunca 600/700 en texto corrido) ·
JetBrains Mono (números de paso, precios por noche, fechas, códigos de reserva,
capacidad, coordenadas, legal del footer).

**Escala:** H1 hero 80px desktop / 44px móvil, peso 400, line-height 1.01,
letter-spacing −0.03em · H2 sección 46–48px / 32px, line-height 1.06–1.10,
−0.025em · H2 secundario 38px / 28px · H3 tarjeta 20–21px / 17px, −0.015em ·
Lead 18px, line-height 1.55, max-width 620px · Body 16px/1.60 · Body small
13.5px/1.55 · Eyebrow 11.5px peso 500 mayúsculas +0.10em · Nav 14px · Logo
serif 18px peso 500 · Mono label 12px +0.10em · Botón 15px peso 500.

**Paleta oscura cálida:** bg `#120F0D` · bg-elev `#171513` · bg-deep `#0D0B09` ·
fg `#EBE7E2` · fg-dim `#BEB9B2` · fg-mute `#7F7B77` · fg-faint `#5B5753` ·
accent `#F4EEE0` · accent-bg `rgba(244,238,224,0.10)` · border
`rgba(58,55,53,0.32)` · border-soft `#282523` · border-strong
`rgba(58,55,53,0.55)` · on-accent `#120F0D` · positive `#4ED894` · negative
`#E7645C`. Acentos tintados solo para iconos (fondo 14%, borde 32%): azul
`#61A4E2`, verde `#4ED894`, violeta `#A78BFA`, ámbar `#E2B15F`.

**Layout:** contenedor 1200px, padding lateral 36px (20px móvil); contenedor
estrecho 820px para texto largo y 440px para formularios. Sección: 90px arriba
y abajo (56px móvil). Separación entre secciones solo con `border-top: 1px` a
ancho completo, nunca con cajas ni cambios de fondo. Retículas con `gap: 0` y
divisorias compartidas de 1px. Radios: 6px botones e inputs, 11px chips, 12px
tarjetas, 9999px píldoras. Sin sombras. Transiciones solo de color y
border-color, 150ms ease. Hover de tarjeta: el borde pasa a border-strong, sin
elevación ni escala.

**Componentes:** barra superior ~84px con borde inferior de 1px · píldora de
anuncio sobre el H1 · hero centrado (píldora → H1 con cursiva → lead 620px →
botón sólido + enlace de texto → imagen recortada por el borde inferior) ·
botón primario crema `#F4EEE0` sobre texto `#120F0D`, radio 6px, padding 13px
22px, con flecha → · secundario transparente, sin borde · tarjeta de propiedad
con chip de 42×42, número en mono, eyebrow, H3 serif, descripción 13.5px y fila
mono de datos · retícula de servicios de 3 columnas con divisorias compartidas ·
bloque tipo "diario de la casa" en mono 12.5px, interlineado 1.9 · lista de
ventajas con cuadrado de 20px y check · CTA final centrada con borde superior ·
footer con borde superior, logo pequeño, enlaces y línea legal en mono.

**Tono:** frases cortas y declarativas, sin superlativos ni exclamaciones. Cada
titular es una afirmación tranquila que se completa con la cursiva.

**Prohibido:** sombras · degradados de color, glassmorphism, blur decorativo ·
radios de 16px+ o pill en tarjetas · más de un botón sólido por pantalla ·
titulares en sans-serif o en negrita 700 · emojis como iconos (usar set de línea
de 1.5px) · grises azulados (todos los neutros con temperatura cálida) ·
animaciones de entrada llamativas (como mucho un fade de 150ms).

**Variante clara** (la que aplica a este proyecto): bg `#FBF8F3` · bg-elev
`#FFFFFF` · fg `#1A1714` · fg-dim `#57524C` · fg-mute `#8A837B` · accent
`#2B2520` · border `rgba(26,23,20,0.12)` · botón sólido fondo `#1A1714` texto
`#FBF8F3` · cursiva de titulares `#6B5F52`. Escala, tracking, líneas de 1px,
radios y ritmo idénticos.

</details>
