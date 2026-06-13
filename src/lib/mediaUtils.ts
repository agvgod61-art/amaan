/**
 * Utility to transform various social media and video URLs into embeddable format.
 */
export function getEmbedUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Instagram Post/Reel
  if (url.includes('instagram.com/')) {
    if (url.includes('/p/') || url.includes('/reel/') || url.includes('/reels/')) {
      const base = url.split('?')[0];
      return `${base.endsWith('/') ? base : base + '/'}embed/`;
    }
  }

  // YouTube Shorts
  if (url.includes('/shorts/')) {
    const parts = url.split('/shorts/');
    if (parts[1]) {
      const videoId = parts[1].split('?')[0].split('&')[0].split('/')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // YouTube Watch / Live
  if (url.includes('youtube.com/watch')) {
    const parts = url.split('v=');
    if (parts[1]) {
      const videoId = parts[1].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/');
    if (parts[1]) {
      const videoId = parts[1].split('?')[0].split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return url;
}

/**
 * Checks if a URL is an image type (base64 or standard extension)
 */
export function isImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:image/')) return true;
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(url.split('?')[0]);
}

/**
 * Checks if a URL is a video type
 */
export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  if (url.includes('instagram.com/') || url.includes('youtube.com/') || url.includes('youtu.be/')) return true;
  return /\.(mp4|webm|ogg|mov)$/i.test(url.split('?')[0]);
}
