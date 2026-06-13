export type ProductDetailInfo = {
  label: string;
  value: string;
};

export type ProductColor = {
  name: string;
  hex: string;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  originalPrice?: number;
  price: number;
  rating: number;
  reviews: number;
  type: "Full-face" | "Motorcycle" | "Accessory";
  model?: string;
  image: string;
  images: string[];
  videoUrl?: string;
  pdfUrl?: string;
  features: string[];
  description: string;
  stock: number;
  badge?: string;
  isPopular?: boolean;
  status?: 'published' | 'draft' | 'archived';
  color?: string;
  colors?: ProductColor[];
  sizes?: string[];
  details?: ProductDetailInfo[];
  weight?: string;
  homologation?: string;
  createdAt?: any;
};

export const products: Product[] = [
  {
    id: "agv-k1-s-soleluna",
    name: "AGV K1 S E2206 Soleluna 2017 Helmet",
    originalPrice: 28999,
    price: 25999,
    rating: 4.8,
    reviews: 512,
    type: "Full-face",
    image: "https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_1.png?format=webp&quality=auto-medium",
    images: Array.from({length: 24}, (_, i) => `https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_${i + 1}.png?format=webp&quality=auto-medium`),
    features: ["Aero Spoiler", "Ultrawide field of vision", "Dry-Speed interior fabric", "Double D retention system"],
    description: "K1 S is the road helmet born from AGV's dominant experience in MotoGP, suitable for elite track use and high-speed street routes. The aerodynamic shape of its shell, the front air vents developed through professional racing experience and the new Aero Spoiler designed in the wind tunnel maximize performance and provide absolute stability at speeds exceeding 250 km/h.",
    stock: 15,
    badge: "MotoGP Edition",
    isPopular: true,
    videoUrl: "https://www.youtube.com/embed/S2pnt1M8Y4o",
    color: "Soleluna 2017",
    colors: [
      {
        name: "Soleluna Rossi 2017 Graphic",
        hex: "#FACC15",
        image: "https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_1.png?format=webp&quality=auto-medium"
      },
      {
        name: "Spartan Red Graphic",
        hex: "#EF4444",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red.jpg"
      },
      {
        name: "Classic Matte Black",
        hex: "#1F2937",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black.jpg"
      }
    ],
    homologation: "ECE 2206",
    details: [
      { label: "Shell Material", value: "High Resistance Thermoplastic" },
      { label: "Visor", value: "Anti-scratch, 190° horizontal field of view" },
      { label: "Ventilation", value: "5 front vents, 2 rear extractors" },
      { label: "Weight", value: "1500 g in first shell size" },
      { label: "Closure", value: "Double D" }
    ]
  },
  {
    id: "agv-pista-gp-rr",
    name: "AGV Pista GP RR Carbon Mono",
    price: 94999,
    rating: 5.0,
    reviews: 128,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio_2.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio_3.jpg"
    ],
    videoUrl: "https://www.youtube.com/embed/Vwz0Xg1P8I4",
    features: ["100% Carbon fiber MotoGP shell", "Hydration system included", "DOT / FIM / ECE 2206 Certified", "Titanium Double-D ring"],
    description: "The absolute pinnacle of racing performance. Crafted entirely from 3k carbon fiber, this is the exact helmet developed for and worn by MotoGP world champions. Every line is optimized for the track, providing unmatched aerodynamics and protection at world-class racing speeds.",
    stock: 5,
    badge: "MotoGP Pro",
    isPopular: true,
    homologation: "ECE 2206 / FIM",
    colors: [
      {
        name: "Matte Carbon Fiber",
        hex: "#1E1F22",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio.jpg"
      },
      {
        name: "Futuro forged Carbon Metallic",
        hex: "#3D3E42",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_futuro_carbonio_forgiato.jpg"
      },
      {
        name: "Gold Soleluna 2017 Replica",
        hex: "#EAB308",
        image: "https://dainese-cdn.thron.com/delivery/public/image/dainese/35790505-f6f1-41c6-9537-3cbad2f167cc/px6qct/std/960x960/2118395016_027_1.png?format=webp&quality=auto-medium"
      }
    ],
    details: [
      { label: "Shell", value: "100% Carbon Fiber" },
      { label: "Weight", value: "1450g" },
      { label: "Ventilation", value: "Metal air vents" },
      { label: "Visor", value: "Optical Class 1, 5mm thick" }
    ]
  },
  {
    id: "agv-k6-s",
    name: "AGV K6 S Mono Matte Black",
    price: 42999,
    rating: 4.8,
    reviews: 312,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black_2.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black_3.jpg"
    ],
    features: ["Aramid-carbon fiber shell", "5 front vents, 1 wide rear extractor", "ECE 2206 Certified", "Dry-Speed interior fabric"],
    description: "Versatile, minimal, and premium. The K6 S is the ultimate street helmet, designed to be worn anywhere with its lightweight profile and ultra-quiet highway performance.",
    stock: 12,
    isPopular: true,
    homologation: "ECE 2206",
    colors: [
      {
        name: "Stealth Matte Black",
        hex: "#121212",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_mono_matt_black.jpg"
      },
      {
        name: "Spartan Crimson Graphic",
        hex: "#DC2626",
        image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red.jpg"
      }
    ],
    details: [
      { label: "Shell", value: "Carbon-Aramid fiber" },
      { label: "Weight", value: "1255g" },
      { label: "Visor", value: "190° horizontal, Optical Class 1" }
    ]
  },
  {
    id: "agv-k5-s",
    name: "AGV K5 S Mono Matte Black",
    price: 32999,
    rating: 4.7,
    reviews: 184,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k5_s_mono_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k5_s_mono_matt_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k5_s_mono_matt_black_2.jpg"
    ],
    features: ["Carbon-fiberglass shell", "Integrated sun visor", "Integrated spoiler", "Micrometric retention system"],
    description: "Premium sport-touring performance. The K5 S features an integrated sun visor and a carbon-fiberglass shell for balanced weight and protection.",
    stock: 18,
    details: [
      { label: "Shell", value: "CAF (Carbon-Fiberglass)" },
      { label: "Sun Visor", value: "Integrated, scratch-resistant" },
      { label: "Interior", value: "Microsense treatment" }
    ]
  },
  {
    id: "agv-k3-sv",
    name: "AGV K3 SV-S Matte Black",
    price: 22999,
    rating: 4.6,
    reviews: 420,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k3_sv_s_mono_matte_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k3_sv_s_mono_matte_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k3_sv_s_mono_matte_black_2.jpg"
    ],
    features: ["HIR-TH shell", "Integrated sun visor", "Dry-Comfort interior", "Pinlock included"],
    description: "The versatile mid-range legend. The K3 SV-S offers AGV racing heritage with the convenience of a sun visor and excellent ventilation.",
    stock: 25,
    details: [
      { label: "Shell", value: "High Resistance Thermoplastic" },
      { label: "Sun Visor", value: "Integrated" },
      { label: "Ventilation", value: "4 front vents" }
    ]
  },
  {
    id: "agv-ax9",
    name: "AGV AX9 Antartica Matte Black",
    price: 48999,
    rating: 4.8,
    reviews: 65,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_motocross/agv_ax9_mono_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_motocross/agv_ax9_mono_matt_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_motocross/agv_ax9_mono_matt_black_2.jpg"
    ],
    features: ["Carbon-Aramid-Fiberglass shell", "Removable peak", "Ultra-wide visor", "Adjustable air vents"],
    description: "The ultimate dual-sport helmet. Peak, visor, and chin air vent are all adjustable or removable for 4 different configurations. Adventure ready.",
    stock: 7,
    badge: "Adventure",
    details: [
      { label: "Shell", value: "Carbon-Aramid-Fiberglass" },
      { label: "Config", value: "4 possible configurations" },
      { label: "Weight", value: "1445g" }
    ]
  },
  {
    id: "agv-x3000",
    name: "AGV X3000 Gloria",
    price: 36999,
    rating: 4.9,
    reviews: 38,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_x3000_mono_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_x3000_mono_matt_black.jpg"
    ],
    features: ["Fiberglass shell", "Retro style visor", "Double D-ring", "Premium leather interior"],
    description: "Legendary style, modern protection. The X3000 is a direct descendant of the helmets that protected 15-time world champion Giacomo Agostini.",
    stock: 0,
    badge: "Retro",
    details: [
      { label: "Style", value: "Vintage Racer" },
      { label: "Interior", value: "Eco-leather and Suede" },
      { label: "Ventilation", value: "On-visor air vent" }
    ]
  },
  {
    id: "agv-k1-s-spartan",
    name: "AGV K1 S Spartan Helmet",
    price: 24999,
    rating: 4.8,
    reviews: 56,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red_2.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red_3.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red_4.jpg"
    ],
    features: ["Aero Spoiler", "Ultravision visor", "Dry-Comfort fabric", "High resistance thermoplastic"],
    description: "The K1 S is the AGV sport helmet for everyday riding challenges. Born from the AGV racing technology, ready for every road experience. The Spartan graphic gives it an aggressive, legendary look.",
    stock: 12,
    color: "Matte Black/Red/Gold",
    badge: "New Arrival",
    isPopular: true
  },
  {
    id: "shoei-x-15-white",
    name: "SHOEI X-Fifteen White Helmet",
    price: 78999,
    originalPrice: 84999,
    rating: 4.9,
    reviews: 86,
    type: "Full-face",
    image: "https://www.shoei-helmets.com/wp-content/uploads/2022/10/X-Fifteen-White-Front.png",
    images: ["https://www.shoei-helmets.com/wp-content/uploads/2022/10/X-Fifteen-White-Front.png"],
    features: ["Aeroform Technology", "CWR-F2R Visor system", "Emergency Quick Release System"],
    description: "The X-Fifteen is a pure racing helmet, born from MotoGP experience. Optimized for high-speed stability and ventilation.",
    stock: 8,
    badge: "Track Pro",
    isPopular: true,
    homologation: "ECE 2206 / Snell M2020R"
  },
  {
    id: "shoei-nxr2-matte",
    name: "SHOEI NXR2 Matte Black",
    price: 49999,
    rating: 4.8,
    reviews: 142,
    type: "Full-face",
    image: "https://www.shoei-helmets.com/wp-content/uploads/2021/04/NXR2-Matt-Black-Main.png",
    images: ["https://www.shoei-helmets.com/wp-content/uploads/2021/04/NXR2-Matt-Black-Main.png"],
    features: ["Compact shell design", "Superior noise reduction", "Pinlock Evo included"],
    description: "The evolution of the NXR. Pure sports performance in a compact, lightweight package.",
    stock: 15,
    isPopular: false,
    homologation: "ECE 2206"
  },
  {
    id: "shark-race-r-pro-gp",
    name: "SHARK Race-R Pro GP Zarco Signature",
    price: 88999,
    rating: 4.9,
    reviews: 64,
    type: "Full-face",
    image: "https://images.shark-helmets.com/images/products/casque-shark-race-r-pro-gp-replica-zarco-chazra-kwa-1.png",
    images: ["https://images.shark-helmets.com/images/products/casque-shark-race-r-pro-gp-replica-zarco-chazra-kwa-1.png"],
    features: ["COVA Shell (Carbon & Aramid)", "Aero Spoiler", "Optical Class 1 Visor"],
    description: "Built for MotoGP. The Race-R PRO GP is the ultimate racing helmet, offering extreme safety and aerodynamics.",
    stock: 4,
    badge: "GP Replica",
    isPopular: true,
    homologation: "ECE 2205 / FIM"
  },
  {
    id: "shark-spartan-rs",
    name: "SHARK Spartan RS Carbon Skin",
    price: 38999,
    rating: 4.7,
    reviews: 98,
    type: "Full-face",
    image: "https://images.shark-helmets.com/images/products/casque-shark-spartan-rs-carbon-skin-drs-1.png",
    images: ["https://images.shark-helmets.com/images/products/casque-shark-spartan-rs-carbon-skin-drs-1.png"],
    features: ["Carbon interior", "Sun visor", "Quiet performance"],
    description: "The first SHARK helmet to pass the new ECE 22-06 standard. Exceptional safety for the road.",
    stock: 10,
    isPopular: true,
    homologation: "ECE 2206"
  },
  {
    id: "agv-tour-modular",
    name: "AGV TourModular Mono Black",
    price: 54999,
    rating: 4.7,
    reviews: 84,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_modulari/agv_tourmodular_mono_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_modulari/agv_tourmodular_mono_matt_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_modulari/agv_tourmodular_mono_matt_black_2.jpg"
    ],
    features: ["P/J homologation", "Integrated drop-down sun visor", "ECE 2206 Certified", "Ultra-smooth chin bar mechanism"],
    description: "The ultimate touring companion. Combining the safety of a full-face with the convenience of an open-face, engineered for thousands of miles of comfort.",
    stock: 8,
    isPopular: true,
    homologation: "P/J ECE 2206",
    details: [
      { label: "Shell", value: "Carbon-Aramid-Fiberglass" },
      { label: "Mechanism", value: "Stainless steel chin block" },
      { label: "Sun Visor", value: "Integrated, tool-less removeable" }
    ]
  },
  {
    id: "agv-x70",
    name: "AGV X70 Matte Black",
    price: 18999,
    rating: 4.5,
    reviews: 215,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_jet/agv_x70_matt_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_jet/agv_x70_matt_black.jpg",
      "https://www.motostorm.it/images/products/large/caschi_jet/agv_x70_matt_black_2.jpg"
    ],
    features: ["Fiberglass shell", "City-ready wide field of vision", "Vintage aesthetic", "Premium leather finishes"],
    description: "The original open-face reborn. AGV invented the fiberglass jet helmet in 1954. The X70 reinterprets that classic design with modern safety and comfort.",
    stock: 24,
    details: [
      { label: "Shell", value: "Fiberglass" },
      { label: "Interior", value: "Premium fabric and eco-leather" },
      { label: "Closure", value: "Double D" }
    ]
  },
  {
    id: "agv-pista-gp-rr-futuro",
    name: "AGV Pista GP RR Futuro Forged Carbon",
    price: 115999,
    rating: 5.0,
    reviews: 42,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_futuro_carbonio_forgiato.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_futuro_carbonio_forgiato.jpg",
      "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_futuro_carbonio_forgiato_2.jpg"
    ],
    features: ["Forged carbon fiber shell", "Pro hydration system", "360° Adaptive fit", "Ultrawide race visor"],
    description: "The future of racing protection. Forged carbon fiber offers superior impact resistance with an organic, unique texture for every shell. This is the experimental peak of AGV engineering.",
    stock: 2,
    badge: "Limited Edition",
    isPopular: true,
    homologation: "ECE 2206 / FIM",
    details: [
      { label: "Material", value: "Forged Carbon Fiber" },
      { label: "Edition", value: "Futuro Special Series" },
      { label: "Weight", value: "1450g" }
    ]
  },
  {
    id: "agv-sportmodular-carbon",
    name: "AGV Sportmodular Carbon Mono",
    price: 68999,
    rating: 4.9,
    reviews: 96,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_modulari/agv_sportmodular_mono_matt_carbonio.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_modulari/agv_sportmodular_mono_matt_carbonio.jpg",
      "https://www.motostorm.it/images/products/large/caschi_modulari/agv_sportmodular_mono_matt_carbonio_2.jpg"
    ],
    features: ["100% Carbon fiber shell (including chin)", "190° wide visor", "Integrated sun visor", "Reversible crown for summer/winter"],
    description: "The first 100% carbon fiber modular helmet. It offers the same protection as the Pista GP R but with the comfort of a flip-up. Lightweight, quiet, and extremely safe.",
    stock: 6,
    badge: "Ultralight",
    isPopular: true,
    details: [
      { label: "Shell", value: "100% Carbon Fiber" },
      { label: "Weight", value: "1295g" },
      { label: "Ventilation", value: "IVS (Integrated Ventilation System)" }
    ]
  },
  {
    id: "agv-orbyt-mono",
    name: "AGV Orbyt Mono Glossy Black",
    price: 12999,
    rating: 4.4,
    reviews: 156,
    type: "Full-face",
    image: "https://www.motostorm.it/images/products/large/caschi_jet/agv_orbyt_mono_nvy_black.jpg",
    images: [
      "https://www.motostorm.it/images/products/large/caschi_jet/agv_orbyt_mono_nvy_black.jpg"
    ],
    features: ["High resistance thermoplastic", "Integrated sun visor", "Glasses friendly", "Dry-Comfort interior"],
    description: "The ultimate AGV jet helmet, designed for maximum comfort, freedom and protection in the city. Large air intake for superior ventilation.",
    stock: 20,
    details: [
      { label: "Shell", value: "HIR-TH" },
      { label: "Usage", value: "Urban / Commuter" },
      { label: "Visor", value: "Long visor and Sun-visor" }
    ]
  },
  {
    id: "kawasaki-zx10r-2024",
    name: "Kawasaki Ninja ZX-10R 2024",
    price: 1675000,
    rating: 5.0,
    reviews: 24,
    type: "Motorcycle",
    model: "Zx10r",
    image: "https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZX1002L_201GN1DRS3CG_A.png",
    images: ["https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZX1002L_201GN1DRS3CG_A.png"],
    features: ["998cc Inline-Four", "Ohlins Steering Damper", "Brembo Stylema calipers", "Kawasaki Engine Brake Control"],
    description: "The Ninja ZX-10R is a six-time FIM Superbike World Championship winning motorcycle. It features state-of-the-art technology for track dominance.",
    stock: 2,
    badge: "Track King",
    details: [
      { label: "Engine", value: "998cc, Liquid-cooled, 4-stroke Inline-Four" },
      { label: "Power", value: "203 PS @ 13,200 rpm" },
      { label: "Weight", value: "207 kg (Curb)" }
    ]
  },
  {
    id: "kawasaki-z900-2024",
    name: "Kawasaki Z900 2024",
    price: 938000,
    rating: 4.9,
    reviews: 45,
    type: "Motorcycle",
    model: "Z900",
    image: "https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZR900F_201GY1DRS3CG_A.png",
    images: ["https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZR900F_201GY1DRS3CG_A.png"],
    features: ["948cc Inline-Four", "Sugomi Styling", "Traction Control", "Power Modes"],
    description: "The Z900 redefines the naked bike category. It offers raw power, intuitive handling, and aggressive Sugomi-inspired design.",
    stock: 5,
    badge: "Street Fighter",
    details: [
      { label: "Engine", value: "948cc, Liquid-cooled, 4-stroke Inline-Four" },
      { label: "Power", value: "125 PS @ 9,500 rpm" },
      { label: "Weight", value: "212 kg (Curb)" }
    ]
  },
  {
    id: "kawasaki-zx6r-2024",
    name: "Kawasaki Ninja ZX-6R 2024",
    price: 1120000,
    rating: 4.8,
    reviews: 32,
    type: "Motorcycle",
    model: "Zx6r",
    image: "https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZX636J_201GN1DRS3CG_A.png",
    images: ["https://storage.kawasaki.eu/public/kawasaki.eu/en-EU/Model/24ZX636J_201GN1DRS3CG_A.png"],
    features: ["636cc Inline-Four", "Quick Shifter", "Showa SFF-BP Fork", "Supersport DNA"],
    description: "The Ninja ZX-6R is the ultimate middleweight supersport. Perfect for track days and weekend canyon carving.",
    stock: 3,
    badge: "SuperSport",
    details: [
      { label: "Engine", value: "636cc, Liquid-cooled, 4-stroke Inline-Four" },
      { label: "Power", value: "124 PS @ 13,000 rpm" },
      { label: "Weight", value: "198 kg (Curb)" }
    ]
  },
  {
    id: "zx10r-radiator-guard",
    name: "Evotech Radiator Guard for ZX-10R",
    price: 8500,
    rating: 4.8,
    reviews: 12,
    type: "Accessory",
    model: "Zx10r",
    image: "https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn012586-06.jpg",
    images: ["https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn012586-06.jpg"],
    features: ["CNC Machined", "Aircraft grade aluminum", "Powder coated black"],
    description: "Superior protection for your radiator from road debris. Fits perfectly on the Kawasaki ZX-10R.",
    stock: 10,
    badge: "Protection"
  },
  {
    id: "zx10r-frame-sliders",
    name: "Evotech Frame Sliders for ZX-10R",
    price: 12500,
    rating: 4.9,
    reviews: 18,
    type: "Accessory",
    model: "Zx10r",
    image: "https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn012585-06.jpg",
    images: ["https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn012585-06.jpg"],
    features: ["Impact resistant heads", "Stainless steel shafts", "Easy installation"],
    description: "Protect your fairings and engine in case of a slide. Engineering excellence from Evotech.",
    stock: 6,
    badge: "Must Have"
  },
  {
    id: "zx10r-gb-racing",
    name: "GB Racing Engine Cover Set for ZX-10R",
    price: 18900,
    rating: 5.0,
    reviews: 25,
    type: "Accessory",
    model: "Zx10r",
    image: "https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-zx10-2011-set-gbr.jpg",
    images: ["https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-zx10-2011-set-gbr.jpg"],
    features: ["Revolutionary tough high-impact composite", "60% Long Glass Fibered Nylon", "Bolt on product"],
    description: "The world's best secondary engine covers. Used by MotoGP and SBK teams.",
    stock: 4,
    badge: "Track Ready"
  },
  {
    id: "z900-radiator-guard",
    name: "Radiator Grill for Kawasaki Z900",
    price: 4500,
    rating: 4.6,
    reviews: 30,
    type: "Accessory",
    model: "Z900",
    image: "https://m.media-amazon.com/images/I/71Y8L6fJb9L.jpg",
    images: ["https://m.media-amazon.com/images/I/71Y8L6fJb9L.jpg"],
    features: ["Honeycomb design", "Heat resistant", "Aluminum alloy"],
    description: "Cost-effective protection for your Z900 radiator. Lightweight and durable.",
    stock: 20
  },
  {
    id: "z900-frame-sliders",
    name: "Frame Sliders for Kawasaki Z900",
    price: 6800,
    rating: 4.7,
    reviews: 22,
    type: "Accessory",
    model: "Z900",
    image: "https://m.media-amazon.com/images/I/61f9o2p-l6L.jpg",
    images: ["https://m.media-amazon.com/images/I/61f9o2p-l6L.jpg"],
    features: ["High density nylon", "Steel brackets", "Direct fit"],
    description: "Save your engine from accidental drops. Discreet yet effective protection for the Z900.",
    stock: 12
  },
  {
    id: "z900-gb-racing",
    name: "GB Racing Engine Guard for Z900",
    price: 15500,
    rating: 4.8,
    reviews: 15,
    type: "Accessory",
    model: "Z900",
    image: "https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-z900-2017-set-gbr.jpg",
    images: ["https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-z900-2017-set-gbr.jpg"],
    features: ["Secondary engine covers", "Aesthetic and protective", "Easy to mount"],
    description: "Keep your Z900's heart safe with high-performance engine covers from GB Racing.",
    stock: 7
  },
  {
    id: "zx6r-radiator-guard",
    name: "Evotech Radiator Guard for ZX-6R",
    price: 7900,
    rating: 4.7,
    reviews: 10,
    type: "Accessory",
    model: "Zx6r",
    image: "https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn014386-06.jpg",
    images: ["https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn014386-06.jpg"],
    features: ["Perfect fit", "Durable finish", "No modifications required"],
    description: "Protection meets style for your ZX-6R radiator. Prevents damage from flying debris.",
    stock: 9
  },
  {
    id: "zx6r-frame-sliders",
    name: "Evotech Frame Sliders for ZX-6R",
    price: 11800,
    rating: 4.9,
    reviews: 14,
    type: "Accessory",
    model: "Zx6r",
    image: "https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn014317-06.jpg",
    images: ["https://evotech-performance.com/media/catalog/product/cache/1/image/1000x1000/9df78eab33525d08d6e5fb8d27136e95/p/r/prn014317-06.jpg"],
    features: ["Aerodynamic design", "Superior materials", "Proven protection"],
    description: "Maximum protection for your mid-weight supersport. Evotech sliders are built to last.",
    stock: 5,
    badge: "Elite"
  },
  {
    id: "zx6r-gb-racing",
    name: "GB Racing Engine Cover Set for ZX-6R",
    price: 17500,
    rating: 5.0,
    reviews: 19,
    type: "Accessory",
    model: "Zx6r",
    image: "https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-zx6-2009-set-gbr.jpg",
    images: ["https://www.gbracing.eu/media/catalog/product/cache/1/image/600x600/9df78eab33525d08d6e5fb8d27136e95/e/c/ec-zx6-2009-set-gbr.jpg"],
    features: ["Ultimate protection", "Race track approved", "FIM licensed"],
    description: "Don't hit the track without GB Racing covers on your Ninja ZX-6R.",
    stock: 6,
    badge: "Race Spec"
  }
];
