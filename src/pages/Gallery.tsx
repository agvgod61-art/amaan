import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { galleryImages as staticImages, GalleryImage } from "../data/gallery";
import { Instagram, Fullscreen, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { db, isQuotaError, isPermissionError, isFirebaseDisabledByQuota } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { getEmbedUrl, isVideoUrl } from "../lib/mediaUtils";
import StorageImage from '../components/StorageImage';
import StorageVideo from '../components/StorageVideo';

const Gallery = () => {
  const [dynamicImages, setDynamicImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const allImages = dynamicImages.length > 0 ? dynamicImages : staticImages;

  useEffect(() => {
    const fetchGallery = async () => {
      if (isFirebaseDisabledByQuota()) {
        setDynamicImages([]);
        return;
      }
      setLoading(true);
      try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const isInvalidUrl = (url: string) => !url || !(url.startsWith('http') || url.startsWith('data:image'));
        
        const fetched = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              url: data.image,
              model: data.title,
              description: data.category,
              type: data.type || "image"
            } as GalleryImage;
          })
          .filter(img => !isInvalidUrl(img.url));
          
        setDynamicImages(fetched);
      } catch (err) {
        if (!isQuotaError(err)) {
          if (isPermissionError(err)) {
            console.warn("Gallery fetching fell back to static data due to permissions:", err);
          } else {
            console.error("Gallery fetch failed", err);
          }
        }
        setDynamicImages([]); 
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextIdx = (currentIndex + 1) % allImages.length;
    setCurrentIndex(nextIdx);
    setSelectedImage(allImages[nextIdx]);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prevIdx = (currentIndex - 1 + allImages.length) % allImages.length;
    setCurrentIndex(prevIdx);
    setSelectedImage(allImages[prevIdx]);
  };

  return (
    <div className="min-h-screen bg-brand-black pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-sans font-bold text-white tracking-tighter mb-4 italic uppercase">
              AGV <span className="text-brand-accent italic">Showcase</span>
            </h1>
            <p className="text-brand-metallic max-w-2xl mx-auto flex items-center justify-center gap-2">
              <Instagram size={16} className="text-brand-accent" />
              Inspired by the world's most elite helmet collections.
            </p>
          </motion.div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-accent" size={32} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => openLightbox(image, index)}
              className="group relative aspect-square overflow-hidden bg-brand-gray border border-white/5 cursor-pointer"
            >
              <StorageImage 
                src={image.url} 
                alt={image.model} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                referrerPolicy="no-referrer"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-brand-accent text-[10px] font-bold uppercase tracking-widest italic">
                    {image.model}
                  </span>
                  {image.type === "video" && (
                    <span className="text-[8px] bg-brand-accent text-white px-2 py-0.5 font-bold uppercase tracking-tighter italic">
                      Video
                    </span>
                  )}
                </div>
                <p className="text-white text-sm font-medium mb-4 leading-tight">
                  {image.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-metallic group-hover:text-white transition-colors">
                    <Fullscreen size={12} />
                    View Larger
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-10 cursor-pointer"
            >
              <button 
                onClick={closeLightbox}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-50 p-2"
              >
                <X size={32} />
              </button>

              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-4"
              >
                <ChevronLeft size={48} />
              </button>

              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-50 p-4"
              >
                <ChevronRight size={48} />
              </button>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center pointer-events-none"
              >
                {isVideoUrl(selectedImage.url) ? (
                  selectedImage.url && (selectedImage.url.startsWith('data:') || /\.(mp4|webm|ogg|mov)$/i.test(selectedImage.url.split('?')[0]) || selectedImage.url.includes('firebasestorage') || selectedImage.url.includes('supabase')) ? (
                    <StorageVideo
                      src={selectedImage.url}
                      className="max-h-[80vh] w-auto object-contain pointer-events-auto"
                      controls
                      autoPlay
                    />
                  ) : (
                    <div className="w-full h-full max-h-[80vh] flex items-center justify-center pointer-events-auto bg-black">
                      <iframe
                        src={getEmbedUrl(selectedImage.url) || undefined}
                        className="w-full h-full max-w-[500px] border-0"
                        title={selectedImage.model}
                        allowFullScreen
                      />
                    </div>
                  )
                ) : (
                  selectedImage.url && (
                    <div className="max-h-[80vh] w-auto bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden">
                      <StorageImage 
                        src={selectedImage.url} 
                        alt={selectedImage.model} 
                        className="max-h-full w-auto object-contain pointer-events-auto" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )
                )}
                <div className="mt-8 text-center pointer-events-auto">
                  <h3 className="text-brand-accent text-lg font-bold uppercase italic tracking-widest">
                    {selectedImage.model}
                  </h3>
                  <p className="text-brand-metallic text-sm mt-2 max-w-xl mx-auto">
                    {selectedImage.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20 text-center border-t border-white/5 pt-12"
        >
          <p className="text-brand-metallic text-sm mb-6 uppercase tracking-[0.2em]">Want to see more?</p>
          <a 
            href="https://www.instagram.com/agvgod?igsh=Znp4NDBtcWI4eXhm" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-brand-accent text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-brand-black transition-colors"
          >
            <Instagram size={20} />
            Follow @agvgod on Instagram
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Gallery;
