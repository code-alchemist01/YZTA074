// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // <<< Bu satırı ekleyin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { // <<< Bu bloğu ekleyin
    alias: {
      'src': path.resolve(__dirname, './src'), // <<< Bu satırı ekleyin
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'], // Bu kısım sizde varsa kalsın
  },
});