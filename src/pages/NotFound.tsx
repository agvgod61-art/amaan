import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center">
        <AlertCircle size={64} className="text-brand-accent mb-6" />
        <h1 className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter mb-4 text-white">404</h1>
        <div className="h-px w-24 bg-brand-accent mb-6 mx-auto" />
        <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white mb-4">Sector Not Found</h2>
        <p className="text-brand-metallic text-sm uppercase tracking-widest max-w-lg mb-8 leading-relaxed">
          The coordinate you requested does not exist in our system. The path may have been altered or restricted.
        </p>
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-brand-accent text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-colors"
        >
          <ArrowLeft size={16} />
          Return to Base
        </Link>
      </div>
    </div>
  );
}
