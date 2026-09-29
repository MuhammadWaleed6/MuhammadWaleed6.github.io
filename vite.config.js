import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed at the domain root (mwalid.me), so no base path needed.
// If you ever deploy to a subpath, set base to '/<repo-name>/'.

// Private admin dashboard path. Baked in at build time so every component
// links to the same hidden URL; it never appears in the footer, sitemap or
// public navigation.
export const ADMIN_BASE = '/kiradmin'

export default defineConfig({
  plugins: [react()],
  base: '/',
  define: {
    __ADMIN_BASE__: JSON.stringify(ADMIN_BASE),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
