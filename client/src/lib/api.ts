/**
 * API Utilities for Device Tracker V2
 * Handles API URL resolution for both Web and Mobile (Capacitor)
 */

export const getBaseUrl = () => {
  // 1. Check for explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "" && envUrl !== "undefined") {
    try {
      return new URL(envUrl).origin;
    } catch (e) {
      console.error("Invalid VITE_API_URL:", envUrl);
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
