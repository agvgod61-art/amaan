import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { optimizeImage } from '../lib/imageUtils';
import { cn } from '../lib/utils';
import { getSignedImageUrl } from '../services/storageService';
import StorageImage from './StorageImage';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  label?: string;
  className?: string;
  initialUrl?: string;
  accept?: string;
  featureName?: string;
  itemId?: string;
}

export default function ImageUpload({ onUploadComplete, label = "Upload Image", className, initialUrl, accept = "image/*", featureName = "general", itemId = "new" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState<string>('');

  useEffect(() => {
    if (initialUrl) {
      if (initialUrl.startsWith('http') || initialUrl.startsWith('data:') || initialUrl.startsWith('blob:')) {
        setPreview(initialUrl);
      } else {
        getSignedImageUrl(initialUrl).then(setPreview).catch(() => setPreview(initialUrl));
      }
    } else {
      setPreview(null);
    }
  }, [initialUrl]);

  const handleUrlSubmit = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (pasteUrl.trim()) {
      onUploadComplete(pasteUrl.trim());
      setPreview(pasteUrl.trim());
      setSuccess(true);
      setError(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate based on accept prop
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';

    if (accept.includes('image/') && !isImage && accept !== '*') {
       // If it's supposed to be an image but isn't
       if (!isVideo && !isPdf) {
         setError("Please select a valid image file");
         return;
       }
    }

    // Local preview for images
    if (isImage) {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
    } else {
      setPreview(null);
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      let fileToUpload: File | Blob = file;

      // High-Speed Client-Side Optimization for images
      if (isImage) {
        fileToUpload = await optimizeImage(file);
      }

      const startTime = Date.now();
      setProgress(15);
      const timer = setInterval(() => {
        setProgress(prev => Math.min(90, prev + 15));
      }, 450);

      // Import upload service dynamically to avoid circular deps or just top level
      const { uploadFileToStorage } = await import('../services/storageService');
      
      const url = await uploadFileToStorage(
        fileToUpload, 
        file.name, 
        featureName, 
        itemId
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise(r => setTimeout(r, 3000 - elapsed));
      }
      clearInterval(timer);

      onUploadComplete(url);
      setSuccess(true);
      setUploading(false);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || "Failed to process image");
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between ml-1">
        <label className="text-[10px] uppercase font-bold tracking-widest text-brand-metallic">
          {label}
        </label>
      </div>
      
      <div className="relative group overflow-hidden">
        <input 
          type="file" 
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 disabled:cursor-not-allowed"
          disabled={uploading}
        />
        
        <div className={cn(
          "w-full bg-white/5 border border-dashed border-white/20 p-6 flex flex-col items-center justify-center gap-3 transition-all group-hover:border-brand-accent group-hover:bg-brand-accent/5 aspect-video relative",
          success && "border-green-500/30 bg-green-500/5",
          error && "border-brand-accent/50 bg-brand-accent/5"
        )}>
          {preview ? (
            <div className="absolute inset-0 z-0">
               <StorageImage 
                 src={preview} 
                 alt="Preview" 
                 className={cn(
                   "w-full h-full object-cover transition-all duration-500",
                   uploading ? "opacity-30 scale-105 blur-sm" : "opacity-100"
                 )}
                 referrerPolicy="no-referrer"
               />
                {uploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                    <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3" />
                    <span className="text-[10px] text-brand-accent font-mono font-bold mb-1">{progress}%</span>
                    <span className="text-[8px] text-white uppercase tracking-[0.3em] font-bold animate-pulse">Uploading Asset</span>
                  </div>
                )}
            </div>
          ) : null}

          <div className="relative z-10 flex flex-col items-center justify-center gap-2">
            {error ? (
              <div className="flex flex-col items-center gap-2">
                <AlertCircle className="text-red-500" size={24} />
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setError(null);
                    setSuccess(false);
                  }}
                  className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 hover:bg-red-500 hover:text-white transition-all uppercase font-bold"
                >
                  Reset & Retry
                </button>
              </div>
            ) : (!preview && !uploading) ? (
              <div className="w-6 h-6 border border-white/20 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-white rounded-full animate-ping" />
              </div>
            ) : null}

            <div className="text-center">
              <p className={cn(
                 "text-[10px] font-bold uppercase tracking-widest",
                 success ? "text-green-500 z-20 relative bg-black/50 px-2 py-1 rounded backdrop-blur-sm" : error ? "text-red-500" : "text-white"
              )}>
                {uploading ? "" : success ? "UPLOAD SUCCESSFUL" : error ? "Failed" : "Select Image"}
              </p>
              {error && <p className="text-[7px] text-red-500 uppercase mt-1 max-w-[200px] mx-auto leading-tight italic font-bold">{error}</p>}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-center text-[10px] text-brand-metallic uppercase font-bold tracking-widest">
        OR
      </div>
      
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste Imgur, Unsplash, or Web URL..."
          value={pasteUrl}
          onChange={(e) => setPasteUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleUrlSubmit(e);
            }
          }}
          className="flex-grow bg-black border border-white/10 p-2 text-white text-[10px] font-mono focus:border-brand-accent outline-none transition-colors placeholder:text-white/20"
        />
        <button
          type="button"
          onClick={handleUrlSubmit}
          disabled={!pasteUrl.trim()}
          className="bg-white/5 border border-white/10 px-4 py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-white/10 hover:text-brand-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
