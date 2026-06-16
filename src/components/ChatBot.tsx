import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { chatWithGemini } from "../services/geminiService";
import { getStoreContext } from "../data/chatbotContext";
import { useSettings } from "../context/SettingsContext";

type Message = {
  role: 'user' | 'model';
  text: string;
};

export function ChatBot() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hello! Welcome to ${settings.siteName}. What kind of help do you need today?` }
  ]);
  const [showOptions, setShowOptions] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const constraintsRef = useRef(null);

  const quickActions = [
    { label: "How to purchase?", value: "How can I purchase products step by step?" },
    { label: "Best product for me?", value: "Which product is best for me? I need a recommendation." },
    { label: "Contact Support", value: "How do I contact customer service?" },
    { label: "Sizing Help", value: "How do I find my helmet size?" }
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customMessage?: string | React.MouseEvent | React.KeyboardEvent) => {
    const messageText = typeof customMessage === 'string' ? customMessage : input;
    const userMessage = messageText.trim();
    if (!userMessage || isLoading) return;

    if (showOptions) setShowOptions(false);
    
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const context = getStoreContext(settings.siteName);
    const response = await chatWithGemini(userMessage, history, context, settings.siteName);

    setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
  };

  return (
    <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-50">
      {/* Floating Button */}
      <motion.button
        drag
        dragConstraints={constraintsRef}
        dragMomentum={false}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-brand-accent text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:scale-110 transition-transform active:scale-95 cursor-grab active:cursor-grabbing pointer-events-auto",
          isOpen && "hidden"
        )}
      >
        <MessageSquare size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragMomentum={false}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-100px)] bg-brand-black border border-white/10 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden cursor-default pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-brand-gray/50 border-b border-white/5 flex items-center justify-between cursor-move">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-accent/10 border border-brand-accent/20 rounded-full flex items-center justify-center text-brand-accent">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white leading-none">{settings.siteName.split(' ')[0]} Support</h3>
                  <span className="text-[9px] text-brand-accent uppercase font-bold tracking-tighter">Powered by MotoGP</span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-brand-metallic hover:text-white transition-colors"
                id="close-chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
            >
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 shrink-0 rounded-full flex items-center justify-center mt-1",
                    msg.role === 'model' ? "bg-brand-accent/10 text-brand-accent" : "bg-white/10 text-white"
                  )}>
                    {msg.role === 'model' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={cn(
                    "rounded-xl p-3 text-xs leading-relaxed",
                    msg.role === 'model' ? "bg-white/5 text-brand-metallic" : "bg-brand-accent text-white"
                  )}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {showOptions && !isLoading && (
                <div className="flex flex-wrap gap-2 pl-9 pt-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.value)}
                      className="text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-2 hover:bg-brand-accent hover:text-white hover:border-brand-accent transition-all rounded-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex gap-3 mr-auto max-w-[85%]">
                  <div className="w-6 h-6 bg-brand-accent/10 text-brand-accent rounded-full flex items-center justify-center mt-1">
                    <Bot size={14} />
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-brand-metallic">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5 bg-brand-gray/30">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about products, sizing..."
                  className="w-full bg-black border border-white/10 rounded-full py-3 px-4 pr-12 text-xs text-white placeholder:text-brand-metallic/50 focus:outline-none focus:border-brand-accent/50 transition-colors"
                  id="chat-input"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-brand-accent text-white rounded-full flex items-center justify-center hover:bg-brand-accent/80 transition-colors disabled:opacity-50"
                  id="send-chat"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
