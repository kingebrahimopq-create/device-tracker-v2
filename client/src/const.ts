export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  
  // Validate required environment variables
  if (!oauthPortalUrl) {
    console.error(
      "Missing environment variable: VITE_OAUTH_PORTAL_URL. " +
      "Please ensure this is set in your Railway environment variables."
    );
    throw new Error(
      "OAuth Portal URL is not configured. Please contact your administrator."
    );
  }
  
  if (!appId) {
    console.error(
      "Missing environment variable: VITE_APP_ID. " +
      "Please ensure this is set in your Railway environment variables."
    );
    throw new Error(
      "App ID is not configured. Please contact your administrator."
    );
  }
  
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  try {
    const url = new URL(`${oauthPortalUrl}/app-auth`);
    url.searchParams.set("appId", appId);
    url.searchParams.set("redirectUri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    return url.toString();
  } catch (error) {
    console.error(
      "Failed to construct OAuth URL. Invalid VITE_OAUTH_PORTAL_URL format:",
      oauthPortalUrl,
      error
    );
    throw new Error(
      "Failed to construct login URL. Please check your configuration."
    );
  }
};

// Helper function to safely get login URL with fallback
export const getSafeLoginUrl = (): string | null => {
  try {
    return getLoginUrl();
  } catch (error) {
    console.error("Error getting login URL:", error);
    return null;
  }
};
