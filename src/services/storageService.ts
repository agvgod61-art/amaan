import { supabase } from '../lib/supabase';

/**
 * Uploads a file or blob to Supabase Storage and returns the path.
 * Includes progress tracking (mocked, as Supabase standard client doesn't heavily emit progress) and error handling.
 */
export const uploadFileToStorage = async (
  file: File | Blob, 
  originalName: string,
  featureName: string = 'general',
  itemId: string = 'new',
  onProgress?: (progress: number) => void
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'guest';
  
  const extension = originalName.split('.').pop() || 'tmp';
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const fileName = `${userId}/${featureName}/${itemId}/${uuid}.${extension}`;
  
  console.log(`[Storage] Starting upload of ${originalName} (${(file.size / 1024).toFixed(1)} KB)`);
  if (onProgress) onProgress(0); // Supabase doesn't natively support progress tracking on JS client simply
  
  const { data, error } = await supabase.storage.from('app-files').upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    console.error("Supabase Storage Upload Error:", error);
    throw new Error(error.message || "Upload failed. Please try again.");
  }
  
  if (onProgress) onProgress(100);

  console.log(`[Storage] Success: ${data.path}`);
  return data.path;
};

export const getSignedImageUrl = async (path: string): Promise<string> => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path; // Already a URL
  
  const { data, error } = await supabase.storage.from('app-files').createSignedUrl(path, 60 * 60 * 24); // 24 hours
  if (error) {
    console.error("Error getting signed url for", path, error);
    return path; // Fallback
  }
  return data.signedUrl;
};

export const deleteFileFromStorage = async (path: string): Promise<void> => {
    if (!path || path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return;
    
    // Attempt deletion
    const { error } = await supabase.storage.from('app-files').remove([path]);
    if (error) {
        console.error("Error deleting from storage:", error);
    } else {
        console.log(`[Storage] Deleted file: ${path}`);
    }
};
