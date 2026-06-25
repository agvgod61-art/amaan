import React, { useState } from 'react';
import { AlertCircle, Upload, Trash2, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { optimizeImage } from '../lib/imageUtils';
import { cn } from '../lib/utils';
import StorageImage from './StorageImage';

interface MultiImageUploadProps {
  images?: string[];
  onImagesChange: (newImages: string[]) => void;
  maxImages?: number;
  featureName?: string;
  itemId?: string;
  label?: string;
}

export default function MultiImageUpload({
  images = [],
  onImagesChange,
  maxImages = 5,
  featureName = "gallery",
  itemId = "batch",
  label = "Batch Upload Images (Max 5 Pics)"
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<{ url: string; name: string }[]>([]);

  const validImages = images.filter(img => img && img.trim() !== "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);

    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    // Check agar 5 se zyada select kiya hai
    if (files.length > maxImages || (validImages.length + files.length > maxImages)) {
      setError(`Bhai, sirf ${maxImages} pictures hi select kar sakte ho! (Maximum ${maxImages} pictures allowed)`);
      e.target.value = ''; // Input clear kar dega taaki user dobara select kare
      return;
    }

    // Filter image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError("Please select valid image files.");
      e.target.value = '';
      return;
    }

    // Local previews dikhao instantly
    const previews = imageFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setLocalPreviews(previews);

    setUploading(true);
    setProgress(10);

    const startTime = Date.now();
    const timer = setInterval(() => {
      setProgress(prev => Math.min(90, prev + 12));
    }, 400);

    try {
      const { uploadFileToStorage } = await import('../services/storageService');

      // Process and upload all files
      const uploadPromises = imageFiles.map(async (file) => {
        const optimized = await optimizeImage(file);
        return await uploadFileToStorage(optimized, file.name, featureName, itemId);
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Ensure 3-second delay requirement (when admin upload image will upload 3 sec)
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise(r => setTimeout(r, 3000 - elapsed));
      }
      clearInterval(timer);
      setProgress(100);

      onImagesChange([...validImages, ...uploadedUrls]);
      setSuccess(true);
      setUploading(false);
      setLocalPreviews([]);
      e.target.value = '';
    } catch (err: any) {
      clearInterval(timer);
      setUploading(false);
      setError(err.message || "Failed to upload images.");
    }
  };

  const removeImage = async (indexToRemove: number) => {
    const imgToRemove = validImages[indexToRemove];
    const newImages = validImages.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(newImages);

    if (imgToRemove && imgToRemove.startsWith('http')) {
      try {
        const { deleteFileFromStorage } = await import('../services/storageService');
        await deleteFileFromStorage(imgToRemove);
      } catch {
        // Ignore storage delete errors
      }
    }
  };

  return (
    <div className="w-full bg-white/5 border border-dashed border-white/20 p-6 rounded-lg font-sans text-center transition-all hover:border-brand-accent/50 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-accent animate-pulse" />
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white m-0">
            {label}
          </h3>
        </div>
        <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-brand-metallic">
          {validImages.length} / {maxImages} Uploaded
        </span>
      </div>

      <div className="relative group p-8 border border-white/10 bg-black/40 rounded flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors hover:bg-brand-accent/5">
        <input
          type="file"
          id="multi-image-input"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading || validImages.length >= maxImages}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />

        {uploading ? (
          <div className="flex flex-col items-center justify-center py-4 z-20">
            <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-mono font-bold text-brand-accent mb-1">{progress}%</span>
            <span className="text-[9px] uppercase tracking-widest text-white font-bold animate-pulse">
              Uploading {localPreviews.length} Image{localPreviews.length > 1 ? 's' : ''} (3s Sync)...
            </span>
          </div>
        ) : validImages.length >= maxImages ? (
          <div className="flex flex-col items-center gap-2 text-brand-metallic py-2">
            <CheckCircle2 size={28} className="text-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Gallery Limit Reached (Max {maxImages})</span>
            <span className="text-[10px]">Delete an image below to upload new ones</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-accent group-hover:scale-110 transition-all">
              <Upload size={18} className="text-brand-metallic group-hover:text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Click or Drag & Drop Multiple Images
            </span>
            <span className="text-[10px] text-brand-metallic">
              Select up to {maxImages - validImages.length} more picture{maxImages - validImages.length > 1 ? 's' : ''} at once
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded flex items-center justify-center gap-2 text-red-400 animate-in fade-in zoom-in duration-300">
          <AlertCircle size={16} className="flex-shrink-0 text-red-500" />
          <p className="text-xs font-bold m-0 text-left">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && !uploading && (
        <div className="text-xs text-green-400 font-bold uppercase tracking-widest bg-green-500/10 py-2 rounded border border-green-500/20 flex items-center justify-center gap-2">
          <CheckCircle2 size={14} /> Images Successfully Added to Gallery!
        </div>
      )}

      {/* Temporary Local Previews while uploading */}
      {localPreviews.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-accent block text-left">Uploading Previews:</span>
          <div className="flex gap-3 flex-wrap justify-center">
            {localPreviews.map((p, idx) => (
              <div key={idx} className="w-[100px] h-[100px] relative rounded overflow-hidden border border-brand-accent/50 bg-black opacity-70 animate-pulse">
                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Gallery (Yahan select ki hui images dikhengi) */}
      {validImages.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-metallic block text-left">Current Gallery Preview:</span>
          <div className="flex gap-3 flex-wrap justify-center p-3 bg-black/30 rounded border border-white/5">
            {validImages.map((imgUrl, idx) => (
              <div key={idx} className="w-[100px] h-[100px] relative rounded overflow-hidden border border-white/20 group bg-brand-black shadow-lg">
                <StorageImage
                  src={imgUrl}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                  title="Remove image"
                >
                  <Trash2 size={12} />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white pointer-events-none">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
