import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  root: './src/ui',
  plugins: [
    react(),
    dts({ tsconfigPath: './tsconfig.ui.json' }),
  ],
  server: {
    port: 9002,
  },
});
