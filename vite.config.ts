import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(await electron({
      main: {
        entry: 'electron/main.ts',
        onstart(args) {
          // VS Code sets ELECTRON_RUN_AS_NODE=1 which prevents Electron
          // from initializing its framework. Remove it before launching.
          const env = { ...process.env };
          delete env.ELECTRON_RUN_AS_NODE;
          args.startup(['.', '--no-sandbox'], { env });
        },
      },
      preload: {
        input: 'electron/preload.ts',
      },
    })),
  ],
  build: {
    outDir: 'dist',
  },
}));
