import React, { useState } from "react";
import { Ruler, ShieldCheck, BadgeCheck, AlertCircle, ChevronRight, Activity, RotateCcw } from "lucide-react";
import { cn } from "../lib/utils";
import SEO from '../components/SEO';
import { useSettings } from "../context/SettingsContext";

export default function SizingGuide() {
  const { settings } = useSettings();
  const sizeChart = [
    { size: "XS", cm: "53 – 54", in: "20 ⅞ – 21 ¼" },
    { size: "S", cm: "55 – 56", in: "21 ⅝ – 22" },
    { size: "M", cm: "57 – 58", in: "22 ½ – 22 ⅞" },
    { size: "L", cm: "59 – 60", in: "23 ¼ – 23 ⅝" },
    { size: "XL", cm: "61 – 62", in: "24 – 24 ⅜" },
    { size: "XXL", cm: "63 – 64", in: "24 ¾ – 25 ¼" }
  ];

  const [circumference, setCircumference] = useState<number | "">("");
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [shape, setShape] = useState<"round" | "intermediate" | "long" | "">("");
  const [recommendedSize, setRecommendedSize] = useState<string | null>(null);

  const calculateSize = () => {
    if (!circumference || !shape) return;

    let measurementCm = unit === "cm" ? Number(circumference) : Number(circumference) * 2.54;

    // Adjust recommendation based on head shape
    // AGV helmets generally run a bit narrow (Intermediate Oval).
    // If the user has a round head, they might need to size up if they are on the border.
    
    let baseSize = "Unknown";
    
    if (measurementCm < 53) baseSize = "Too Small for Standard Adult";
    else if (measurementCm <= 54.5) baseSize = "XS";
    else if (measurementCm <= 56.5) baseSize = "S";
    else if (measurementCm <= 58.5) baseSize = "M";
    else if (measurementCm <= 60.5) baseSize = "L";
    else if (measurementCm <= 62.5) baseSize = "XL";
    else if (measurementCm <= 64.5) baseSize = "XXL";
    else baseSize = "Too Large for Standard Adult";

    // Slight logic adjustment for shape
    if (shape === "round" && (measurementCm % 2 > 1.2 || measurementCm % 2 < 0.8)) {
      // Very crude simulation of sizing up for a round head on an intermediate oval helmet
       setRecommendedSize(baseSize + " (Consider sizing up or testing cheek pads due to Round shape)");
    } else {
       setRecommendedSize(baseSize);
    }
  };

  const resetCalculator = () => {
    setCircumference("");
    setShape("");
    setRecommendedSize(null);
  };

  return (
    <div className="bg-brand-black min-h-screen pt-32 pb-24 px-6">
      <SEO 
        title={`Sizing Guide | ${settings.siteName}`}
        description="Find the perfect fit with our comprehensive helmet sizing setup guide."
      />
      <div className="max-w-4xl mx-auto">
        <header className="mb-16 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ruler className="text-brand-accent" size={24} />
            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-accent">Precision Fit Guide</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase text-white mb-6">
            Size <span className="text-brand-accent">Guide</span>
          </h1>
          <p className="text-brand-metallic max-w-2xl mx-auto leading-relaxed">
            A helmet that doesn't fit correctly is a helmet that can't protect you. Follow our guide to find your perfect AGV match.
          </p>
        </header>

        {/* Interactive Size Calculator */}
        <section className="mb-20 bg-white/5 border border-white/10 p-8 md:p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <Activity size={200} className="text-brand-accent" />
           </div>
           
           <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white mb-2 text-center">Interactive Size Recommender</h2>
              <p className="text-brand-metallic text-sm text-center mb-10">Enter your measurements to get a personalized helmet size recommendation.</p>
              
              {!recommendedSize ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-metallic">1. Head Circumference</label>
                    <div className="flex gap-4">
                      <div className="flex-1 relative">
                        <input 
                          type="number" 
                          value={circumference}
                          onChange={(e) => setCircumference(e.target.value ? Number(e.target.value) : "")}
                          placeholder={`e.g., ${unit === 'cm' ? '58' : '23'}`}
                          className="w-full bg-black border border-white/20 p-4 text-white font-mono text-lg focus:border-brand-accent outline-none"
                        />
                      </div>
                      <div className="flex border border-white/20 bg-black">
                         <button 
                           onClick={() => setUnit('cm')}
                           className={cn("px-4 py-2 text-xs font-bold uppercase transition-colors", unit === 'cm' ? 'bg-brand-accent text-white' : 'text-brand-metallic hover:text-white')}
                         >
                           CM
                         </button>
                         <button 
                           onClick={() => setUnit('in')}
                           className={cn("px-4 py-2 text-xs font-bold uppercase transition-colors border-l border-white/20", unit === 'in' ? 'bg-brand-accent text-white' : 'text-brand-metallic hover:text-white')}
                         >
                           IN
                         </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-metallic">2. Head Shape Preference</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <button 
                         onClick={() => setShape('round')}
                         className={cn("border p-4 text-left transition-all", shape === 'round' ? 'border-brand-accent bg-brand-accent/10' : 'border-white/20 hover:border-white/50')}
                       >
                         <span className="block text-white font-bold text-sm mb-1">Round Oval</span>
                         <span className="block text-brand-metallic text-xs">Width and length are nearly equal.</span>
                       </button>
                       <button 
                         onClick={() => setShape('intermediate')}
                         className={cn("border p-4 text-left transition-all", shape === 'intermediate' ? 'border-brand-accent bg-brand-accent/10' : 'border-white/20 hover:border-white/50')}
                       >
                         <span className="block text-white font-bold text-sm mb-1">Intermediate</span>
                         <span className="block text-brand-metallic text-xs">Slightly longer front-to-back than side-to-side. (Most common)</span>
                       </button>
                       <button 
                         onClick={() => setShape('long')}
                         className={cn("border p-4 text-left transition-all", shape === 'long' ? 'border-brand-accent bg-brand-accent/10' : 'border-white/20 hover:border-white/50')}
                       >
                         <span className="block text-white font-bold text-sm mb-1">Long Oval</span>
                         <span className="block text-brand-metallic text-xs">Noticeably longer front-to-back than side-to-side.</span>
                       </button>
                    </div>
                  </div>

                  <button 
                    onClick={calculateSize}
                    disabled={!circumference || !shape}
                    className="w-full bg-white text-black py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    Calculate My Size <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center py-8 animate-in fade-in zoom-in duration-500">
                  <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-accent mb-4 block">Recommended Size</span>
                  <div className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
                    {recommendedSize}
                  </div>
                  <p className="text-brand-metallic text-sm mb-8 max-w-md mx-auto">
                    Based on your measurements ({circumference}{unit}) and a {shape} head shape.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => window.location.href='/shop'}
                      className="bg-brand-accent text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors"
                    >
                      Shop Helmets
                    </button>
                    <button 
                      onClick={resetCalculator}
                      className="border border-white/20 text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} /> Recalculate
                    </button>
                  </div>
                </div>
              )}
           </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-20">
          <section className="space-y-8">
            <div className="bg-white/5 border border-white/10 p-8">
              <h2 className="text-xl font-display font-bold uppercase tracking-tight text-white mb-6 flex items-center gap-3">
                <span className="text-brand-accent">01.</span> How to Measure
              </h2>
              <div className="space-y-6 text-brand-metallic text-sm leading-relaxed">
                <p>To find your ideal helmet size, you should measure the circumference of your head. Helmets are built on specific head shapes (Intermediate Oval for most AGV models).</p>
                <div className="bg-brand-black p-4 border-l-2 border-brand-accent">
                  <p className="italic">"Wrap a soft measuring tape around your head, approximately 1 inch (2.5cm) above your eyebrows and just above the ears."</p>
                </div>
                <p>Record the measurement in centimeters for the most accurate match to the manufacturer specifications.</p>
              </div>
            </div>

            <div className="bg-brand-accent/10 border border-brand-accent/20 p-8">
              <h2 className="text-xl font-display font-bold uppercase tracking-tight text-white mb-6 flex items-center gap-3">
                <ShieldCheck className="text-brand-accent" /> Pro Tip
              </h2>
              <p className="text-brand-metallic text-sm leading-relaxed">
                If your measurement falls between two sizes, we generally recommend choosing the smaller size for a snug, secure fit. Helmet liners break in over time (usually about 10-15% expansion).
              </p>
            </div>
          </section>

          <section className="bg-white/5 border border-white/10 p-8">
            <h2 className="text-xl font-display font-bold uppercase tracking-tight text-white mb-6 flex items-center gap-3">
              <span className="text-brand-accent">02.</span> Size Chart
            </h2>
            <div className="space-y-1">
              <div className="grid grid-cols-3 p-3 text-[10px] uppercase tracking-widest font-bold border-b border-white/10 mb-2">
                <span className="text-brand-metallic">Label</span>
                <span className="text-brand-metallic text-center">CM</span>
                <span className="text-brand-metallic text-right">Inches</span>
              </div>
              {sizeChart.map((row, idx) => (
                <div key={idx} className={cn(
                  "grid grid-cols-3 p-4 text-[11px] uppercase tracking-widest font-bold",
                  idx % 2 === 0 ? "bg-white/5" : ""
                )}>
                  <span className="text-white">{row.size}</span>
                  <span className="text-brand-accent text-center">{row.cm}</span>
                  <span className="text-brand-metallic text-right">{row.in}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] uppercase font-bold tracking-widest">
              <AlertCircle size={16} className="shrink-0" />
              <p>Measurements are specific to AGV Racing/Sport Shells. Fit may vary slightly between K-Series and Pista Series.</p>
            </div>
          </section>
        </div>

        <section className="bg-brand-gray/50 border border-white/5 p-12 text-center">
          <BadgeCheck className="text-brand-accent mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-display font-bold uppercase tracking-tight text-white mb-4">The Perfect Fit Test</h2>
          <p className="text-brand-metallic text-sm max-w-2xl mx-auto leading-relaxed mb-8">
            Once you receive your helmet, it should feel snug but not painful. It shouldn't rotate when you shake your head, and your cheeks should be slightly compressed (the "chipmunk cheek" effect).
          </p>
          <button 
            onClick={() => window.location.href='/shop'}
            className="bg-brand-accent text-white px-12 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-red-700 transition-all font-sans shadow-lg shadow-brand-accent/20"
          >
            Find Your Helmet
          </button>
        </section>
      </div>
    </div>
  );
}
