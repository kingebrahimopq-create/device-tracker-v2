/**
 * API Utilities for Device Tracker V2
 * Handles API URL resolution for both Web and Mobile (Capacitor)
 */

export const getBaseUrl = () => {
  // 1. Check for explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  // 2. Handle Capacitor/Mobile environment
  // In Capacitor, window.location.origin is often 'http://localhost' or 'https://localhost'
  // We need to point to the actual backend server
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // If we are in a mobile app, we might need a hardcoded fallback or 
    // a way to discover the server. For now, we'll use the current origin
    // but allow it to be overridden by VITE_API_URL during build.
    return window.location.origin;
  }

  // 3. Default to current origin for web
  if (typeof window !== 'undefined') {
    return window.location.origin;
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
