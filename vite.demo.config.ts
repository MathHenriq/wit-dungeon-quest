// Build só da cidade jogável, com caminhos relativos (roda em qualquer pasta).
//   npx vite build -c vite.demo.config.ts   → dist-demo/cidade.js + cidade.css
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  publicDir: false,
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/demo/cidade-main.tsx'),
      output: { entryFileNames: 'cidade.js', assetFileNames: 'cidade[extname]', inlineDynamicImports: true },
    },
  },
});
