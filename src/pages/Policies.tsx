import React from "react";
import { Truck, RotateCcw, ShieldAlert, BadgeCheck, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { useSettings } from "../context/SettingsContext";
import SEO from '../components/SEO';

const PolicySection = ({ 
  icon: Icon, 
  title, 
  children, 
  className 
}: { 
  icon: any, 
  title: string, 
  children: React.ReactNode,
  className?: string
}) => (
  <section className={cn("bg-brand-gray/30 border border-white/5 p-8", className)}>
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
        <Icon size={24} />
      </div>
      <h2 className="text-xl font-display font-bold uppercase tracking-tight text-white">{title}</h2>
    </div>
    <div className="space-y-4 text-brand-metallic text-sm leading-relaxed">
      {children}
    </div>
  </section>
);

export default function Policies() {
  const { settings } = useSettings();
  
  return (
    <div className="bg-brand-black min-h-screen pt-32 pb-24 px-6 overflow-hidden relative">
      <SEO 
        title={`Store Policies | ${settings.siteName}`}
        description="Shipping, returns, and terms of service policies for our store."
      />
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-accent/5 rounded-full blur-[120px] -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl mx-auto">
        <header className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-brand-accent"></div>
            <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-brand-accent">Standard Operating Procedures</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter uppercase text-white mb-6">
            Shipping & <span className="text-brand-accent">Returns</span>
          </h1>
          <p className="text-brand-metallic max-w-2xl leading-relaxed">
            When purchasing a helmet online, shipping and return policies are often stricter than for other apparel because a helmet is a critical piece of safety equipment. We ensure the highest standards of safety from our warehouse to your doorstep.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Section 1: Shipping */}
          <PolicySection icon={Truck} title="1. Shipping Policies">
            <p>At {settings.siteName}, we treat every order as a priority. Our shipping process is designed to protect the structural integrity of your gear.</p>
            <ul className="space-y-3 list-none">
              <li className="flex gap-3">
                <BadgeCheck size={16} className="text-brand-accent shrink-0 mt-0.5" />
                <span><strong>Standard Delivery:</strong> Most orders are delivered within 3 to 7 business days.</span>
              </li>
              <li className="flex gap-3">
                <BadgeCheck size={16} className="text-brand-accent shrink-0 mt-0.5" />
                <span><strong>Advanced Packaging:</strong> Helmets are shipped in their original manufacturer box, double-boxed inside a sturdier corrugated shipping container to prevent impact damage.</span>
              </li>
              <li className="flex gap-3">
                <ShieldAlert size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                <span><strong>Inspection Required:</strong> Please inspect the shipping box for punctures or crushed corners before signing. Document any outer damage with photos—this is critical for internal EPS foam claims.</span>
              </li>
            </ul>
          </PolicySection>

          {/* Section 2: Non-Returnable */}
          <PolicySection icon={AlertTriangle} title="2. Non-Returnable Scenarios" className="border-red-500/20">
            <p className="text-red-400/80 font-bold uppercase text-[10px] tracking-widest mb-2">Notice: The following items cannot be returned</p>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="text-red-500 font-bold shrink-0 text-lg leading-none select-none">×</div>
                <span><strong>Ridden-in Helmets:</strong> Once a helmet is taken on a ride, it is considered "used" due to sweat, wind debris, and microscopic impact exposure.</span>
              </li>
              <li className="flex gap-3">
                <div className="text-red-500 font-bold shrink-0 text-lg leading-none select-none">×</div>
                <span><strong>Final Sale Items:</strong> Closeout gear or items marked as "Clearance" are final sale and cannot be returned or exchanged.</span>
              </li>
              <li className="flex gap-3">
                <div className="text-red-500 font-bold shrink-0 text-lg leading-none select-none">×</div>
                <span><strong>Custom Gear:</strong> Helmets with custom graphics, specialized modifications, or painted details are final sale.</span>
              </li>
            </ul>
          </PolicySection>

          {/* Pro Tip */}
          <div className="bg-brand-accent p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck size={24} />
              <h3 className="font-display font-bold uppercase tracking-tight text-xl">Expert Fitting Tip</h3>
            </div>
            <p className="text-white/90 text-sm leading-relaxed italic">
              "When you receive your helmet, wear it inside your house for 15–20 minutes. This is long enough to identify any painful 'hot spots' or pressure points, but keeps the helmet in 'New' condition so you can still return it if the fit isn't perfect."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
