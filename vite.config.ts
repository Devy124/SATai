import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    // Removed 'base' property so it defaults to '/' (Root) for Vercel
    define: {
      // Prevents "process is not defined" error in browser
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});