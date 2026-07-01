import { useSettings } from "../context/SettingsContext";
import StorageImage from '../components/StorageImage';
import SEO from '../components/SEO';

export default function About() {
  const { settings } = useSettings();
  
  return (
    <div className="flex flex-col">
      <SEO 
        title={`About Us | ${settings.siteName}`}
        description="Learn more about our legacy, engineered for the streets and born on the racetrack."
      />
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <StorageImage 
            src="https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80" 
            alt="About Background" 
            className="w-full h-full object-cover opacity-30 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="text-[120px] font-display font-bold opacity-[0.02] uppercase tracking-tighter whitespace-nowrap overflow-hidden">{settings.siteName}</div>
          </div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl px-6">
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase mb-6">Our Legacy</h1>
          <p className="text-xl text-brand-metallic font-light leading-relaxed max-w-2xl mx-auto">
            Born on the racetrack. Engineered for the streets. We believe that ultimate safety should never compromise performance.
          </p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-6 bg-brand-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-16">
            <div className="w-16 h-1 bg-brand-accent"></div>
          </div>
          
          <h2 className="text-3xl font-display font-bold uppercase tracking-widest mb-8 text-center text-white">
            The Science of Survival
          </h2>
          
          <div className="space-y-8 text-brand-metallic leading-relaxed prose prose-invert mx-auto">
            <p>
              {settings.siteName} was founded with a singular, uncompromising vision: to bring MotoGP precision to every rider. We don't believe in minimum requirements. When you're pushing the limits of physics on the circuit, "good enough" is precisely what gets you killed.
            </p>
            <p>
              Our engineering team consists of MotoGP technical coordinators, aerospace structural engineers, and professional racers. Every shell shape is extensively modeled and wind-tunnel tested to eliminate buffeting and drag at speeds exceeding 350 km/h.
            </p>
            <p>
              But safety goes beyond impact resistance. Safety is also comfort. It's optical clarity. It's a ventilation system refined on the MotoGP grid to keep your core temperature down under intense pressure. An AGV helmet is a piece of professional racing equipment, reducing rider fatigue so you can maintain total focus on the apex.
            </p>
          </div>
        </div>
      </section>

      {/* Stats/Facts */}
      <section className="py-24 px-6 bg-brand-gray/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold mb-2">100%</div>
            <div className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Carbon Integrity</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold mb-2">12+</div>
            <div className="text-xs uppercase tracking-widest text-brand-metallic font-bold">World Championships</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold mb-2">350<span className="text-2xl">km/h</span></div>
            <div className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Wind-Tunnel Tested</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-display font-bold mb-2">0</div>
            <div className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Compromises</div>
          </div>
        </div>
      </section>

      {/* Version Section */}
      <section className="py-12 px-6 bg-brand-black text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
          <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse"></div>
          {/* @ts-ignore */}
          <span className="text-xs uppercase tracking-widest text-brand-metallic font-bold">
            {/* @ts-ignore */}
            System Version <span className="text-white ml-2">v{import.meta.env.VITE_APP_VERSION || "0.0.0"}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
