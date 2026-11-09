/**
 * Shared LIVE-PREVIEW OAuth client placeholders (server-only).
 *
 * The real Grok preview client secret was removed from this public GitHub Pages
 * repo. Grok sandbox auth is unused here; deploy-time GROK_AUTH_* env vars (if
 * any) still override these via server.ts.
 */
export const PREVIEW_CLIENT_ID = "grok_preview";
export const PREVIEW_CLIENT_SECRET = "";

/** The shared auth broker issuer (OIDC discovery lives under it). */
export const GROK_ISSUER_DEFAULT = "https://auth.grok.me";

/**
 * Host patterns whose callbacks the preview client accepts. Better Auth derives
 * the live preview's real origin from the request host and validates it against
 * this list (wildcard-matched), so the OAuth `redirect_uri` becomes the concrete
 * `https://<preview-host>/api/auth/oauth2/callback/...` the broker allows.
 */
export const PREVIEW_ALLOWED_HOSTS = ["*.grok-sandbox.com"] as const;
