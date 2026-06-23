import { auth, db } from '../lib/firebase';
import { realStorage } from '../lib/real-firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, getDoc } from 'firebase/firestore';

export const uploadFileToStorage = async (
  file: File | Blob, 
  originalName: string,
  featureName: string = 'general',
  itemId: string = 'new',
  onProgress?: (progress: number) => void
): Promise<string> => {
  const user = auth.currentUser;
  
  if (!user || !user.email) {
    throw new Error("Direct image upload blocked. You must be logged in as an admin.");
  }

  const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"];
  let isAdmin = false;
  
  if (SUPER_ADMINS.includes(user.email.toLowerCase())) {
    isAdmin = true;
  } else {
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.email.toLowerCase()));
      isAdmin = adminDoc.exists();
    } catch (e) {
      console.error("Failed to check admin status", e);
    }
  }

  if (!isAdmin) {
    throw new Error("Direct image upload blocked. Admin permission required.");
  }

  const userId = user.uid;
  
  const extension = originalName.split('.').pop() || 'tmp';
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
  const fileName = `${userId}/${featureName}/${itemId}/${uuid}.${extension}`;
  
  console.log(`[Storage] Starting upload of ${originalName} (${(file.size / 1024).toFixed(1)} KB)`);
  if (onProgress) onProgress(0);

  try {
    const storageRef = ref(realStorage, `app-files/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      cacheControl: 'public, max-age=31536000'
    });

    return await new Promise<string>((resolve, reject) => {
      // Timeout to catch CORS issues or hanging uploads
      const timeoutId = setTimeout(() => {
        console.warn("Firebase Storage upload timed out (likely CORS issue), canceling...");
        uploadTask.cancel();
      }, 15000);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (progress > 0) clearTimeout(timeoutId); // We are transferring data
          if (onProgress) onProgress(progress);
        },
        (error) => {
          clearTimeout(timeoutId);
          // Silent fallback to base64
          console.log("Firebase Storage Upload Error, falling back to base64", error);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutId);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`[Storage] Success: ${downloadURL}`);
            resolve(downloadURL);
          } catch(err) {
            console.error("Error getting download URL", err);
            reject(err);
          }
        }
      );
    });
  } catch (err: any) {
    console.log("Storage upload falling back to Base64 Data URL.");
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) resolve(reader.result as string);
          else reject(new Error("Failed to read file"));
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });
    } catch (fallbackError) {
      throw new Error(err?.message || "Upload failed. Please try again.");
    }
  }
};

export const getSignedImageUrl = async (path: string): Promise<string> => {
  if (!path) return '';
  // If it's already a full URL or data URI, return as is
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  
  try {
    const storageRef = ref(realStorage, path.startsWith('app-files/') ? path : `app-files/${path}`);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting download url for", path, error);
    return path; // Fallback
  }
};

export const deleteFileFromStorage = async (path: string): Promise<void> => {
  if (!path || path.startsWith('data:') || path.startsWith('blob:')) return;
  
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error("Direct image deletion blocked. You must be logged in as an admin.");
  }

  const SUPER_ADMINS = ["yamaan115@gmail.com", "avggod61@gmail.com", "agvgod61@gmail.com"];
  let isAdmin = false;
  if (SUPER_ADMINS.includes(user.email.toLowerCase())) {
    isAdmin = true;
  } else {
    try {
      const adminDoc = await getDoc(doc(db, "admins", user.email.toLowerCase()));
      isAdmin = adminDoc.exists();
    } catch (e) {
      console.error("Failed to check admin status", e);
    }
  }

  if (!isAdmin) {
    throw new Error("Direct image deletion blocked. Admin permission required.");
  }
  
  try {
    // If it's a full Firebase Storage URL, we can create a ref from it
    let storageRef;
    if (path.startsWith('https://firebasestorage.googleapis.com')) {
      storageRef = ref(realStorage, path);
    } else {
       storageRef = ref(realStorage, path.startsWith('app-files/') ? path : `app-files/${path}`);
    }
    await deleteObject(storageRef);
    console.log(`[Storage] Deleted file: ${path}`);
  } catch (error) {
    console.error("Error deleting from storage:", error);
  }
};
