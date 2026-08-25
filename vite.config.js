import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
// Force vite restart to clear import cache for @base-ui/react
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/transcribe': {
        target: 'https://api.groq.com/openai/v1/audio/transcriptions',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/transcribe/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (process.env.GROQ_API_KEY) {
              proxyReq.setHeader('Authorization', `Bearer ${process.env.GROQ_API_KEY}`);
            }
          });
        }
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
