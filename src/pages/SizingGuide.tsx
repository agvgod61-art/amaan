import React from "react";
import { Ruler, ShieldCheck, BadgeCheck, AlertCircle } from "lucide-react";
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
