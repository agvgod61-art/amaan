/**
 * High-Speed Client-Side Image Optimizer
 * Shinks images to maximum 800px and compresses to 0.5 quality to ensure sub-second uploads.
 */
export async function optimizeImage(file: File | Blob, maxWidth = 800, quality = 0.5): Promise<Blob | File> {
  // If it's not an image, return original
  if (!file.type.startsWith('image/')) return file;
  
  // Don't optimize SVG or small images
  if (file.type === 'image/svg+xml') return file;

  return new Promise((resolve) => {
    // Safety timeout for optimization process (10 seconds)
    const timeout = setTimeout(() => {
      const fileName = 'name' in file ? (file as File).name : 'blob';
      console.warn(`[ImageUtils] Optimization timed out for ${fileName}, using original.`);
      resolve(file);
    }, 10000);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxHeight = 800;

        // Resize if exceeding max dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }

        // If file is already small (<200KB) and narrow, don't bother re-compressing
        if (file.size < 200000 && img.width <= maxWidth && img.height <= maxHeight) {
          clearTimeout(timeout);
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          clearTimeout(timeout);
          resolve(file);
          return;
        }

        // Use black background for transparent images to fit branding, or white if preferred.
        // The current app uses dark themes mostly.
        ctx.fillStyle = 'black'; 
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            clearTimeout(timeout);
            if (blob) {
              // Convert blob to File to preserve filename info for Firebase
              const fileName = 'name' in file ? (file as File).name : `upload_${Date.now()}.jpg`;
              const optimizedFile = new File([blob], fileName.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              // Only use optimized if it's actually smaller
              if (optimizedFile.size < file.size) {
                console.log(`[Storage] Optimized: ${(file.size / 1024).toFixed(1)}KB -> ${(optimizedFile.size / 1024).toFixed(1)}KB`);
                resolve(optimizedFile);
              } else {
                resolve(file);
              }
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file);
      };
    };
    reader.onerror = () => {
      clearTimeout(timeout);
      resolve(file);
    };
  });
}

/**
 * Converts a base64 data URL to a Blob for Firebase Storage upload.
 */
export function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
