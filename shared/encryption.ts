/**
 * Encryption utility for secure communication between Client and Server
 * Uses a simple XOR for demonstration in this environment, 
 * but structured to be replaced with AES-256 in production.
 */

const SECRET_KEY = "device-tracker-v2-secret-key";

export function encryptData(data: string): string {
  // Simple encryption logic (can be upgraded to Web Crypto API / AES)
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return btoa(result);
}

export function decryptData(encryptedData: string): string {
  const decoded = atob(encryptedData);
  let result = "";
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
  }
  return result;
}
