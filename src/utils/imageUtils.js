/**
 * Helper function to get full image URL for both local and production environments
 * @param {string} imagePath - The image path from the backend (e.g., "/uploads/image.jpg")
 * @returns {string|null} - Full URL to the image or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // External URL
  
  // Ensure imagePath starts with /
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // In development, use Vite proxy (same origin - no CORS issues)
  if (import.meta.env.DEV) {
    return cleanPath; // e.g., "/uploads/image.jpg" - Vite proxy handles this
  }
  
  // In production, construct full URL
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';
  const baseUrl = API_BASE.replace('/api', ''); // Remove /api suffix to get base domain
  
  return `${baseUrl}${cleanPath}`;
};

/**
 * Helper function specifically for website components with fallback
 * @param {string} imagePath - The image path from the backend
 * @returns {string} - Full URL to the image or placeholder
 */
export const getImageUrlWithFallback = (imagePath) => {
  const url = getImageUrl(imagePath);
  return url || '/placeholder.svg';
};

/**
 * Create an image element with proper error handling and CORS settings
 * @param {string} imagePath - The image path from the backend
 * @param {Object} options - Additional options for the image
 * @returns {Promise} - Promise that resolves when image loads or rejects on error
 */
export const loadImage = (imagePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Only set crossOrigin for external URLs in production
    if (!import.meta.env.DEV && imagePath.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
    
    img.src = getImageUrl(imagePath);
    
    // Apply any additional options
    Object.assign(img, options);
  });
};