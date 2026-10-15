/** Secrets and optional variables that aren't declared in wrangler.jsonc. */
declare namespace Cloudflare {
  interface Env {
    /**
     * Enables POST /api/admin/sync when set to a long random value
     * (`wrangler secret put ADMIN_TOKEN`). Unset, the route answers 404.
     */
    ADMIN_TOKEN?: string;
    /** GA4 web stream. Only enabled on the production apex domain. */
    GA_MEASUREMENT_ID?: string;
  }
}

/** Vite resolves `?url` imports to the built asset's public URL. */
declare module "*?url" {
  const url: string;
  export default url;
}
