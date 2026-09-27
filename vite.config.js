import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deployed at the domain root (mwalid.me), so no base path needed.
// If you ever deploy to a subpath, set base to '/<repo-name>/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
