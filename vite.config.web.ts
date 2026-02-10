import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Web-only build: no Electron plugins, base path for /app/ subpath
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  build: {
    outDir: 'dist-web',
  },
});
