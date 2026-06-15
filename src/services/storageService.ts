import { supabase } from '../lib/supabase';

/**
 * Uploads a file or blob to Supabase Storage and returns the download URL.
 * Includes progress tracking (mocked, as Supabase standard client doesn't heavily emit progress) and error handling.
 */
export const uploadFileToStorage = async (
  file: File | Blob, 
  originalName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileName = `${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
  
  console.log(`[Storage] Starting upload of ${originalName} (${(file.size / 1024).toFixed(1)} KB)`);
  if (onProgress) onProgress(0); // Supabase doesn't natively support progress tracking on JS client simply
  
  const { data, error } = await supabase.storage.from('assets').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    console.error("Supabase Storage Upload Error:", error);
    throw new Error(error.message || "Upload failed. Please try again.");
  }
  
  if (onProgress) onProgress(100);

  const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
  console.log(`[Storage] Success: ${publicUrl}`);
  return publicUrl;
};
