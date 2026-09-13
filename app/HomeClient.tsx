'use client';

import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  Search, 
  Compass, 
  Trees, 
  Home as HomeIcon, 
  Palmtree, 
  Umbrella, 
  Box, 
  Tent, 
  Waves,
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  ArrowRight, 
  X, 
  MessageCircle, 
  Heart, 
  Wifi, 
  Coffee, 
  Flame, 
  Wind, 
  SlidersHorizontal,
  Calendar,
  Users,
  MapPin,
  Smile,
  ShieldCheck
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';

// Los datos NO se importan: llegan por props desde app/page.tsx, que es un
// Server Component y sí puede consultar Postgres. Este archivo es 'use client',
// y un navegador no puede hablar con la base.
import { avisar } from '@/components/Medidor';
import { iconFor } from '@/lib/icons';
import type { Category, Property, Zone } from '@/lib/types';
import {
  AboutIslandSection,
  FaqSection,
  ManifiestoSection,
} from '@/components/SeoSections';

export interface HomeClientProps {
  properties: Property[];
  zones: Zone[];
  categories: Category[];
  /** Contenido editable desde /admin/contenido. Llega por props porque este
   *  archivo es 'use client' y lib/settings.ts abre Postgres. */
  contenido: {
    heroImage: string;
    heroImageAlt: string;
    heroKicker: string;
    heroSubtitulo: string;
  };
  /** Solo dígitos, o null mientras no esté configurado. */
  whatsapp: string | null;
}

/**
 * Menú de la navbar. Todos los destinos existen de verdad: los que empiezan por
 * '#' son secciones de esta página (el scroll-padding-top de html compensa la
 * barra fija al saltar) y los que empiezan por '/' son páginas.
 *
 * «Autos» volvió al menú el 2026-08-03, ahora que existe /autos. Estuvo fuera
 * unos días porque era un botón que no llevaba a ninguna parte.
 */
const NAV_LINKS = [
  { label: 'Inicio', href: '#hero-frame' },
  { label: 'Apartamentos', href: '#listings-container' },
  { label: 'Autos', href: '/autos' },
  { label: 'En venta', href: '/en-venta' },
  { label: 'Zonas', href: '#zonas-de-la-isla' },
] as const;

// ── Reserva por WhatsApp ────────────────────────────────────────────────────
// El sitio no cobra en línea: una reserva se cierra conversando, que es como
// se alquila en Venezuela. Este enlace abre WhatsApp con el mensaje ya escrito
// (propiedad, noches, huéspedes) para que el interesado solo tenga que enviar.
//
// Devuelve null mientras no exista CONTACT.whatsapp (lib/site.ts): el botón se
// muestra desactivado y honesto. NUNCA volver a la pantalla de "reserva
// pre-aprobada" que había antes — confirmaba solicitudes que no llegaban a
// nadie.
function urlReservaWhatsApp(
  property: Property,
  nights: number,
  guests: number,
  whatsapp: string | null,
): string | null {
  if (!whatsapp) return null;
  const huespedes = `${guests} ${guests === 1 ? 'huésped' : 'huéspedes'}`;
  const texto = property.priceOnRequest
    ? `Hola, vi «${property.name}» (${property.location}) en margaritarenace.com.ve. ¿Disponibilidad y tarifa para ${huespedes}?`
    : `Hola, quiero reservar «${property.name}» (${property.location}) que vi en margaritarenace.com.ve: ${nights} ${nights === 1 ? 'noche' : 'noches'}, ${huespedes}. ¿Está disponible?`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(texto)}`;
}

export default function HomeClient({
  properties: PROPERTIES,
  zones: ZONES,
  categories,
  contenido,
  whatsapp,
}: HomeClientProps) {
  // Se renombran a mayúsculas en la desestructuración para no tocar las ~40
  // referencias del cuerpo del componente, que ya usaban esos nombres cuando
  // eran constantes importadas. Menos superficie de cambio, menos riesgo.

  // 'Todos' es un filtro de interfaz, no una categoría de la base: se antepone
  // acá para que el catálogo siga siendo dato puro.
  const CATEGORIES = [
    { key: 'Todos', label: 'Todos', iconKey: 'compass' },
    ...categories,
  ];

  // Navigation active links
  // Tasa USDT (BCV de respaldo) para mostrar los precios en bolívares. Se pide UNA vez acá y baja
  // a todas las tarjetas: si cada tarjeta hiciera su propio fetch, cuatro
  // tarjetas serían cuatro peticiones idénticas. La home es estática, así que
  // la tasa no puede viajar en el HTML sin quedar vieja — ver app/api/tasa.
  const [tasaBcv, setTasaBcv] = useState<number | null>(null);
  useEffect(() => {
    let vivo = true;
    fetch('/api/tasa')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { bcv: number | null; usdt?: number | null } | null) => {
        const t = d?.usdt ?? d?.bcv;
        if (vivo && t) setTasaBcv(t);
      })
      .catch(() => {
        /* sin tasa: las tarjetas muestran solo dólares */
      });
    return () => {
      vivo = false;
    };
  }, []);



  // Interactive categories navigation state
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Search Engine States
  const [searchWhere, setSearchWhere] = useState('');
  const [searchCheckIn, setSearchCheckIn] = useState('');
  const [searchCheckOut, setSearchCheckOut] = useState('');
  const [guestCount, setGuestCount] = useState({ adults: 1, children: 0, infants: 0 });

  // Popover States
  const [activePopover, setActivePopover] = useState<'where' | 'dates' | 'guests' | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Filter sidebar states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMaxPrice, setFilterMaxPrice] = useState(200);
  const [filterMinRating, setFilterMinRating] = useState(4.5);

  // Selected property for detail view (Sidebar Drawer)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cálculo de la reserva. Noches y huéspedes no se "envían" a ningún lado:
  // van dentro del mensaje precargado de WhatsApp, que es donde se cierra la
  // reserva de verdad. Ver urlReservaWhatsApp().
  const [bookingNights, setBookingNights] = useState(2);

  /** Abre el panel de una propiedad con las noches en SU mínimo de estadía. */
  const abrirPropiedad = (p: Property) => {
    setBookingNights(Math.max(1, p.nightsCount));
    setSelectedProperty(p);
    setIsDetailOpen(true);
  };
  const [bookingGuests, setBookingGuests] = useState(1);

  const waReserva = selectedProperty
    ? urlReservaWhatsApp(selectedProperty, bookingNights, bookingGuests, whatsapp)
    : null;

  // Escape cierra el panel abierto. Faltaba: con el panel de detalles ocupando
  // la pantalla, la única salida era acertarle a la X.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setIsFilterOpen(false);
      setIsDetailOpen(false);
      setActivePopover(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Close search popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category horizontal scroll handler
  const scrollCategories = () => {
    if (categoriesScrollRef.current) {
      categoriesScrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  // Filter properties based on selected category, search criteria, and custom sidebar filters
  const getFilteredProperties = () => {
    let result = PROPERTIES;

    // Filter by Category
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.categories.includes(selectedCategory));
    }

    // Filter by Search 'Where'
    if (searchWhere.trim()) {
      const q = searchWhere.toLowerCase();
      result = result.filter(p => p.location.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }

    // Filter by Guest Capability
    const totalGuestsNeeded = guestCount.adults + guestCount.children;
    if (totalGuestsNeeded > 1) {
      result = result.filter(p => (p.guestsAllowed.adults + p.guestsAllowed.children) >= totalGuestsNeeded);
    }

    // Filter by Sidebar filters (Price & Rating)
    result = result.filter(
      (p) =>
        (p.priceOnRequest || p.pricePerNight <= filterMaxPrice) &&
        // rating null = sin reseñas todavía, no "mal valorada": no se excluye.
        (p.rating === null || p.rating >= filterMinRating),
    );

    return result;
  };

  const filteredProperties = getFilteredProperties();

  // Divide properties into 3 curated lists for "All" view
  const getCuratedSection1 = () => filteredProperties.slice(0, 4);
  const getCuratedSection2 = () => filteredProperties.slice(4, 8);
  const getCuratedSection3 = () => filteredProperties.slice(8, 12);

  // Trigger search actions
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActivePopover(null);
    // Lo que la gente ESCRIBE es el dato más valioso del recolector: revela
    // demanda que el inventario no cubre. Solo si escribió algo.
    if (searchWhere.trim()) {
      avisar({ kind: 'busqueda', meta: { q: searchWhere.trim() } });
    }
    // Smooth scroll down to listings section
    const element = document.getElementById('listings-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Quick reset all search parameters
  const handleResetSearch = () => {
    setSearchWhere('');
    setSearchCheckIn('');
    setSearchCheckOut('');
    setGuestCount({ adults: 1, children: 0, infants: 0 });
    setSelectedCategory('Todos');
    setFilterMaxPrice(200);
    setFilterMinRating(4.5);
  };

  return (
    <div className="min-h-screen bg-paper text-ink pb-24 relative overflow-x-hidden">

      {/* 1. NAVBAR: el mismo componente que usan todas las páginas. */}
      <NavBar whatsapp={whatsapp} onInicio={handleResetSearch} />

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-36">
        
        {/* 2. HERO a pantalla completa, de borde a borde */}
        <div id="hero-frame" className="relative w-screen left-1/2 -translate-x-1/2 -mt-28 md:-mt-36 mb-56 md:mb-24">
          {/* Altura de pantalla completa. Se usa `svh` (small viewport height)
              y no `vh` ni `dvh`: en móvil, `100vh` mide como si la barra del
              navegador no existiera —el hero queda cortado— y `100dvh` provoca
              un salto de layout cuando la barra se oculta al desplazar. `svh`
              toma la ventana con la barra visible: nunca se corta y nunca
              salta. Tope de 900px para que en monitores altos el hero no se
              vuelva un desierto vertical. */}
          {/* HERO «Amanecer» (2026-09-12). Antes: foto de playa a pantalla
              completa con velo oscuro y el texto encima. Ahora: el amanecer de
              Playa El Agua como degradado (durazno → agua), el titular a la
              izquierda y UNA foto en un marco de papel apenas inclinado, como
              una postal pegada a mano. Trazo fino, sombras suaves. Altura por
              contenido, no por pantalla. */}
          <section
            id="hero-banner"
            className="relative w-full overflow-hidden bg-luz border-b border-line pt-28 pb-52 md:pt-44 md:pb-32"
          >
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 md:grid-cols-[1.1fr_.9fr] md:px-8">
              <div>
                <p className="label-eyebrow rise rise-1 text-brand-deep tracking-[0.14em]">
                  {contenido.heroKicker}
                </p>
                <h1 className="font-serif text-hero text-ink font-normal leading-[1.02] text-balance track-display rise rise-2 mt-4">
                  Apartamentos y casas en Isla de Margarita,{' '}
                  <em className="headline-italic">con tratos justos</em>
                </h1>
                <p className="rise rise-3 mt-6 max-w-[44ch] text-pretty text-body md:text-body-lg text-ink-soft">
                  {contenido.heroSubtitulo}
                </p>
                {/* Tres hechos, no adjetivos: son la misión de IDENTIDAD.md hecha
                    promesa concreta. */}
                <ul className="rise rise-3 mt-8 flex flex-col gap-2 text-ink sm:flex-row sm:gap-0 sm:divide-x sm:divide-line-strong">
                  <li className="text-ui-lg font-medium sm:pr-5">El precio es el precio</li>
                  <li className="text-ui-lg font-medium sm:px-5">Te responde una persona</li>
                  <li className="text-ui-lg font-medium sm:pl-5">Sin comisiones ocultas</li>
                </ul>
              </div>
              <figure className="rise rise-2 hidden md:block justify-self-center w-[min(100%,440px)] -rotate-[1.5deg] rounded-card border border-line bg-white p-2.5 shadow-lift-lg">
                <img
                  src={contenido.heroImage}
                  alt={contenido.heroImageAlt}
                  width={880}
                  height={660}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/3] w-full rounded-control object-cover"
                  referrerPolicy="no-referrer"
                />
                <figcaption className="mono-data px-1 pt-2.5 text-ink-muted">{contenido.heroImageAlt || 'Isla de Margarita'}</figcaption>
              </figure>
            </div>
          </section>

          {/* SEARCH BAR Flotante sobre el borde inferior */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div ref={searchBarRef} className="flex flex-col gap-1.5">
              {/* Se quitó el botón suelto "Ver Todo" que iba flotando encima de
                  la barra. Dos razones: en móvil quedaba huérfano sobre la
                  curva del hero y se veía roto, y era REDUNDANTE — hacía
                  exactamente lo mismo que el chip "Todos" de la fila de
                  categorías, que está a dos dedos de distancia. */}

              {/* Buscador: TARJETA apilada en móvil, PÍLDORA en escritorio.
                  Antes era pastilla en los dos casos con flex-wrap, y en móvil
                  los cuatro campos se envolvían dentro del óvalo: se amontonaban
                  en filas desalineadas, "Agregar fecha" salía truncado y
                  "Check Out" se partía en dos. Una pastilla solo funciona con
                  los campos en una sola fila. */}
              <div className="bg-white rounded-card md:rounded-full p-2 md:p-2.5 shadow-lift-lg border border-line flex flex-col md:flex-row md:items-center md:justify-between w-full divide-y divide-line md:divide-y-0">

                {/* 1. Where */}
                <div
                  onClick={() => setActivePopover(activePopover === 'where' ? null : 'where')}
                  className={`w-full md:flex-1 md:min-w-[110px] px-4 py-3 md:py-2 rounded-chip md:rounded-full cursor-pointer transition-colors ${
                    activePopover === 'where' ? 'bg-white/70' : 'hover:bg-white/50'
                  }`}
                >
                  <label className="block text-micro uppercase font-semibold text-ink tracking-wider mb-0.5">Dónde</label>
                  <input
                    type="text"
                    readOnly
                    value={searchWhere || 'Buscar destino'}
                    className={`bg-transparent text-meta text-ink-muted border-none outline-none w-full cursor-pointer font-medium p-0 leading-tight ${
                      searchWhere ? 'text-ink' : 'text-ink-muted'
                    }`}
                  />
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-line" />

                {/* 2. Check In */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                  className={`w-full md:flex-1 md:min-w-[110px] px-4 py-3 md:py-2 rounded-chip md:rounded-full cursor-pointer transition-colors ${
                    activePopover === 'dates' ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  <label className="block text-micro uppercase font-semibold text-ink tracking-wider mb-0.5">Check In</label>
                  <span className="text-meta text-ink-muted font-medium block overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                    {searchCheckIn || 'Agregar fecha'}
                  </span>
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-line" />

                {/* 3. Check Out */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                  className={`w-full md:flex-1 md:min-w-[110px] px-4 py-3 md:py-2 rounded-chip md:rounded-full cursor-pointer transition-colors ${
                    activePopover === 'dates' ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  <label className="block text-micro uppercase font-semibold text-ink tracking-wider mb-0.5">Check Out</label>
                  <span className="text-meta text-ink-muted font-medium block overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                    {searchCheckOut || 'Agregar fecha'}
                  </span>
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-line" />

                {/* 4. Who */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
                  className={`w-full md:flex-1 md:min-w-[110px] px-4 py-3 md:py-2 rounded-chip md:rounded-full cursor-pointer transition-colors ${
                    activePopover === 'guests' ? 'bg-paper' : 'hover:bg-paper'
                  }`}
                >
                  <label className="block text-micro uppercase font-semibold text-ink tracking-wider mb-0.5">Quién</label>
                  <span className="text-meta text-ink font-semibold block leading-tight">
                    {guestCount.adults + guestCount.children + guestCount.infants > 0
                      ? `${guestCount.adults + guestCount.children} huéspedes`
                      : 'Agregar huéspedes'}
                  </span>
                </div>

                {/* Search Button */}
                <button 
                  onClick={() => handleSearch()}
                  aria-label="Buscar propiedades"
                  className="mt-2 md:mt-0 w-full md:w-12 h-12 rounded-chip md:rounded-full bg-brand hover:bg-brand-deep text-white flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 md:ml-2"
                >
                  <Search className="w-5 h-5" />
                  <span className="md:hidden text-ui-lg font-semibold">Buscar</span>
                </button>
              </div>

              {/* SEARCH ENGINE INTERACTIVE POPOVERS */}
              <AnimatePresence>
                {activePopover === 'where' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 md:left-4 md:right-auto md:w-96 mt-2 bg-white rounded-2xl border border-line shadow-2xl p-5 z-50 text-ink"
                  >
                    <div className="flex justify-between items-center mb-4">
                      {/* Las zonas REALES de la isla, leídas de la base.
                          Hasta el 2026-08-03 acá había una lista de la
                          plantilla original: Goa, Bali, Santorini, Zermatt,
                          Lofoten… En un sitio de alquiler en Margarita eso
                          destruía la credibilidad de golpe, y encima al elegir
                          cualquiera la búsqueda filtraba por ese texto y no
                          encontraba nada: el visitante veía «Sin resultados».
                          Ahora salen las zonas que sí tienen inventario, con
                          cuántos alojamientos hay en cada una. */}
                      <h4 className="text-meta uppercase tracking-[0.15em] font-semibold text-gray-400">Zonas de la isla</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {ZONES.map((zona) => (
                        <button
                          key={zona.slug}
                          onClick={() => {
                            setSearchWhere(zona.name);
                            setActivePopover('dates'); // auto transition
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-line/40 hover:border-ink hover:bg-paper text-left transition-all text-meta font-medium text-gray-700 hover:text-black"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{zona.name}</span>
                          <span className="ml-auto shrink-0 text-ui text-ink-faint">
                            {zona.properties.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activePopover === 'dates' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 md:left-48 md:right-auto md:w-80 mt-2 bg-white rounded-2xl border border-line shadow-2xl p-5 z-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-meta uppercase tracking-[0.15em] font-semibold text-gray-400">Fechas de Estadía</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    
                    {/* Simulated Predefined Dates */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-micro text-gray-400 uppercase font-semibold block mb-1">Check-in</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['22 Jul', '24 Jul', '28 Jul', '02 Ago', '10 Ago', 'Omitir'].map((d) => (
                            <button
                              key={d}
                              onClick={() => {
                                  if (d !== 'Omitir') setSearchCheckIn(d + ' 2026');
                                  else setSearchCheckIn('');
                              }}
                              className={`py-1 px-2 text-meta rounded-lg border text-center font-medium transition-all ${
                                searchCheckIn.startsWith(d)
                                  ? 'bg-ink text-white border-black'
                                  : 'border-line/40 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-micro text-gray-400 uppercase font-semibold block mb-1">Check-out</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['25 Jul', '28 Jul', '02 Ago', '05 Ago', '15 Ago', 'Omitir'].map((d) => (
                            <button
                              key={d}
                              onClick={() => {
                                if (d !== 'Omitir') setSearchCheckOut(d + ' 2026');
                                else setSearchCheckOut('');
                                if (searchCheckIn) setActivePopover('guests'); // auto step
                              }}
                              className={`py-1 px-2 text-meta rounded-lg border text-center font-medium transition-all ${
                                searchCheckOut.startsWith(d)
                                  ? 'bg-ink text-white border-black'
                                  : 'border-line/40 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activePopover === 'guests' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 left-0 md:left-auto md:right-4 md:w-80 mt-2 bg-white rounded-2xl border border-line shadow-2xl p-5 z-50 text-ink"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-meta uppercase tracking-[0.15em] font-semibold text-gray-400">Número de Huéspedes</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    <div className="space-y-4">
                      {/* Adultos */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-meta font-semibold">Adultos</p>
                          <p className="text-micro text-gray-400 font-medium">Desde 13 años</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.adults <= 1}
                            onClick={() => setGuestCount({ ...guestCount, adults: guestCount.adults - 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper"
                          >
                            -
                          </button>
                          <span className="text-meta font-semibold w-4 text-center">{guestCount.adults}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, adults: guestCount.adults + 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold hover:bg-paper"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Niños */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-meta font-semibold">Niños</p>
                          <p className="text-micro text-gray-400 font-medium">Edades 2 - 12</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.children <= 0}
                            onClick={() => setGuestCount({ ...guestCount, children: guestCount.children - 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper"
                          >
                            -
                          </button>
                          <span className="text-meta font-semibold w-4 text-center">{guestCount.children}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, children: guestCount.children + 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold hover:bg-paper"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bebés */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-meta font-semibold">Bebés</p>
                          <p className="text-micro text-gray-400 font-medium">Menos de 2 años</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.infants <= 0}
                            onClick={() => setGuestCount({ ...guestCount, infants: guestCount.infants - 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-paper"
                          >
                            -
                          </button>
                          <span className="text-meta font-semibold w-4 text-center">{guestCount.infants}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, infants: guestCount.infants + 1 })}
                            className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-meta font-semibold hover:bg-paper"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSearch()}
                        className="btn-solid w-full mt-3"
                      >
                        Confirmar Huéspedes
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* 3. BARRA DE CATEGORÍAS */}
        <section id="categories-navigation" className="mt-16 mb-12 flex items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            
            {/* Scrollable Container */}
            <div 
              ref={categoriesScrollRef}
              className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth pr-10 py-1"
            >
              {CATEGORIES.map((category) => {
                const IconComponent = iconFor(category.iconKey);
                const isActive = selectedCategory === category.key;
                return (
                  <button
                    key={category.key}
                    onClick={() => {
                      setSelectedCategory(category.key);
                      // Clear search details to prioritize category
                      setSearchWhere('');
                    }}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-chip cursor-pointer transition-all shrink-0 focus:outline-none border-[1.5px] text-meta font-semibold tracking-wide ${
                      isActive
                        ? 'text-white bg-brand border-transparent shadow-[0_2px_8px_rgba(0,115,128,0.25)]'
                        : 'text-ink-muted hover:text-ink border-line/60 hover:border-brand bg-white/60'
                    }`}
                  >
                    <IconComponent className={`w-[17px] h-[17px] shrink-0 ${isActive ? 'text-white' : 'stroke-[1.6]'}`} />
                    <span className="leading-none">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Flecha circular ">" para scroll */}
            <button 
              onClick={scrollCategories}
              aria-label="Siguiente categoría"
              className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-gray-700 bg-white hover:bg-paper transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Mismo alto y radio que los chips de categoría: antes usaba
                .btn-solid (46px, borde de tinta y sombra dura) dentro de una
                fila de chips de 42px sin borde oscuro, y sobresalía rompiendo
                la línea. Se distingue por el relleno sólido, no por el tamaño. */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex shrink-0 items-center gap-2.5 rounded-chip border-[1.5px] border-brand-deep bg-brand px-4 py-2.5 text-meta font-semibold tracking-wide text-white transition-all hover:bg-brand-deep cursor-pointer"
            >
              <SlidersHorizontal className="w-[17px] h-[17px]" />
              <span>Filtros</span>
            </button>
          </div>
        </section>

        {/* 4. SECCIONES DE LISTADOS */}
        <section id="listings-container" className="space-y-20 md:space-y-28">
          {selectedCategory === 'All' && !searchWhere.trim() ? (
            // DISPLAY ALL 3 CURATED SECTIONS
            <>
              {/* Section 1: Destacados en Margarita */}
              <CarouselSection
                tasaBcv={tasaBcv}
                title="Destacados en Margarita"
                properties={getCuratedSection1()} 
                onSelectProperty={(p) => abrirPropiedad(p)}
              />

              {/* Section 2: Selección Premium */}
              <CarouselSection
                tasaBcv={tasaBcv}
                title="Selección Premium"
                properties={getCuratedSection2()} 
                onSelectProperty={(p) => abrirPropiedad(p)}
              />

              {/* Section 3: Escapadas Frente al Mar */}
              <CarouselSection
                tasaBcv={tasaBcv}
                title="Escapadas Frente al Mar"
                properties={getCuratedSection3()} 
                onSelectProperty={(p) => abrirPropiedad(p)}
              />
            </>
          ) : (
            // DISPLAY SINGLE FILTERED LIST SECTION WITH GRID
            <div>
              <div className="flex justify-between items-end mb-8 border-b border-line pb-4">
                <div>
                  {/* El titular se construye como JSX, no como cadena: la
                      cursiva del sello es un elemento <em>, y dentro de un
                      template string se renderizaría como texto literal. */}
                  <h2 className="font-serif text-headline text-ink font-normal track-headline">
                    {selectedCategory !== 'Todos' ? (
                      <>
                        Colección{' '}
                        <em className="headline-italic">{selectedCategory}</em>
                      </>
                    ) : (
                      <>
                        Hospedajes{' '}
                        <em className="headline-italic">en toda la isla</em>
                      </>
                    )}
                  </h2>
                  {/* Cifra en monoespaciada: es un dato, y en mono se lee como
                      dato. "exclusivas" era un superlativo de folleto — la
                      referencia pide frases secas y declarativas. */}
                  <p className="mono-data text-ink-muted mt-2">
                    {filteredProperties.length}{' '}
                    {filteredProperties.length === 1 ? 'hospedaje' : 'hospedajes'}
                  </p>
                </div>
                {searchWhere.trim() && (
                  <button 
                    onClick={handleResetSearch}
                    className="text-meta font-semibold border-b border-black text-black hover:opacity-70 transition-all"
                  >
                    Borrar Filtros
                  </button>
                )}
              </div>

              {filteredProperties.length > 0 ? (
                /* Dos columnas, no cuatro: con cuatro alojamientos una fila de
                   tarjetas estrechas se ve pobre, mientras que una retícula 2×2
                   con fotos grandes ocupa bien el ancho y luce. Si el inventario
                   vuelve a crecer, subir a md:grid-cols-2 lg:grid-cols-3. */
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      tasaBcv={tasaBcv}
                      onSelect={() => abrirPropiedad(property)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center max-w-md mx-auto">
                  <Smile className="w-12 h-12 text-gray-300 mx-auto mb-4 stroke-[1.2]" />
                  <h3 className="font-serif text-title-sm text-brand font-semibold mb-1">Sin resultados exactos</h3>
                  <p className="text-meta text-ink-muted mb-6">No encontramos hospedajes disponibles con esos filtros. Intenta disminuyendo tus requisitos o buscando otra zona.</p>
                  <button 
                    onClick={handleResetSearch}
                    className="btn-solid"
                  >
                    Restablecer Búsqueda
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Contenido de SEO/GEO: enlaces a las landings de zona (si no, serían
            huérfanas), contexto real del destino y preguntas frecuentes con
            FAQPage schema. Ver components/SeoSections.tsx. */}
        <ManifiestoSection />
        <AboutIslandSection />
        <FaqSection />

      </main>

      {/* 5. SIDEBAR DRAWER: DETALLES DE PROPIEDAD */}
      <AnimatePresence>
        {isDetailOpen && selectedProperty && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Drawer Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Detalles de ${selectedProperty.name}`}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 text-ink"
            >

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div>
                  <h3 className="font-serif text-title-sm font-semibold text-brand">Detalles de la Reserva</h3>
                  <p className="text-micro text-gray-400 font-medium tracking-wide uppercase mt-0.5">{selectedProperty.location}</p>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  aria-label="Cerrar detalles"
                  className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido desplazable.
                  data-lenis-prevent NO es opcional: Lenis intercepta la rueda
                  a nivel de ventana y, sin esta marca, se llevaba el gesto para
                  desplazar la página de detrás — el panel se quedaba
                  ESTÁTICO y no se podía llegar ni al precio ni al botón de
                  reservar. Lenis busca el atributo en el composedPath del
                  evento (allowNestedScroll viene en false por defecto). */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar"
              >
                
                {/* Image Gallery (Main + small grid) */}
                <div className="space-y-2">
                  <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-sm">
                    <img
                      src={selectedProperty.image}
                      alt={`${selectedProperty.name} — alquiler en ${selectedProperty.zone}, Isla de Margarita`}
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProperty.gallery.map((imgUrl, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-line/40 shadow-xs">
                        {/* El alt decía "Gallery image 0": en inglés y sin
                            información. Inservible para lectores de pantalla y
                            desperdiciado para Google Imágenes. */}
                        <img
                          src={imgUrl}
                          alt={`Foto ${idx + 1} de ${selectedProperty.name}, ${selectedProperty.zone}`}
                          width={400}
                          height={225}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-serif text-title font-medium text-brand tracking-tight">{selectedProperty.name}</h2>
                      <p className="text-meta text-ink-muted mt-0.5 font-medium">{selectedProperty.location}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-paper text-amber-800 border border-line rounded-chip px-3 py-1.5 text-meta font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{selectedProperty.rating}</span>
                    </div>
                  </div>
                  <p className="text-meta text-gray-600 leading-relaxed font-normal">{selectedProperty.description}</p>
                  {/* La página propia es la versión canónica y compartible del
                      alojamiento: es el enlace que se manda por WhatsApp. */}
                  <Link
                    href={`/propiedad/${selectedProperty.slug}`}
                    className="inline-block text-meta font-semibold text-brand underline-offset-4 hover:underline"
                  >
                    Ver página completa →
                  </Link>
                </div>

                {/* Host Info */}
                <div className="p-4 bg-paper rounded-2xl border border-line flex items-center gap-4">
                  <img 
                    src={selectedProperty.host?.avatarPath ?? '/logo-avatar.png'} 
                    alt={selectedProperty.host?.name ?? 'Margarita Renace'} 
                    className="w-12 h-12 rounded-full object-cover shadow-xs border border-line"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-meta font-semibold text-ink">Hospedado por {selectedProperty.host?.name ?? 'Margarita Renace'}</p>
                    <p className="text-micro text-ink-muted font-medium mt-0.5">{selectedProperty.host?.tagline ?? ''}</p>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-meta uppercase tracking-wider font-semibold text-gray-400 mb-3">Servicios Premium Incluidos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.amenities.map((amenity, idx) => {
                      const Icon = iconFor(amenity.iconKey);
                      return (
                        <div key={idx} className="flex items-center gap-2 text-meta text-gray-700">
                          <div className="w-7 h-7 rounded-lg bg-paper border border-line/30 flex items-center justify-center text-gray-500">
                            <Icon className="w-4 h-4 stroke-[1.8]" />
                          </div>
                          <span className="font-medium">{amenity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Booking Calculator */}
                {selectedProperty.priceOnRequest ? (
                  <div className="p-5 bg-white rounded-2xl border border-line shadow-sm space-y-4">
                    <div className="flex justify-between items-baseline border-b border-line pb-3">
                      <span className="text-body font-semibold text-accent">Precio según temporada</span>
                      <span className="text-meta text-gray-400 font-medium">Capacidad máx: {selectedProperty.guestsAllowed.adults + selectedProperty.guestsAllowed.children} personas</span>
                    </div>
                    <p className="text-meta text-gray-600">
                      El precio de esta propiedad varía según la temporada. Contáctanos y te confirmamos disponibilidad y tarifa para tus fechas.
                    </p>
                    {waReserva ? (
                      <a
                        href={waReserva}
                        target="_blank"
                        rel="noopener"
                        onClick={() =>
                          avisar({
                            kind: 'whatsapp',
                            path: `/propiedad/${selectedProperty.slug}`,
                            propertyId: selectedProperty.id,
                          })
                        }
                        className="btn-solid w-full mt-3"
                      >
                        <span>Consultar por WhatsApp</span>
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="btn-solid w-full mt-3 opacity-60 cursor-not-allowed"
                      >
                        <span>Consultas por WhatsApp — muy pronto</span>
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-white rounded-2xl border border-line shadow-sm space-y-4">
                    <div className="flex justify-between items-baseline border-b border-line pb-3">
                      <div>
                        {tasaBcv ? (
                          <>
                            <span className="text-title-sm font-semibold text-accent">
                              {bolivares(selectedProperty.pricePerNight * tasaBcv, 0)}
                            </span>
                            <span className="text-meta text-gray-500 font-medium"> / noche</span>
                            <span className="mono-data block text-meta text-ink-muted">
                              Ref. US${selectedProperty.pricePerNight.toLocaleString()} · tasa USDT
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-title-sm font-semibold text-accent">US${selectedProperty.pricePerNight.toLocaleString()}</span>
                            <span className="text-meta text-gray-500 font-medium"> / noche</span>
                          </>
                        )}
                      </div>
                      <span className="text-meta text-gray-400 font-medium">Capacidad máx: {selectedProperty.guestsAllowed.adults + selectedProperty.guestsAllowed.children} personas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-micro uppercase font-semibold text-gray-400 mb-1">Noches</label>
                        <select 
                          value={bookingNights} 
                          onChange={(e) => setBookingNights(Number(e.target.value))}
                          className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-meta font-semibold focus:outline-none focus:border-ink"
                        >
                          {/* Solo estadías válidas: antes ofrecía 1 noche
                              aunque la propiedad exigiera un mínimo mayor. */}
                          {[1, 2, 3, 4, 5, 6, 7, 10, 14]
                            .filter(n => n >= Math.max(1, selectedProperty.nightsCount))
                            .map(n => (
                              <option key={n} value={n}>{n} {n === 1 ? 'noche' : 'noches'}</option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-micro uppercase font-semibold text-gray-400 mb-1">Huéspedes</label>
                        <select 
                          value={bookingGuests} 
                          onChange={(e) => setBookingGuests(Number(e.target.value))}
                          className="w-full bg-paper border border-line rounded-xl px-3 py-2 text-meta font-semibold focus:outline-none focus:border-ink"
                        >
                          {Array.from({ length: selectedProperty.guestsAllowed.adults + selectedProperty.guestsAllowed.children }, (_, i) => i + 1).map(g => (
                            <option key={g} value={g}>{g} {g === 1 ? 'huésped' : 'huéspedes'}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Desglose. Sin "tarifa de limpieza" ni "de servicio":
                        eran montos inventados que nadie decidió cobrar. El
                        total es noches × precio, y cualquier costo extra se
                        conversa por WhatsApp antes de confirmar. */}
                    <div className="space-y-2 pt-2 text-body text-ink-muted">
                      <div className="flex justify-between">
                        <span>Estadía de {bookingNights} {bookingNights === 1 ? 'noche' : 'noches'}</span>
                        <span className="mono-data">Ref. US${(selectedProperty.pricePerNight * bookingNights).toLocaleString()}</span>
                      </div>

                      {/* El BOLÍVAR es el total a pagar: es la moneda de curso
                          legal y lo que el huésped entrega. El dólar queda como
                          subtotal del catálogo. Si no hay tasa, el dólar vuelve
                          a ser el total — mejor eso que un bolívar equivocado. */}
                      {tasaBcv ? (
                        <>
                          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4 font-semibold text-brand">
                            <span className="text-body-lg">Total a pagar en bolívares</span>
                            <span className="mono-data text-title">
                              {bolivares(selectedProperty.pricePerNight * bookingNights * tasaBcv)}
                            </span>
                          </div>
                          {/* `text-meta`, no `text-micro`: globals.css reserva
                              micro para etiquetas en versalitas, y esto es texto
                              corrido que el huésped tiene que poder leer. */}
                          <p className="text-meta text-ink-muted">
                            Calculado al dólar BCV: {bolivares(tasaBcv, 4)} por US$. El
                            monto final se ajusta a la tasa USDT del día de pago.
                          </p>
                        </>
                      ) : (
                        <div className="flex items-baseline justify-between gap-3 border-t border-line pt-4 font-semibold text-brand">
                          <span className="text-body-lg">Total estimado</span>
                          <span className="mono-data text-title">US${(selectedProperty.pricePerNight * bookingNights).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {waReserva ? (
                      <a
                        href={waReserva}
                        target="_blank"
                        rel="noopener"
                        onClick={() =>
                          avisar({
                            kind: 'whatsapp',
                            path: `/propiedad/${selectedProperty.slug}`,
                            propertyId: selectedProperty.id,
                          })
                        }
                        className="btn-solid w-full mt-4"
                      >
                        <span>Reservar por WhatsApp</span>
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        disabled
                        className="btn-solid w-full mt-4 opacity-60 cursor-not-allowed"
                      >
                        <span>Reservas por WhatsApp — muy pronto</span>
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    <p className="text-micro text-center text-gray-400 mt-2 font-medium">Sin pagos en línea: confirmas disponibilidad y coordinas directo con quien te recibe</p>
                  </div>
                )}

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SIDEBAR DRAWER: FILTERS */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Filter Panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              role="dialog"
              aria-modal="true"
              aria-label="Filtros de búsqueda"
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 text-ink"
            >

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-line">
                <div>
                  <h3 className="font-serif text-title-sm font-semibold text-brand">Filtros de Búsqueda</h3>
                  <p className="text-micro text-gray-400 font-medium tracking-wide">Refina tu selección en Margarita Renace</p>
                </div>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Igual que el panel de detalles: sin data-lenis-prevent la
                  lista de filtros no se puede desplazar. */}
              <div
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                
                {/* Price Range */}
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-meta uppercase tracking-wider font-semibold text-gray-400">Precio Máximo por noche</h4>
                    <span className="text-meta font-semibold text-accent">US${filterMaxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={200}
                    step={5}
                    value={filterMaxPrice}
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <div className="flex justify-between text-micro text-gray-400 font-semibold">
                    <span>US$20 / noche</span>
                    <span>US$200 / noche</span>
                  </div>
                </div>

                <hr className="border-line" />

                {/* Minimum Rating */}
                <div className="space-y-4">
                  <h4 className="text-meta uppercase tracking-wider font-semibold text-gray-400">Calificación Mínima</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[4.5, 4.6, 4.7, 4.8, 4.9].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFilterMinRating(val)}
                        className={`py-2 rounded-xl text-meta font-semibold border transition-all ${
                          filterMinRating === val 
                            ? 'bg-ink text-white border-black' 
                            : 'border-gray-100 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        ★ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-line" />

                {/* Popular Amenities Filter Info */}
                <div className="p-4 bg-paper rounded-xl border border-line text-meta space-y-1">
                  <p className="font-semibold text-brand">Calidad Margarita Renace</p>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Todas las propiedades listadas cumplen con estándares de calidad verificados: Wi-Fi de alta velocidad, atención al huésped y limpieza profesional impecable.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-line flex gap-3 bg-white">
                <button
                  onClick={() => {
                    setFilterMaxPrice(60000);
                    setFilterMinRating(4.5);
                  }}
                  className="flex-1 py-3 border border-line hover:bg-gray-50 text-ink rounded-full text-meta font-semibold transition-all cursor-pointer"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="btn-solid flex-1 cursor-pointer"
                >
                  Ver {filteredProperties.length} Propiedades
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// === COMPONENTE CAROUSEL SECTION ===
interface CarouselSectionProps {
  title: string;
  properties: Property[];
  /** Se recibe y se reenvía: las tarjetas del carrusel muestran el mismo
   *  precio en bolívares que las de la retícula. */
  tasaBcv: number | null;
  onSelectProperty: (property: Property) => void;
}

function CarouselSection({ title, properties, tasaBcv, onSelectProperty }: CarouselSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
    dragFree: true
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (properties.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {/* Título serif a la izquierda */}
        <h3 className="font-serif text-title md:text-headline text-brand font-medium tracking-tight">{title}</h3>
        
        {/* 2 flechas circulares outline a la derecha */}
        <div className="flex items-center gap-2">
          <button 
            onClick={scrollPrev}
            aria-label="Anterior slide"
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-gray-700 bg-white hover:bg-paper transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={scrollNext}
            aria-label="Siguiente slide"
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-gray-700 bg-white hover:bg-paper transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embla Carousel viewport wrapper */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="flex-none w-full sm:w-1/2 lg:w-1/4"
            >
              <PropertyCard
                property={property}
                tasaBcv={tasaBcv}
                onSelect={() => onSelectProperty(property)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === COMPONENTE CARD DE PROPIEDAD ===
/** «Bs. 121.794,67» — separadores de Venezuela: punto para miles, coma decimal. */
function bolivares(n: number, decimales = 2): string {
  return `Bs. ${n.toLocaleString('es-VE', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

interface PropertyCardProps {
  property: Property;
  /** Bolívares por dólar (tasa USDT; BCV si falta). Null mientras no llega o si la consulta falló. */
  tasaBcv: number | null;
  onSelect: () => void;
}

function PropertyCard({ property, tasaBcv, onSelect }: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const capacidad = property.guestsAllowed.adults + property.guestsAllowed.children;

  // Solo se convierte cuando hay un precio de verdad: en las propiedades con
  // «Consultar precio» el número es 0 y mostrar «Bs. 0,00» sería peor que no
  // mostrar nada.
  const precioBs =
    tasaBcv && !property.priceOnRequest && property.pricePerNight > 0
      ? property.pricePerNight * tasaBcv
      : null;

  return (
    <article
      onClick={onSelect}
      /* Antes había dos `transition-all` y un `hover:shadow-hard` peleando con un
         `hover:shadow-[...]` arbitrario: la última clase ganaba y la otra era
         ruido. Ahora una sola transición, sobre las tres propiedades que de
         verdad cambian. */
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border border-line bg-white transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift-lg"
    >
      {/* Con cuatro alojamientos en vez de doce la foto puede ocupar mucho más,
          y es lo que de verdad vende un alquiler. 3:2 en lugar de 4:3 da un
          encuadre más editorial y menos de catálogo. */}
      <div className="relative aspect-[3/2] w-full overflow-hidden">
        {/* El alt lleva zona e isla, no solo el nombre: es lo que posiciona
            estas fotos en Google Imágenes, que en viajes es tráfico real.
            Dimensiones explícitas para no provocar salto de layout. */}
        <img
          src={property.image}
          alt={`${property.name} — alquiler en ${property.zone}, Isla de Margarita`}
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          referrerPolicy="no-referrer"
        />

        {/* Degradado solo en el tercio inferior: da contraste a la zona sin
            apagar la foto, que es el activo de la tarjeta. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent"
        />

        {/* Categoría arriba a la izquierda, en vidrio como el resto del sitio */}
        <div className="absolute left-4 top-4 flex gap-1.5">
          {property.categories.slice(0, 1).map((cat) => (
            <span
              key={cat}
              className="label-eyebrow rounded-chip border border-white/40 bg-white/80 px-2.5 py-1.5 text-brand-deep backdrop-blur-sm"
            >
              {cat}
            </span>
          ))}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          aria-label={isLiked ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-white/80 backdrop-blur-sm transition-colors hover:bg-white"
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? 'fill-coral text-coral' : 'text-ink-muted'}`} />
        </button>

        {/* Zona sobre el degradado: ubica el alojamiento antes de leer el nombre */}
        <p className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
          <MapPin className="h-3.5 w-3.5 stroke-[1.6]" aria-hidden="true" />
          <span className="label-eyebrow text-white">{property.zone}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          {/* SEO: el nombre es un enlace <a> real a la página de la propiedad.
              Antes la tarjeta solo tenía onClick, y en el HTML que recibe Google
              la portada no enlazaba a NINGÚN apartamento: los /propiedad/ eran
              huérfanos, solo conocidos por el sitemap. El drawer sigue abriendo
              al tocar el resto de la tarjeta; el título lleva a la página
              canónica, que es lo que queremos que se indexe y se comparta. */}
          <h4 className="font-serif text-title-sm font-semibold text-brand track-title">
            <Link
              href={`/propiedad/${property.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline underline-offset-4"
            >
              {property.name}
            </Link>
          </h4>

          {/* La valoración se muestra SOLO en inventario real. Los listados de
              relleno llevan ratings inventados (4.6–5.0) y enseñárselos al
              visitante es pedirle que confíe en un dato falso — el mismo motivo
              por el que lib/schema.ts no emite aggregateRating. */}
          {property.isReal && property.rating !== null && (
            <span className="mono-data flex shrink-0 items-center gap-1 text-ink-muted">
              <Star className="h-3.5 w-3.5 fill-brand text-brand" aria-hidden="true" />
              {property.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="text-meta text-ink-soft line-clamp-2">{property.description}</p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="label-eyebrow flex items-center gap-1.5 text-ink-faint">
              <Users className="h-3.5 w-3.5 stroke-[1.6]" aria-hidden="true" />
              Hasta {capacidad} huéspedes
            </p>
            {/* El bolívar manda: es la moneda de curso legal y lo que se paga.
                El dólar queda como referencia del catálogo. */}
            {precioBs !== null ? (
              <>
                <p className="mt-1.5 truncate font-serif text-title text-ink track-title">
                  Bs. {precioBs.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </p>
                <p className="mono-data text-ink-muted">Ref. {property.priceText} · USDT</p>
              </>
            ) : (
              <p className="mt-1.5 truncate font-serif text-title text-ink track-title">
                {property.priceText}
              </p>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            aria-label={`Ver detalles de ${property.name}`}
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-deep"
          >
            <ArrowRight className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
