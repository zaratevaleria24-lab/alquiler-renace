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
  Smile
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { motion, AnimatePresence } from 'motion/react';

// === PROPERTY DATASET ===
interface Property {
  id: string;
  name: string;
  location: string;
  priceText: string;
  pricePerNight: number;
  nightsCount: number;
  rating: number;
  categories: string[];
  image: string;
  gallery: string[];
  description: string;
  host: {
    name: string;
    avatar: string;
    tagline: string;
  };
  amenities: { icon: any; name: string }[];
  guestsAllowed: { adults: number; children: number };
}

const AMENITIES_POOL = [
  { icon: Waves, name: 'Infinite Pool' },
  { icon: Wifi, name: 'Wi-Fi de Alta Velocidad' },
  { icon: Coffee, name: 'Desayuno de Autor' },
  { icon: Flame, name: 'Chimenea / Calefacción' },
  { icon: Wind, name: 'Aire Acondicionado' }
];

const AMENITIES_CABIN = [
  { icon: Flame, name: 'Chimenea de Leña' },
  { icon: Wifi, name: 'Starlink Premium Wi-Fi' },
  { icon: Trees, name: 'Vistas al Bosque' },
  { icon: Coffee, name: 'Cafetera Espresso' },
  { icon: Wind, name: 'Jacuzzi Exterior' }
];

const AMENITIES_BEACH = [
  { icon: Umbrella, name: 'Acceso Privado Playa' },
  { icon: Wifi, name: 'Wi-Fi' },
  { icon: Wind, name: 'Aire Acondicionado' },
  { icon: Coffee, name: 'Chef Privado (Opcional)' },
  { icon: Sparkles, name: 'Terraza Panorámica' }
];

const PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Flat in Benaulim',
    location: 'Goa, India',
    priceText: '₹4,800 for 2 nights',
    pricePerNight: 2400,
    nightsCount: 2,
    rating: 4.8,
    categories: ['Beach', 'Amazing Pools'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Un refugio elegante a solo pasos de las arenas doradas de la playa de Benaulim, Goa. Este apartamento cuenta con un diseño arquitectónico con toques coloniales e indios, ideal para parejas y viajeros solitarios que buscan una estancia premium.',
    host: {
      name: 'Aditi Sharma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Superhost apasionada por el arte indio'
    },
    amenities: AMENITIES_BEACH,
    guestsAllowed: { adults: 2, children: 1 }
  },
  {
    id: '2',
    name: 'The Glass Cabin',
    location: 'Kodaikanal, India',
    priceText: '₹12,500 for 1 night',
    pricePerNight: 12500,
    nightsCount: 1,
    rating: 4.9,
    categories: ['Cabins', 'National Parks'],
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Disfruta de la niebla matutina de la montaña desde este santuario de madera y vidrio templado. Totalmente autosustentable, sumergido en un bosque de pinos centenarios en Kodaikanal. Una vista de 360 grados de la naturaleza.',
    host: {
      name: 'Vikram Iyer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Arquitecto y promotor del ecoturismo'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '3',
    name: 'Amarta Cliffside Suite',
    location: 'Uluwatu, Bali',
    priceText: '₹24,000 for 3 nights',
    pricePerNight: 8000,
    nightsCount: 3,
    rating: 4.95,
    categories: ['Amazing Pools', 'Islands', 'Beach'],
    image: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Colgada literalmente de los acantilados de Uluwatu, esta villa ofrece una piscina infinity infinita con vistas de ensueño al Océano Índico. Un lujo descalzo y minimalista para reconectar con el mar.',
    host: {
      name: 'Ketut Wijaya',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Bailarín y anfitrión balinés tradicional'
    },
    amenities: AMENITIES_POOL,
    guestsAllowed: { adults: 2, children: 0 }
  },
  {
    id: '4',
    name: 'Villa di Vetro, Como',
    location: 'Lake Como, Italy',
    priceText: '₹36,000 for 2 nights',
    pricePerNight: 18000,
    nightsCount: 2,
    rating: 4.92,
    categories: ['Lakefront', 'Amazing Pools'],
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Fusión de la elegancia neoclásica italiana con el minimalismo moderno. Villa di Vetro cuenta con paredes de yeso pulido y amplios ventanales orientados al lago de Como, muelle privado y una piscina de diseño excepcional.',
    host: {
      name: 'Francesca Rossi',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Diseñadora de modas y apasionada del lago Como'
    },
    amenities: AMENITIES_POOL,
    guestsAllowed: { adults: 6, children: 3 }
  },
  {
    id: '5',
    name: 'Luxury Wadi Rum Dome',
    location: 'Wadi Rum, Jordan',
    priceText: '₹18,200 for 1 night',
    pricePerNight: 18200,
    nightsCount: 1,
    rating: 4.88,
    categories: ['Camping', 'National Parks'],
    image: 'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Una experiencia de glamping de lujo en el majestuoso desierto de Wadi Rum. Estructuras geodésicas totalmente climatizadas con ventanales de cristal panorámicos para observar las constelaciones. Servicio de té tradicional beduino incluido.',
    host: {
      name: 'Sami Al-Bedouin',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Guía beduino certificado y astrónomo'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 2, children: 2 }
  },
  {
    id: '6',
    name: 'Cabin in Lofoten Islands',
    location: 'Lofoten, Norway',
    priceText: '₹14,500 for 2 nights',
    pricePerNight: 7250,
    nightsCount: 2,
    rating: 4.86,
    categories: ['Tiny Homes', 'Islands', 'Lakefront'],
    image: 'https://images.unsplash.com/photo-1525113990974-361be58cdf0b?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1525113990974-361be58cdf0b?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Refugio de pescadores reconvertido en santuario minimalista de madera de abeto. Situado a orillas de los fiordos árticos en Lofoten. Ideal para avistar la Aurora Boreal a través de su claraboya de cristal.',
    host: {
      name: 'Lars Thoresen',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Pescador local e historiador'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 2, children: 1 }
  },
  {
    id: '7',
    name: 'Bamboo Sanctuary Ubud',
    location: 'Ubud, Bali',
    priceText: '₹9,800 for 2 nights',
    pricePerNight: 4900,
    nightsCount: 2,
    rating: 4.79,
    categories: ['Cabins', 'Islands'],
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Increíble obra maestra de bambú levantada a mano sobre la selva tropical de Ubud. Vive una inmersión natural total sintiendo la suave brisa del monzón. Duchas exteriores de piedra de río.',
    host: {
      name: 'Wayan Sastra',
      avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Artesano de bambú sustentable'
    },
    amenities: AMENITIES_BEACH,
    guestsAllowed: { adults: 2, children: 0 }
  },
  {
    id: '8',
    name: 'Malibu Beachfront Studio',
    location: 'Malibu, USA',
    priceText: '₹45,000 for 3 nights',
    pricePerNight: 15000,
    nightsCount: 3,
    rating: 4.97,
    categories: ['Beach', 'Tiny Homes'],
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Un estudio de acero y cristal templado sobre la misma arena de la playa privada de Malibú. Diseñado por un famoso arquitecto minimalista californiano, destaca por su luminosidad infinita y vistas exclusivas.',
    host: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Curadora de galerías de arte en Los Ángeles'
    },
    amenities: AMENITIES_BEACH,
    guestsAllowed: { adults: 2, children: 1 }
  },
  {
    id: '9',
    name: 'Mirage Cabin Joshua Tree',
    location: 'Joshua Tree, USA',
    priceText: '₹22,000 for 1 night',
    pricePerNight: 22000,
    nightsCount: 1,
    rating: 4.91,
    categories: ['National Parks', 'Tiny Homes'],
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1525113990974-361be58cdf0b?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Un milagro visual revestido con espejos que reflejan el desierto eterno de Joshua Tree. Se funde perfectamente con el entorno de rocas rojas y cactus sagrados.',
    host: {
      name: 'David Carter',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Fotógrafo documental de paisajes'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 2, children: 0 }
  },
  {
    id: '10',
    name: 'Zermatt Peak Loft',
    location: 'Zermatt, Switzerland',
    priceText: '₹52,000 for 2 nights',
    pricePerNight: 26000,
    nightsCount: 2,
    rating: 4.98,
    categories: ['Cabins', 'National Parks'],
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Ubicado a las faldas del monte Cervino (Matterhorn), este lujoso ático fusiona la madera rústica alpina con los acabados más modernos del diseño contemporáneo suizo.',
    host: {
      name: 'Beatrix Gruber',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Ex-esquiadora profesional alpina'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 4, children: 2 }
  },
  {
    id: '11',
    name: 'Oia Plaster Cave Suite',
    location: 'Santorini, Greece',
    priceText: '₹29,500 for 2 nights',
    pricePerNight: 14750,
    nightsCount: 2,
    rating: 4.94,
    categories: ['Islands', 'Amazing Pools'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'Esculpida directamente sobre el imponente acantilado volcánico de Oia, esta cueva tradicional griega es hoy un lujoso apartamento que cuenta con piscina privada templada y vistas absolutas al Mar Egeo.',
    host: {
      name: 'Helena Sgouris',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Chef especializada en cocina tradicional griega'
    },
    amenities: AMENITIES_POOL,
    guestsAllowed: { adults: 2, children: 1 }
  },
  {
    id: '12',
    name: 'Eco-Glamp Patagonia',
    location: 'Patagonia, Chile',
    priceText: '₹16,800 for 2 nights',
    pricePerNight: 8400,
    nightsCount: 2,
    rating: 4.87,
    categories: ['Camping', 'National Parks'],
    image: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1533873984035-25970ab07461?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=600&q=80'
    ],
    description: 'En el corazón de Torres del Paine se ubica este domo ecológico premium de alta montaña. Ofrece protección contra el viento extremo patagónico mientras descansas bajo las estrellas australes en un lujo absoluto.',
    host: {
      name: 'Manuel Oyarzo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
      tagline: 'Guía de senderismo experto en glaciares'
    },
    amenities: AMENITIES_CABIN,
    guestsAllowed: { adults: 2, children: 0 }
  }
];

// === CATEGORIES METADATA ===
const CATEGORIES = [
  { id: 'All', label: 'All', icon: Compass },
  { id: 'Lakefront', label: 'Lakefront', icon: Waves },
  { id: 'National Parks', label: 'National Parks', icon: Trees },
  { id: 'Cabins', label: 'Cabins', icon: HomeIcon },
  { id: 'Islands', label: 'Islands', icon: Palmtree },
  { id: 'Beach', label: 'Beach', icon: Umbrella },
  { id: 'Tiny Homes', label: 'Tiny Homes', icon: Box },
  { id: 'Camping', label: 'Camping', icon: Tent },
  { id: 'Amazing Pools', label: 'Amazing Pools', icon: Sparkles }
];

export default function Home() {
  // Navigation active links
  const [activeNavLink, setActiveNavLink] = useState('Home');

  // Interactive categories navigation state
  const [selectedCategory, setSelectedCategory] = useState('All');
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
  const [filterMaxPrice, setFilterMaxPrice] = useState(60000);
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
    if (selectedCategory !== 'All') {
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
    result = result.filter(p => p.pricePerNight <= filterMaxPrice && p.rating >= filterMinRating);

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
    setSelectedCategory('All');
    setFilterMaxPrice(60000);
    setFilterMinRating(4.5);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] pb-24 relative overflow-x-hidden">
      
      {/* 1. NAVBAR (Fija Arriba) */}
      <nav id="navbar-floating" className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 md:px-8 md:pt-6">
        <div className="bg-[#1A1A1A] text-white rounded-[20px] px-5 py-3 md:px-8 md:py-3.5 shadow-lg max-w-7xl mx-auto flex items-center justify-between border border-white/10 backdrop-blur-md">
          
          {/* Izquierda: Logo + Nombre */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleResetSearch}>
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center p-1.5 shadow-sm">
              {/* Geometic Mountain Logo */}
              <svg viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2.5" className="w-full h-full">
                <path d="M3 20L10 6L14 13L17 9L21 20H3Z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-serif text-lg md:text-xl font-semibold tracking-wide text-white">Apex</span>
          </div>

          {/* Centro: Links de Navegación */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            {['Home', 'Experiences', 'Services'].map((link) => (
              <button
                key={link}
                onClick={() => setActiveNavLink(link)}
                className={`px-5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all ${
                  activeNavLink === link 
                    ? 'bg-[#333333] text-white shadow-sm' 
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link}
              </button>
            ))}
          </div>

          {/* Derecha: Become a Host + Íconos */}
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden lg:inline text-xs font-medium text-gray-200 tracking-wide hover:text-white transition-colors cursor-pointer">
              Become a Host
            </span>
            
            <button 
              aria-label="Seleccionar idioma"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4" />
            </button>

            <button 
              aria-label="Menú de navegación"
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-28 md:pt-36">
        
        {/* 2. HERO (Framed inside an elegant editorial passe-partout block) */}
        <div id="hero-frame" className="bg-white border border-[#E2DDD5] p-3 md:p-4 rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] mb-12 relative">
          <section id="hero-banner" className="relative w-full rounded-[20px] overflow-hidden" style={{ height: '420px' }}>
            {/* Hero background image */}
            <img 
              src="https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=1600&h=900&q=80" 
              alt="Interior premium con arco arquitectónico" 
              className="w-full h-full object-cover transition-transform duration-[2000ms] ease-out hover:scale-[1.03]"
              referrerPolicy="no-referrer"
            />
            {/* Overlay oscuro con 45% de opacidad */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs md:text-sm font-medium tracking-[0.25em] uppercase text-white/95 mb-3"
              >
                Find Your Dream Place
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-4xl md:text-[56px] text-white font-light leading-tight max-w-2xl mb-4 tracking-tight"
              >
                For Better Experience
              </motion.h1>
              <div className="w-12 h-[1px] bg-white/35 my-2"></div>
            </div>
          </section>

          {/* SEARCH BAR Flotante sobre el borde inferior */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-4xl px-4 z-20">
            <div ref={searchBarRef} className="flex flex-col gap-1.5">
              
              {/* Dropdown "All" a la izquierda en tab blanco separado */}
              <div className="self-start">
                <button 
                  onClick={() => handleResetSearch()}
                  className="bg-white text-[#1A1A1A] text-xs font-semibold px-5 py-2 rounded-full shadow-md flex items-center gap-1.5 border border-[#E8E8E8] hover:bg-[#FAFAF8] transition-all"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>All Places</span>
                </button>
              </div>

              {/* Barra blanca píldora */}
              <div className="bg-white rounded-full p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#E2DDD5] flex flex-wrap md:flex-nowrap items-center justify-between w-full">
                
                {/* 1. Where */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'where' ? null : 'where')}
                  className={`flex-1 min-w-[120px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
                    activePopover === 'where' ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <label className="block text-[10px] uppercase font-semibold text-[#1A1A1A] tracking-wider mb-0.5">Where</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={searchWhere || 'Search destinations'}
                    className={`bg-transparent text-xs text-[#6B6B6B] border-none outline-none w-full cursor-pointer font-medium p-0 leading-tight ${
                      searchWhere ? 'text-[#1A1A1A]' : 'text-[#6B6B6B]'
                    }`}
                  />
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-[#E2DDD5]" />

                {/* 2. Check In */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                  className={`flex-1 min-w-[100px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
                    activePopover === 'dates' ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <label className="block text-[10px] uppercase font-semibold text-[#1A1A1A] tracking-wider mb-0.5">Check In</label>
                  <span className="text-xs text-[#6B6B6B] font-medium block overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                    {searchCheckIn || 'Add date'}
                  </span>
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-[#E2DDD5]" />

                {/* 3. Check Out */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'dates' ? null : 'dates')}
                  className={`flex-1 min-w-[100px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
                    activePopover === 'dates' ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <label className="block text-[10px] uppercase font-semibold text-[#1A1A1A] tracking-wider mb-0.5">Check Out</label>
                  <span className="text-xs text-[#6B6B6B] font-medium block overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                    {searchCheckOut || 'Add date'}
                  </span>
                </div>

                <div className="hidden md:block h-8 w-[1px] bg-[#E2DDD5]" />

                {/* 4. Who */}
                <div 
                  onClick={() => setActivePopover(activePopover === 'guests' ? null : 'guests')}
                  className={`flex-1 min-w-[120px] px-5 py-1.5 rounded-full cursor-pointer transition-colors ${
                    activePopover === 'guests' ? 'bg-[#FAF8F5]' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <label className="block text-[10px] uppercase font-semibold text-[#1A1A1A] tracking-wider mb-0.5">Who</label>
                  <span className="text-xs text-[#1A1A1A] font-semibold block leading-tight">
                    {guestCount.adults + guestCount.children + guestCount.infants > 0 
                      ? `${guestCount.adults + guestCount.children} guests` 
                      : 'Add guests'}
                  </span>
                </div>

                {/* Search Button */}
                <button 
                  onClick={() => handleSearch()}
                  aria-label="Buscar propiedades"
                  className="w-11 h-11 rounded-full bg-[#1A1A1A] hover:bg-black text-white flex items-center justify-center transition-all shadow-md ml-2 cursor-pointer shrink-0"
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
                    className="absolute top-full left-0 right-0 md:left-4 md:right-auto md:w-96 mt-2 bg-white rounded-2xl border border-[#E2DDD5] shadow-2xl p-5 z-50 text-[#1A1A1A]"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-gray-400">Destinos Exclusivos</h4>
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
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E2DDD5]/40 hover:border-[#1A1A1A] hover:bg-[#FAF8F5] text-left transition-all text-xs font-medium text-gray-700 hover:text-black"
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
                    className="absolute top-full left-0 right-0 md:left-48 md:right-auto md:w-80 mt-2 bg-white rounded-2xl border border-[#E2DDD5] shadow-2xl p-5 z-50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-gray-400">Fechas de Estadía</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    
                    {/* Simulated Predefined Dates */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Check-in</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['22 Jul', '24 Jul', '28 Jul', '02 Ago', '10 Ago', 'Omitir'].map((d) => (
                            <button
                              key={d}
                              onClick={() => {
                                  if (d !== 'Omitir') setSearchCheckIn(d + ' 2026');
                                  else setSearchCheckIn('');
                              }}
                              className={`py-1 px-2 text-xs rounded-lg border text-center font-medium transition-all ${
                                searchCheckIn.startsWith(d)
                                  ? 'bg-[#1A1A1A] text-white border-black'
                                  : 'border-[#E2DDD5]/40 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Check-out</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {['25 Jul', '28 Jul', '02 Ago', '05 Ago', '15 Ago', 'Omitir'].map((d) => (
                            <button
                              key={d}
                              onClick={() => {
                                if (d !== 'Omitir') setSearchCheckOut(d + ' 2026');
                                else setSearchCheckOut('');
                                if (searchCheckIn) setActivePopover('guests'); // auto step
                              }}
                              className={`py-1 px-2 text-xs rounded-lg border text-center font-medium transition-all ${
                                searchCheckOut.startsWith(d)
                                  ? 'bg-[#1A1A1A] text-white border-black'
                                  : 'border-[#E2DDD5]/40 text-gray-600 hover:border-gray-400'
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
                    className="absolute top-full right-0 left-0 md:left-auto md:right-4 md:w-80 mt-2 bg-white rounded-2xl border border-[#E2DDD5] shadow-2xl p-5 z-50 text-[#1A1A1A]"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs uppercase tracking-[0.15em] font-bold text-gray-400">Número de Huéspedes</h4>
                      <X className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => setActivePopover(null)} />
                    </div>
                    <div className="space-y-4">
                      {/* Adultos */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">Adultos</p>
                          <p className="text-[10px] text-gray-400 font-medium">Desde 13 años</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.adults <= 1}
                            onClick={() => setGuestCount({ ...guestCount, adults: guestCount.adults - 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F5]"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{guestCount.adults}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, adults: guestCount.adults + 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold hover:bg-[#FAF8F5]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Niños */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">Niños</p>
                          <p className="text-[10px] text-gray-400 font-medium">Edades 2 - 12</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.children <= 0}
                            onClick={() => setGuestCount({ ...guestCount, children: guestCount.children - 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F5]"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{guestCount.children}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, children: guestCount.children + 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold hover:bg-[#FAF8F5]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bebés */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">Bebés</p>
                          <p className="text-[10px] text-gray-400 font-medium">Menos de 2 años</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            disabled={guestCount.infants <= 0}
                            onClick={() => setGuestCount({ ...guestCount, infants: guestCount.infants - 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#FAF8F5]"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{guestCount.infants}</span>
                          <button 
                            onClick={() => setGuestCount({ ...guestCount, infants: guestCount.infants + 1 })}
                            className="w-8 h-8 rounded-full border border-[#E2DDD5] flex items-center justify-center text-xs font-bold hover:bg-[#FAF8F5]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSearch()}
                        className="w-full bg-[#1A1A1A] hover:bg-black text-white py-2 rounded-full text-xs font-medium tracking-wide mt-2"
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
        <section id="categories-navigation" className="mt-16 mb-12 flex items-center justify-between gap-4 border-b border-[#E2DDD5] pb-4">
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all shrink-0 focus:outline-none border text-xs font-semibold tracking-wide ${
                      isActive 
                        ? 'text-white bg-[#1A1A1A] border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.08)]' 
                        : 'text-[#6B6B6B] hover:text-[#1A1A1A] border-[#E2DDD5]/60 hover:border-[#1A1A1A] bg-white/60'
                    }`}
                  >
                    <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'stroke-[1.6]'}`} />
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
              className="w-9 h-9 rounded-full border border-[#E2DDD5] flex items-center justify-center text-gray-700 bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Botón "Filters" píldora negra con ícono */}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-transparent"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </section>

        {/* 4. SECCIONES DE LISTADOS */}
        <section id="listings-container" className="space-y-16">
          {selectedCategory === 'All' && !searchWhere.trim() ? (
            // DISPLAY ALL 3 CURATED SECTIONS
            <>
              {/* Section 1: Trending Getaways */}
              <CarouselSection 
                title="Trending Getaways" 
                properties={getCuratedSection1()} 
                onSelectProperty={(p) => {
                  setSelectedProperty(p);
                  setIsDetailOpen(true);
                  setBookingConfirmed(false);
                }}
              />

              {/* Section 2: Editor's Architectural Picks */}
              <CarouselSection 
                title="Editor's Architectural Picks" 
                properties={getCuratedSection2()} 
                onSelectProperty={(p) => {
                  setSelectedProperty(p);
                  setIsDetailOpen(true);
                  setBookingConfirmed(false);
                }}
              />

              {/* Section 3: Secluded Nature Escapes */}
              <CarouselSection 
                title="Secluded Nature Escapes" 
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
              <div className="flex justify-between items-end mb-8 border-b border-[#E8E8E8] pb-4">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl text-[#2B2B2B] font-semibold">
                    {selectedCategory !== 'All' ? `${selectedCategory} Collection` : 'Explora Apex'}
                  </h2>
                  <p className="text-xs text-[#6B6B6B] mt-1 font-medium">
                    {filteredProperties.length} propiedades exclusivas encontradas
                  </p>
                </div>
                {searchWhere.trim() && (
                  <button 
                    onClick={handleResetSearch}
                    className="text-xs font-semibold border-b border-black text-black hover:opacity-70 transition-all"
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
                  <h3 className="font-serif text-lg text-[#2B2B2B] font-semibold mb-1">Sin resultados exactos</h3>
                  <p className="text-xs text-[#6B6B6B] mb-6">No encontramos alojamientos disponibles con esos filtros. Intenta disminuyendo tus requisitos o buscando otra zona.</p>
                  <button 
                    onClick={handleResetSearch}
                    className="bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all"
                  >
                    Restablecer Búsqueda
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

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
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 text-[#1A1A1A]"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2DDD5]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#2B2B2B]">Detalles de la Reserva</h3>
                  <p className="text-[11px] text-gray-400 font-medium tracking-wide uppercase mt-0.5">{selectedProperty.location}</p>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  aria-label="Cerrar detalles"
                  className="w-8 h-8 rounded-full hover:bg-[#FAF8F5] flex items-center justify-center text-gray-500 hover:text-black transition-colors"
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
                      alt={selectedProperty.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProperty.gallery.map((imgUrl, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-[#E2DDD5]/40 shadow-xs">
                        <img 
                          src={imgUrl} 
                          alt={`Gallery image ${idx}`} 
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
                      <h2 className="font-serif text-2xl font-medium text-[#2B2B2B] tracking-tight">{selectedProperty.name}</h2>
                      <p className="text-xs text-[#6B6B6B] mt-0.5 font-medium">{selectedProperty.location}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#FAF8F5] text-amber-800 border border-[#E2DDD5]/60 rounded-full px-3 py-1 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                      <span>{selectedProperty.rating}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-normal">{selectedProperty.description}</p>
                </div>

                {/* Host Info */}
                <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD5] flex items-center gap-4">
                  <img 
                    src={selectedProperty.host.avatar} 
                    alt={selectedProperty.host.name} 
                    className="w-12 h-12 rounded-full object-cover shadow-xs border border-[#E2DDD5]"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#1A1A1A]">Hospedado por {selectedProperty.host.name}</p>
                    <p className="text-[11px] text-[#6B6B6B] font-medium mt-0.5">{selectedProperty.host.tagline}</p>
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-3">Servicios Premium Incluidos</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedProperty.amenities.map((amenity, idx) => {
                      const Icon = amenity.icon;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                          <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#E2DDD5]/30 flex items-center justify-center text-gray-500">
                            <Icon className="w-4 h-4 stroke-[1.8]" />
                          </div>
                          <span className="font-medium">{amenity.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Booking Calculator */}
                {!bookingConfirmed ? (
                  <div className="p-5 bg-white rounded-2xl border border-[#E2DDD5] shadow-sm space-y-4">
                    <div className="flex justify-between items-baseline border-b border-[#E2DDD5] pb-3">
                      <div>
                        <span className="text-lg font-bold text-black">₹{selectedProperty.pricePerNight.toLocaleString()}</span>
                        <span className="text-xs text-gray-500 font-medium"> / noche</span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">Capacidad máx: {selectedProperty.guestsAllowed.adults + selectedProperty.guestsAllowed.children} personas</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Noches</label>
                        <select 
                          value={bookingNights} 
                          onChange={(e) => setBookingNights(Number(e.target.value))}
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 10, 14].map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? 'noche' : 'noches'}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Huéspedes</label>
                        <select 
                          value={bookingGuests} 
                          onChange={(e) => setBookingGuests(Number(e.target.value))}
                          className="w-full bg-[#FAF8F5] border border-[#E2DDD5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                        >
                          {Array.from({ length: selectedProperty.guestsAllowed.adults + selectedProperty.guestsAllowed.children }, (_, i) => i + 1).map(g => (
                            <option key={g} value={g}>{g} {g === 1 ? 'huésped' : 'huéspedes'}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="space-y-2 text-xs text-gray-600 pt-2">
                      <div className="flex justify-between">
                        <span>Estadía de {bookingNights} {bookingNights === 1 ? 'noche' : 'noches'}</span>
                        <span>₹{(selectedProperty.pricePerNight * bookingNights).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa de limpieza Apex</span>
                        <span>₹1,500</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tarifa de servicio exclusivo</span>
                        <span>₹2,800</span>
                      </div>
                      <div className="flex justify-between font-bold text-black border-t border-[#E2DDD5] pt-3 text-sm">
                        <span>Total estimado</span>
                        <span>₹{(selectedProperty.pricePerNight * bookingNights + 1500 + 2800).toLocaleString()}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setBookingConfirmed(true)}
                      className="w-full bg-[#1A1A1A] hover:bg-black text-white text-xs font-semibold tracking-wide py-3.5 rounded-full transition-all mt-4 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Reservar ahora con Apex</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">Aún no se te cobrará ningún importe oficial</p>
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
                      <h3 className="font-serif text-lg font-bold text-green-900">¡Reserva Solicitada con Éxito!</h3>
                      <p className="text-xs text-green-700 mt-1 max-w-xs mx-auto">
                        Tu solicitud para <strong>{selectedProperty.name}</strong> ha sido pre-aprobada. El anfitrión te responderá en breve.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-green-100/60 max-w-xs mx-auto text-left text-xs space-y-1 text-gray-700">
                      <p><strong>Ubicación:</strong> {selectedProperty.location}</p>
                      <p><strong>Noches:</strong> {bookingNights} noches</p>
                      <p><strong>Huéspedes:</strong> {bookingGuests} {bookingGuests === 1 ? 'persona' : 'personas'}</p>
                      <p className="pt-2 border-t border-gray-100 font-bold text-black">
                        Total: ₹{(selectedProperty.pricePerNight * bookingNights + 1500 + 2800).toLocaleString()}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsDetailOpen(false)}
                      className="bg-green-800 hover:bg-green-900 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all"
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
              className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 text-[#1A1A1A]"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8E8]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#2B2B2B]">Filtros de Búsqueda</h3>
                  <p className="text-[11px] text-gray-400 font-medium tracking-wide">Refina tu selección en Apex</p>
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
                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Precio Máximo por noche</h4>
                    <span className="text-xs font-bold text-black">₹{filterMaxPrice.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" 
                    min={2000} 
                    max={60000} 
                    step={1000}
                    value={filterMaxPrice} 
                    onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#1A1A1A]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>₹2,000 / noche</span>
                    <span>₹60,000 / noche</span>
                  </div>
                </div>

                <hr className="border-[#E8E8E8]" />

                {/* Minimum Rating */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Calificación Mínima</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[4.5, 4.6, 4.7, 4.8, 4.9].map((val) => (
                      <button
                        key={val}
                        onClick={() => setFilterMinRating(val)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          filterMinRating === val 
                            ? 'bg-[#1A1A1A] text-white border-black' 
                            : 'border-gray-100 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        ★ {val}
                      </button>
                    ))}
                  </div>
                </div>

                <hr className="border-[#E8E8E8]" />

                {/* Popular Amenities Filter Info */}
                <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E8E8E8] text-xs space-y-1">
                  <p className="font-bold text-[#1A1A1A]">Lujo Apex Incluido</p>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Todas las propiedades listadas en Apex cumplen con estándares rigurosos de alta gama, incluyendo internet premium de alta velocidad, servicio al huésped 24/7 y limpieza profesional impecable.
                  </p>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#E8E8E8] flex gap-3 bg-white">
                <button
                  onClick={() => {
                    setFilterMaxPrice(60000);
                    setFilterMinRating(4.5);
                  }}
                  className="flex-1 py-3 border border-[#E8E8E8] hover:bg-gray-50 text-[#1A1A1A] rounded-full text-xs font-semibold transition-all cursor-pointer"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-[#1A1A1A] hover:bg-black text-white rounded-full text-xs font-semibold transition-all cursor-pointer"
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
        <h3 className="font-serif text-2xl md:text-[28px] text-[#2B2B2B] font-medium tracking-tight">{title}</h3>
        
        {/* 2 flechas circulares outline a la derecha */}
        <div className="flex items-center gap-2">
          <button 
            onClick={scrollPrev}
            aria-label="Anterior slide"
            className="w-9 h-9 rounded-full border border-[#E2DDD5] flex items-center justify-center text-gray-700 bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={scrollNext}
            aria-label="Siguiente slide"
            className="w-9 h-9 rounded-full border border-[#E2DDD5] flex items-center justify-center text-gray-700 bg-white hover:bg-[#FAF8F5] transition-all cursor-pointer"
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
      className="group bg-white border border-[#E2DDD5]/80 rounded-[16px] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] cursor-pointer flex flex-col justify-between h-full transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:border-[#1A1A1A]/30"
    >
      
      {/* Imagen arriba con border-radius 16px y ratio 4:3 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[16px]">
        <img 
          src={property.image} 
          alt={property.name}
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center hover:bg-white transition-all shadow-sm z-10 cursor-pointer border border-[#E2DDD5]/20"
        >
          <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Category Tag Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {property.categories.slice(0, 1).map((cat) => (
            <span key={cat} className="text-[10px] uppercase font-bold bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-xs tracking-wider">
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Franja inferior fondo #FAFAF8 */}
      <div className="p-4 bg-[#FAFAF8] flex items-center justify-between gap-2 relative border-t border-[#E2DDD5]/30">
        <div className="flex-1 min-w-0">
          {/* Nombre: 15px serif elegante negro */}
          <h4 className="font-serif text-[15px] font-medium text-[#1A1A1A] tracking-tight truncate group-hover:text-black transition-colors">{property.name}</h4>
          
          {/* Precio + estadía + rating en 12px gris */}
          <p className="text-xs text-[#6B6B6B] mt-1 font-medium truncate">
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
          className="w-9 h-9 rounded-full bg-[#1A1A1A] group-hover:bg-black text-white flex items-center justify-center shadow-md transition-all shrink-0 cursor-pointer hover:scale-105"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
