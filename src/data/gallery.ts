export interface GalleryImage {
  id: string;
  url: string;
  model: string;
  description: string;
  type?: 'image' | 'video';
}

export const galleryImages: GalleryImage[] = [
  {
    id: "g1",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_futuro_carbonio_forgiato.jpg",
    model: "Pista GP RR Futuro",
    description: "Forged Carbon excellence with Elettra blue details."
  },
  {
    id: "g2",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_ghiaccio.jpg",
    model: "Pista GP RR Ghiaccio",
    description: "The purity of racing in a translucent white finish."
  },
  {
    id: "g3",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_iridium_carbon.jpg",
    model: "Pista GP RR Iridium Carbon",
    description: "Deep carbon weave with iridescent accents."
  },
  {
    id: "g4",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_mono_matt_carbonio.jpg",
    model: "Pista GP RR Matte Carbon",
    description: "The classic MotoGP look. Pure carbon fiber."
  },
  {
    id: "g5",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k6_s_sic58.jpg",
    model: "K6 S SIC58",
    description: "Tribute to the legend Marco Simoncelli."
  },
  {
    id: "g6",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k1s_spartan_matt_black_red.jpg",
    model: "K1 S Spartan",
    description: "Aggressive street style inspired by ancient legends."
  },
  {
    id: "g7",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_pista_gp_rr_performance_carbon_red.jpg",
    model: "Pista GP RR Performance",
    description: "High-visibility racing livery in Carbon and Rosso."
  },
  {
    id: "g8",
    url: "https://www.motostorm.it/images/products/large/caschi_integrali/agv_k3_sv_s_mono_matte_black.jpg",
    model: "K3 SV-S Matte",
    description: "Everyday versatile performance with a stealth finish."
  }
];
