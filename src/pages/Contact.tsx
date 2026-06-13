import { Phone, MapPin, MessageCircle, CreditCard, Mail, Instagram } from "lucide-react";
import { WhatsAppIcon } from "../components/WhatsAppIcon";

export default function Contact() {
  return (
    <div className="pt-16 pb-24 px-6 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter uppercase mb-6">Contact Command</h1>
        <p className="text-brand-metallic text-lg">
          Whether you need setup advice, sizing help, or tracking an order, our pit crew is standing by.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Contact Info */}
        <div className="flex flex-col gap-12">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-brand-gray/30 border border-white/5 p-8">
              <Phone className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Phone Support</h3>
              <p className="text-brand-metallic text-sm mb-4">Mon-Sat, 9AM to 7PM</p>
              <a href="tel:8292908076" className="text-xl font-display font-bold">8292908076</a>
            </div>
            
            <div className="bg-brand-gray/30 border border-white/5 p-8">
              <MessageCircle className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Live Support</h3>
              <p className="text-brand-metallic text-xs mb-4">Chat with our experts. Replies within 2 hours.</p>
              <a href="https://wa.me/918292908076" target="_blank" rel="noopener noreferrer" className="text-xl font-display font-bold uppercase pb-1 border-b border-brand-accent">WhatsApp</a>
            </div>

            <div className="bg-brand-gray/30 border border-white/5 p-8">
              <Mail className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Email Support</h3>
              <p className="text-brand-metallic text-sm mb-4">Replies within 24hr to 48hr</p>
              <a href="mailto:Support@motogp.com" className="text-lg font-display font-bold">Support@motogp.com</a>
            </div>

            <div className="bg-brand-gray/30 border border-white/5 p-8">
              <Instagram className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Instagram</h3>
              <p className="text-brand-metallic text-sm mb-4">Follow us for updates</p>
              <a href="https://www.instagram.com/agvgod?igsh=Znp4NDBtcWI4eXhm" target="_blank" rel="noopener noreferrer" className="text-xl font-display font-bold uppercase pb-1 border-b border-brand-accent">@agvgod</a>
            </div>

            <div className="bg-brand-gray/30 border border-white/5 p-8 sm:col-span-2">
              <CreditCard className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Payment Info</h3>
              <p className="text-brand-metallic text-sm mb-4">Manual Verification via WhatsApp</p>
              <p className="text-xl font-display font-bold text-white uppercase">Provided during checkout</p>
            </div>

            <div className="bg-brand-gray/30 border border-white/5 p-8 sm:col-span-2">
              <MapPin className="text-brand-accent mb-6" size={28} />
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2">Visit Our Store</h3>
              <p className="text-lg font-display font-bold leading-relaxed">
                Near Iqramaszid Ranchi Road, above Gupta Bhandar, near One plus showroom, Maulana Azad Colony, Hindpiri, Ranchi, Jharkhand 834001
              </p>
            </div>
          </div>

          <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-8 flex items-start gap-6">
            <div className="bg-[#25D366] text-black w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
              <WhatsAppIcon size={28} />
            </div>
            <div>
              <h3 className="font-bold uppercase tracking-widest text-sm mb-2 text-[#25D366]">Instant WhatsApp Support</h3>
              <p className="text-brand-metallic text-sm mb-6 leading-relaxed">
                Connect instantly with our sizing experts for real-time recommendations. Replies within 2 hours.
              </p>
              <a href="https://wa.me/918292908076" target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 hover:bg-[#20bd5a] transition-colors inline-block text-center">
                Start Chat
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <h3 className="font-bold uppercase tracking-widest text-sm mb-6">Frequently Asked Questions</h3>
            <div className="space-y-6">
              {[
                { q: "How long does shipping take?", a: "Standard shipping takes 3-5 business days across India. Express shipping takes 1-2 business days." },
                { q: "What is your return policy?", a: "We offer a 7-day no-questions-asked return policy, provided the helmet is unused and in original packaging." },
                { q: "How do I choose the right size?", a: "Measure the circumference of your head 1 inch above your eyebrows. Refer to our size guide on the product page." }
              ].map((faq, i) => (
                <div key={i}>
                  <h4 className="text-white font-medium text-sm mb-2">{faq.q}</h4>
                  <p className="text-brand-metallic text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white/5 border border-white/10 p-8 md:p-12">
          <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Send a Message</h2>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-brand-metallic font-bold">First Name</label>
                <input type="text" className="bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Last Name</label>
                <input type="text" className="bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-colors" />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Email Address</label>
              <input type="email" className="bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-colors" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Subject / Order ID</label>
              <input type="text" className="bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-colors" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-widest text-brand-metallic font-bold">Message</label>
              <textarea rows={5} className="bg-brand-black border border-white/10 p-4 text-white focus:outline-none focus:border-brand-accent transition-colors resize-none"></textarea>
            </div>

            <button type="submit" className="w-full bg-brand-accent text-white font-bold uppercase tracking-widest text-sm py-5 hover:bg-red-700 transition-all mt-4 shadow-xl shadow-brand-accent/20">
              Submit Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
