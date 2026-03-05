/**
 * API Utilities for Device Tracker V2
 * Handles API URL resolution for both Web and Mobile (Capacitor)
 */

export const getBaseUrl = () => {
  // 1. Check for explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== "" && envUrl !== "undefined") {
    try {
      // Ensure it's a valid absolute URL before passing to new URL()
      if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
        return new URL(envUrl).origin;
      }
      console.warn("VITE_API_URL is not an absolute URL:", envUrl);
    } catch (e) {
      console.error("Invalid VITE_API_URL format:", envUrl);
    }
  }

  // 2. Handle Capacitor/Mobile environment
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // If we are in a mobile app (localhost/capacitor), we must have VITE_API_URL
    // otherwise it will fail. For web, origin is fine.
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
       // If no VITE_API_URL, we'll return origin but log a warning
       return origin;
    }
    return origin;
  }

  return '';
};

export const getTrpcUrl = () => {
  const baseUrl = getBaseUrl();
  // Ensure baseUrl is a valid URL string before appending
  try {
    if (baseUrl) {
      const url = new URL('/api/trpc', baseUrl);
      return url.toString();
    }
  } catch (e) {
    console.error("Invalid Base URL for tRPC:", baseUrl);
  }
  return '/api/trpc'; // Fallback to relative path
};
