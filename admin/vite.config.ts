import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()], cacheDir: '../node_modules/.vite-admin', server: { port: 5174, strictPort: true } });
