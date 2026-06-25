import React, { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { optimizeImage } from '../lib/imageUtils';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from '../lib/firebase';
import StorageImage from './StorageImage';
import { cn } from '../lib/utils';

export default function AdminPromoUpload() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [activePromo, setActivePromo] = useState<{ images: string[]; active: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current active promo from database
  const fetchActivePromo = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'site_config', 'active_promo'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.images && Array.isArray(data.images) && data.images.length === 5) {
          setActivePromo({
            images: data.images,
            active: !!data.active
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch active promo:', err);
    }
  };

  useEffect(() => {
    fetchActivePromo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setErrorMsg('');
    setSuccessMsg('');
    setSelectedFiles([]);
    setLocalPreviews([]);

    const fileCount = files.length;

    if (fileCount === 5) {
      // Filter out non-images
      const nonImages = files.filter(file => !file.type.startsWith('image/'));
      if (nonImages.length > 0) {
        setErrorMsg('✕ Error: All selected files must be valid images.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Success: Exactly 5 selected
      setSuccessMsg('✓ 5 photos selected successfully. Ready to launch!');
      setSelectedFiles(files);
      
      // Generate previews
      const urls = files.map(file => URL.createObjectURL(file));
      setLocalPreviews(urls);
    } else {
      // Error: Too many or too few selected
      setErrorMsg(`✕ Error: You must select exactly 5 photos. (You picked ${fileCount})`);
      setSelectedFiles([]);
      setLocalPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset selection
    }
  };

  const handleLaunchPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length !== 5) return;

    // Use browser alert as specified in user's script
    alert("Success! Your 5 promo photos are being uploaded.");

    setUploading(true);
    setProgress(15);
    setErrorMsg('');
    setSuccessMsg('');

    // Fast loading progress animation
    const progressTimer = setInterval(() => {
      setProgress(prev => Math.min(90, prev + 12));
    }, 450);

    const startTime = Date.now();

    try {
      const { uploadFileToStorage } = await import('../services/storageService');

      // Process, optimize and upload all 5 photos to Firebase Storage
      const uploadPromises = selectedFiles.map(async (file, idx) => {
        const optimized = await optimizeImage(file);
        return await uploadFileToStorage(
          optimized, 
          file.name, 
          'promo_campaign', 
          `promo-photo-${idx + 1}`
        );
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      // Ensure at least 3-second delay for smooth transitions (and upload constraints)
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
      }

      clearInterval(progressTimer);
      setProgress(100);

      // Save list to database under site_config/active_promo
      await setDoc(doc(db, 'site_config', 'active_promo'), {
        images: uploadedUrls,
        active: true,
        updatedAt: serverTimestamp()
      });

      setActivePromo({
        images: uploadedUrls,
        active: true
      });

      setSuccessMsg('✓ Promotion Launched Successfully! All 5 photos are live.');
      setSelectedFiles([]);
      setLocalPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('Promotion upload failed:', err);
      setErrorMsg(err.message || '✕ Error: Failed to upload promotion photos.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeactivatePromo = async () => {
    if (!window.confirm('Are you sure you want to take down this promotion?')) return;

    try {
      await setDoc(doc(db, 'site_config', 'active_promo'), {
        images: [],
        active: false,
        updatedAt: serverTimestamp()
      });
      setActivePromo(null);
      setSuccessMsg('✓ Promotion has been removed successfully.');
    } catch {
      setErrorMsg('✕ Failed to deactivate promotion.');
    }
  };

  return (
    <div id="promo-upload-card" className="bg-white/5 border border-white/10 p-8 space-y-8 font-sans">
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
          <Sparkles size={20} className="text-brand-accent animate-pulse" />
          Admin Promo Upload
        </h2>
        <p className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mt-2">
          Launch a high-impact 5-photo homepage carousel or promotion campaign instantly.
        </p>
      </div>

      <div className="border border-white/5 bg-black/40 rounded-lg p-6 space-y-6">
        <p className="text-sm text-gray-200">
          Please select <strong>exactly 5 photos</strong> for this promotion.
        </p>

        <form onSubmit={handleLaunchPromo} className="space-y-6">
          <div className="relative group overflow-hidden border border-dashed border-white/20 p-8 rounded-md hover:border-brand-accent/50 hover:bg-brand-accent/5 transition-all flex flex-col items-center justify-center text-center cursor-pointer">
            <input
              type="file"
              id="promo-images"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-brand-accent group-hover:scale-110 transition-all">
                <Upload size={20} className="text-brand-metallic group-hover:text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Select 5 Photos
              </span>
              <span className="text-[10px] text-brand-metallic">
                Click here or Drag & Drop exactly 5 files
              </span>
            </div>
          </div>

          {/* Feedback messages */}
          <div id="msg-error" className="text-xs text-red-500 font-semibold uppercase tracking-wide">
            {errorMsg}
          </div>
          <div id="msg-success" className="text-xs text-green-500 font-semibold uppercase tracking-wide">
            {successMsg}
          </div>

          {/* Local select previews */}
          {localPreviews.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-accent block">Selected Previews:</span>
              <div className="grid grid-cols-5 gap-3">
                {localPreviews.map((url, idx) => (
                  <div key={idx} className="aspect-square relative rounded overflow-hidden border border-brand-accent/50 bg-black">
                    <img src={url} alt={`Local Select ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading status */}
          {uploading && (
            <div className="flex flex-col items-center justify-center py-4 space-y-2 border-t border-white/5">
              <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
              <span className="text-xs font-mono font-bold text-brand-accent">{progress}%</span>
              <span className="text-[10px] uppercase tracking-widest text-white animate-pulse">
                Processing, optimizing and syncing images...
              </span>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-promo"
            disabled={selectedFiles.length !== 5 || uploading}
            className={cn(
              "btn-promo w-full py-4 px-6 font-bold uppercase tracking-widest text-sm transition-all text-center rounded duration-300",
              selectedFiles.length === 5 && !uploading
                ? "bg-brand-accent text-white hover:bg-brand-accent/80 hover:scale-[1.01] shadow-lg shadow-brand-accent/20 cursor-pointer"
                : "bg-white/10 text-brand-metallic cursor-not-allowed"
            )}
          >
            {uploading ? 'Launching Promotion...' : 'Launch Promo'}
          </button>
        </form>
      </div>

      {/* Current Active Promotion Showcase */}
      {activePromo && activePromo.images && activePromo.images.length === 5 && (
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-white">Current Active Promotion</span>
            </div>
            <button
              onClick={handleDeactivatePromo}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 rounded text-[10px] uppercase font-bold tracking-widest text-red-500 hover:text-white transition-all"
            >
              <Trash2 size={12} /> Take Down Promo
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3 p-4 bg-black/40 rounded-lg border border-white/5">
            {activePromo.images.map((imgUrl, idx) => (
              <div key={idx} className="aspect-square relative rounded overflow-hidden border border-white/10 group">
                <StorageImage
                  src={imgUrl}
                  alt={`Promo Photo ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-mono text-white">
                  Photo {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
