'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Globe, 
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
  CheckCircle2, 
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

// Los datos de listados, amenities y categorías viven en lib/listings.ts:
// el sitemap y las páginas de zona necesitan los mismos datos y no pueden
// importarlos desde este componente 'use client'.
import {
  AMENITIES_CENTRO,
  AMENITIES_LOS_GERANIOS,
  AMENITIES_LUJO,
  AMENITIES_PLAYA,
  CATEGORIES,
  PROPERTIES,
  ZONES,
  type Property,
} from '@/lib/listings';
import {
  AboutIslandSection,
  FaqSection,
  ZoneLinksSection,
} from '@/components/SeoSections';

export default function Home() {
  // Navigation active links
  const [activeNavLink, setActiveNavLink] = useState('Inicio');

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

  // Reservation Flow state (Success State)
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingNights, setBookingNights] = useState(2);
  const [bookingGuests, setBookingGuests] = useState(1);

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
    result = result.filter(p => (p.priceOnRequest || p.pricePerNight <= filterMaxPrice) && p.rating >= filterMinRating);

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
    <div className="min-h-screen bg-white text-ink pb-24 relative overflow-x-hidden">

      {/* 1. NAVBAR (Fija Arriba) */}
      <nav id="navbar-floating" className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 md:px-8 md:pt-6">
        {/* La navbar usa la escala de INTERFAZ (text-ui), no la de contenido.
            En la primera pasada de rediseño se le aplicó tipografía de cuerpo y
            objetivos táctiles de 46px, y creció de ~62px a ~82px: quedó
            gruesa. Una barra fija compite con el contenido por espacio
            vertical, así que acá manda la densidad. Los 44px táctiles siguen
            valiendo para las acciones del contenido, no para el chrome de
            escritorio. */}
        <div className="bg-brand text-white rounded-panel px-5 py-3 md:px-7 md:py-3 shadow-[0_6px_24px_-6px_rgba(22,33,31,0.28)] max-w-7xl mx-auto flex items-center justify-between border border-white/10">

          {/* Izquierda: Logo + Nombre */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={handleResetSearch}>
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/logo-mark-white.svg" alt="Margarita Renace" className="w-full h-full object-contain" />
            </div>
            <span className="font-serif text-ui-lg md:text-body font-semibold tracking-wide text-white leading-none whitespace-nowrap">Margarita<span className="text-accent"> Renace</span></span>
          </div>

          {/* Centro: Links de Navegación */}
          <div className="hidden md:flex items-center gap-0.5 bg-white/10 rounded-control p-1 border border-white/10">
            {['Inicio', 'Apartamentos', 'Autos'].map((link) => (
              <button
                key={link}
                onClick={() => setActiveNavLink(link)}
                className={`px-4 py-2 rounded-chip text-ui font-medium tracking-wide transition-all ${
                  activeNavLink === link
                    ? 'bg-white text-brand'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Derecha: Become a Host + Íconos */}
          <div className="flex items-center gap-1.5 md:gap-3">
            <span className="hidden lg:inline text-ui font-medium text-white/75 tracking-wide hover:text-white transition-colors cursor-pointer">
              Publica tu Propiedad
            </span>

            <button
              aria-label="Seleccionar idioma"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/35 transition-all cursor-pointer"
            >
              <Globe className="w-[17px] h-[17px]" />
            </button>

            <button
              aria-label="Menú de navegación"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/35 transition-all cursor-pointer"
            >
              <Menu className="w-[17px] h-[17px]" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-36">
        
        {/* 2. HERO a pantalla completa, de borde a borde */}
        <div id="hero-frame" className="relative w-screen left-1/2 -translate-x-1/2 -mt-28 md:-mt-36 mb-20">
          <section id="hero-banner" className="relative w-full overflow-hidden" style={{ height: '580px' }}>
            {/* Hero background image: playa de Margarita */}
            {/* Esta imagen es la LCP de la página. Va con fetchPriority alto y
                sin lazy para que el navegador la pida de inmediato: en
                Venezuela, donde la conexión es lenta, la LCP es la métrica que
                decide si la página se siente rápida o no. width/height fijan la
                relación de aspecto y eliminan el salto de layout (CLS). */}
            <img
              src="/images/photo-1507525428034.jpg"
              alt="Playa del Caribe en Isla de Margarita, Venezuela"
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            {/* Overlay con degradado color Caribe */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand/50 via-accent/30 to-brand/60 flex flex-col items-center justify-center text-center px-4">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-meta md:text-body font-medium tracking-[0.25em] uppercase text-white/95 mb-3"
              >
                Isla de Margarita · Venezuela
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-display text-white font-light leading-tight max-w-3xl mb-4 tracking-tight drop-shadow-lg"
              >
                Vive la Isla como en Casa
                {/* La frase de marca no tiene ninguna palabra por la que
                    alguien busque. El h1 es la señal de tema más fuerte de una
                    página, así que la keyword real va DENTRO del mismo h1, en
                    una segunda línea de menor jerarquía visual: el diseño no
                    cambia y el encabezado deja de estar vacío para búsquedas. */}
                <span className="mt-3 block font-sans text-title-sm md:text-title font-light tracking-normal text-white/95">
                  Alquiler de apartamentos y autos en Isla de Margarita
                </span>
              </motion.h1>
              <p className="text-white/90 text-body font-light max-w-lg mb-2">
                Alojamientos en Pampatar, Porlamar, Costa Azul, El Yaque, Juan
                Griego y más zonas de la isla · Precios en US$
              </p>
              <div className="w-12 h-[2px] bg-accent my-2 rounded-full"></div>
            </div>

            {/* Curva blanca de transición hacia el contenido */}
            <svg
              className="absolute bottom-0 left-0 w-full h-[90px] md:h-[130px]"
              viewBox="0 0 1440 130"
              fill="none"
              preserveAspectRatio="none"
            >
              <path d="M0,85 C480,20 960,20 1440,95 L1440,130 L0,130 Z" fill="white" fillOpacity="0.45" />
              <path d="M0,105 C480,45 960,45 1440,115 L1440,130 L0,130 Z" fill="white" />
            </svg>
          </section>

          {/* SEARCH BAR Flotante sobre el borde inferior */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div ref={searchBarRef} className="flex flex-col gap-1.5">
              
              {/* Dropdown "All" a la izquierda en tab blanco separado */}
              <div className="self-start">
                <button
                  onClick={() => handleResetSearch()}
                  className="bg-white text-brand text-meta font-semibold px-5 py-2.5 rounded-chip shadow-lift flex items-center gap-2 border border-line hover:bg-paper transition-all"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Ver Todo</span>
                </button>
              </div>

              {/* Barra vidrio esmerilado píldora */}
              <div className="bg-white rounded-full p-2.5 shadow-[0_8px_32px_rgba(0,115,128,0.14)] border border-line flex flex-wrap md:flex-nowrap items-center justify-between w-full">

                {/* 1. Where */}
                <div
                  onClick={() => setActivePopover(activePopover === 'where' ? null : 'where')}
                  className={`flex-1 min-w-[120px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
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
                  className={`flex-1 min-w-[100px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
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
                  className={`flex-1 min-w-[100px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
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
                  className={`flex-1 min-w-[120px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
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
                  className="w-11 h-11 rounded-full bg-brand hover:bg-brand-deep text-white flex items-center justify-center transition-all shadow-md ml-2 cursor-pointer shrink-0"
                >
                  <Search className="w-5 h-5" />
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
                      <h4 className="text-meta uppercase tracking-[0.15em] font-semibold text-gray-400">Destinos Exclusivos</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['Goa, India', 'Kodaikanal, India', 'Uluwatu, Bali', 'Lake Como, Italy', 'Wadi Rum, Jordan', 'Lofoten, Norway', 'Ubud, Bali', 'Malibu, USA', 'Santorini, Greece', 'Zermatt, Switzerland'].map((dest) => (
                        <button
                          key={dest}
                          onClick={() => {
                            setSearchWhere(dest);
                            setActivePopover('dates'); // auto transition
                          }}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-line/40 hover:border-ink hover:bg-paper text-left transition-all text-meta font-medium text-gray-700 hover:text-black"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                          <span className="truncate">{dest}</span>
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
                const IconComponent = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
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

            {/* Botón "Filters" píldora con gradiente turquesa */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="btn-solid cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filtros</span>
            </button>
          </div>
        </section>

        {/* 4. SECCIONES DE LISTADOS */}
        <section id="listings-container" className="space-y-16">
          {selectedCategory === 'All' && !searchWhere.trim() ? (
            // DISPLAY ALL 3 CURATED SECTIONS
            <>
              {/* Section 1: Destacados en Margarita */}
              <CarouselSection
                title="Destacados en Margarita"
                properties={getCuratedSection1()} 
                onSelectProperty={(p) => {
                  setSelectedProperty(p);
                  setIsDetailOpen(true);
                  setBookingConfirmed(false);
                }}
              />

              {/* Section 2: Selección Premium */}
              <CarouselSection
                title="Selección Premium"
                properties={getCuratedSection2()} 
                onSelectProperty={(p) => {
                  setSelectedProperty(p);
                  setIsDetailOpen(true);
                  setBookingConfirmed(false);
                }}
              />

              {/* Section 3: Escapadas Frente al Mar */}
              <CarouselSection
                title="Escapadas Frente al Mar"
                properties={getCuratedSection3()} 
                onSelectProperty={(p) => {
                  setSelectedProperty(p);
                  setIsDetailOpen(true);
                  setBookingConfirmed(false);
                }}
              />
            </>
          ) : (
            // DISPLAY SINGLE FILTERED LIST SECTION WITH GRID
            <div>
              <div className="flex justify-between items-end mb-8 border-b border-line pb-4">
                <div>
                  <h2 className="font-serif text-title md:text-headline text-brand font-medium">
                    {selectedCategory !== 'Todos' ? `Colección ${selectedCategory}` : 'Explora Margarita Renace'}
                  </h2>
                  <p className="text-meta text-ink-muted mt-1 font-medium">
                    {filteredProperties.length} propiedades exclusivas encontradas
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredProperties.map((property) => (
                    <PropertyCard 
                      key={property.id} 
                      property={property} 
                      onSelect={() => {
                        setSelectedProperty(property);
                        setIsDetailOpen(true);
                        setBookingConfirmed(false);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center max-w-md mx-auto">
                  <Smile className="w-12 h-12 text-gray-300 mx-auto mb-4 stroke-[1.2]" />
                  <h3 className="font-serif text-title-sm text-brand font-semibold mb-1">Sin resultados exactos</h3>
                  <p className="text-meta text-ink-muted mb-6">No encontramos alojamientos disponibles con esos filtros. Intenta disminuyendo tus requisitos o buscando otra zona.</p>
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
        <ZoneLinksSection />
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

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                
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
                </div>

                {/* Host Info */}
                <div className="p-4 bg-paper rounded-2xl border border-line flex items-center gap-4">
                  <img 
                    src={selectedProperty.host.avatar} 
                    alt={selectedProperty.host.name} 
                    className="w-12 h-12 rounded-full object-cover shadow-xs border border-line"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-meta font-semibold text-ink">Hospedado por {selectedProperty.host.name}</p>
                    <p className="text-micro text-ink-muted font-medium mt-0.5">{selectedProperty.host.tagline}</p>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-meta uppercase tracking-wider font-semibold text-gray-400 mb-3">Servicios Premium Incluidos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.amenities.map((amenity, idx) => {
                      const Icon = amenity.icon;
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
                    <button
                      onClick={() => setBookingConfirmed(true)}
                      className="btn-solid w-full mt-3 cursor-pointer"
                    >
                      <span>Consultar disponibilidad</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : !bookingConfirmed ? (
                  <div className="p-5 bg-white rounded-2xl border border-line shadow-sm space-y-4">
                    <div className="flex justify-between items-baseline border-b border-line pb-3">
                      <div>
                        <span className="text-title-sm font-semibold text-accent">US${selectedProperty.pricePerNight.toLocaleString()}</span>
                        <span className="text-meta text-gray-500 font-medium"> / noche</span>
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
                          {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
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

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-meta text-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span>Estadía de {bookingNights} {bookingNights === 1 ? 'noche' : 'noches'}</span>
                        <span>US${(selectedProperty.pricePerNight * bookingNights).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa de limpieza</span>
                        <span>US$10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa de servicio</span>
                        <span>US$8</span>
                      </div>
                      <div className="flex justify-between font-semibold text-brand border-t border-line pt-3 text-body">
                        <span>Total estimado</span>
                        <span>US${(selectedProperty.pricePerNight * bookingNights + 10 + 8).toLocaleString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setBookingConfirmed(true)}
                      className="btn-solid w-full mt-4 cursor-pointer"
                    >
                      <span>Reservar ahora</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-micro text-center text-gray-400 mt-2 font-medium">Aún no se te cobrará ningún importe oficial</p>
                  </div>
                ) : (
                  // BOOKING SUCCESS STATE
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-green-50/50 rounded-2xl border border-green-100 text-center space-y-4"
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto stroke-[1.5]" />
                    <div>
                      <h3 className="font-serif text-title-sm font-semibold text-green-900">¡Reserva Solicitada con Éxito!</h3>
                      <p className="text-meta text-green-700 mt-1 max-w-xs mx-auto">
                        Tu solicitud para <strong>{selectedProperty.name}</strong> ha sido pre-aprobada. El anfitrión te responderá en breve.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-green-100/60 max-w-xs mx-auto text-left text-meta space-y-1 text-gray-700">
                      <p><strong>Ubicación:</strong> {selectedProperty.location}</p>
                      <p><strong>Noches:</strong> {bookingNights} noches</p>
                      <p><strong>Huéspedes:</strong> {bookingGuests} {bookingGuests === 1 ? 'persona' : 'personas'}</p>
                      <p className="pt-2 border-t border-gray-100 font-semibold text-black">
                        {selectedProperty.priceOnRequest
                          ? 'Te confirmaremos el precio según temporada'
                          : `Total: US$${(selectedProperty.pricePerNight * bookingNights + 10 + 8).toLocaleString()}`}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsDetailOpen(false)}
                      className="btn-solid"
                    >
                      Explorar otros destinos
                    </button>
                  </motion.div>
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

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
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
  onSelectProperty: (property: Property) => void;
}

function CarouselSection({ title, properties, onSelectProperty }: CarouselSectionProps) {
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
              <PropertyCard property={property} onSelect={() => onSelectProperty(property)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// === COMPONENTE CARD DE PROPIEDAD ===
interface PropertyCardProps {
  property: Property;
  onSelect: () => void;
}

function PropertyCard({ property, onSelect }: PropertyCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div 
      onClick={onSelect}
      className="group bg-white border border-line rounded-card overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-ink hover:shadow-hard h-full transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,115,128,0.15)] hover:border-brand/40 hover:-translate-y-0.5"
    >
      
      {/* Imagen arriba con border-radius 16px y ratio 4:3 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[16px]">
        {/* El alt lleva zona e isla, no solo el nombre: es lo que posiciona
            estas fotos en Google Imágenes, que en viajes es una fuente de
            tráfico real. lazy + dimensiones para no bloquear la carga ni
            provocar salto de layout con 12 tarjetas en pantalla. */}
        <img
          src={property.image}
          alt={`${property.name} — alquiler en ${property.zone}, Isla de Margarita`}
          width={800}
          height={600}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          referrerPolicy="no-referrer"
        />

        {/* Favorite Icon */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          aria-label={isLiked ? "Quitar de favoritos" : "Guardar en favoritos"}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-paper transition-all shadow-sm z-10 cursor-pointer border border-line"
        >
          <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-coral text-coral' : 'text-gray-600'}`} />
        </button>

        {/* Category Tag Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {property.categories.slice(0, 1).map((cat) => (
            <span key={cat} className="label-eyebrow bg-ink/80 text-white px-2.5 py-1.5 rounded-chip">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Franja inferior con los datos del alojamiento */}
      <div className="px-4 py-3.5 bg-white flex items-center justify-between gap-3 relative border-t border-line">
        <div className="flex-1 min-w-0">
          {/* Nombre: 15px serif elegante negro */}
          <h4 className="font-serif text-body font-medium text-ink tracking-tight truncate group-hover:text-black transition-colors">{property.name}</h4>
          
          {/* Precio + estadía + rating en 12px gris */}
          <p className="text-meta text-ink-muted mt-1 font-medium truncate">
            {property.priceText} · ★ {property.rating}
          </p>
        </div>

        {/* Botón circular negro con flecha "→" blanca, esquina inferior derecha */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          aria-label={`Ver detalles de ${property.name}`}
          /* Sin anillo de tinta en reposo: son 12 tarjetas en pantalla y doce
             círculos con borde oscuro dejan de ser un acento para volverse el
             estilo. El borde aparece con el hover de la tarjeta, junto al resto
             del tratamiento. */
          className="w-10 h-10 rounded-full bg-brand hover:bg-brand-deep text-white flex items-center justify-center border border-transparent group-hover:border-ink transition-all shrink-0 cursor-pointer"
        >
          <ArrowRight className="w-[17px] h-[17px]" />
        </button>
      </div>

    </div>
  );
}
