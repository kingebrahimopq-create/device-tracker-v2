export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  oAuthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Validate required environment variables
if (!ENV.appId) {
  console.warn("Warning: VITE_APP_ID is not set in environment variables");
}
if (!ENV.oAuthPortalUrl) {
  console.warn("Warning: VITE_OAUTH_PORTAL_URL is not set in environment variables");
}
if (!ENV.databaseUrl) {
  console.warn("Warning: DATABASE_URL is not set in environment variables");
}
