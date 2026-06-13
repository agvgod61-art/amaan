import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../lib/firebase";

/**
 * Uploads a file or blob to Firebase Storage and returns the download URL.
 * Includes progress tracking and error handling.
 */
export const uploadFileToStorage = async (
  file: File | Blob, 
  originalName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const fileName = `${Date.now()}_${originalName.replace(/\s+/g, '_')}`;
  const storageRef = ref(storage, `assets/${fileName}`);
  
  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Track if we've already resolved or rejected
    let finished = false;

    console.log(`[Storage] Starting upload of ${originalName} (${(file.size / 1024).toFixed(1)} KB)`);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
        console.log(`[Storage] Uploading ${originalName}: ${progress.toFixed(1)}% (${(snapshot.bytesTransferred / 1024).toFixed(1)}/${(snapshot.totalBytes / 1024).toFixed(1)} KB)`);
      },
      (error) => {
        if (finished) return;
        finished = true;
        console.error("Firebase Storage Upload Error:", error);
        let errorMessage = "Upload failed. Please try again.";
        if (error.code === 'storage/retry-limit-exceeded') {
          errorMessage = "Connection timed out. Check your network.";
        } else if (error.code === 'storage/unauthorized') {
          errorMessage = "Access denied. You may need to sign in as Admin/Staff.";
        } else if (error.code === 'storage/canceled') {
          errorMessage = "Upload was canceled by the system.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        reject(new Error(errorMessage));
      },
      async () => {
        if (finished) return;
        finished = true;
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log(`[Storage] Success: ${downloadURL}`);
          resolve(downloadURL);
        } catch (error: any) {
          reject(new Error("Failed to retrieve download URL."));
        }
      }
    );

    // Timeout after 600 seconds (10 minutes) for slower connections
    setTimeout(() => {
      if (!finished) {
        finished = true;
        uploadTask.cancel();
        console.warn(`[Storage] Upload timed out for ${originalName} after 600s`);
        reject(new Error("Upload timed out (600s limit). If this persists, try a smaller file or a better connection."));
      }
    }, 600000);
  });
};
