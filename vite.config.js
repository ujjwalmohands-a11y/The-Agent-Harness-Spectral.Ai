import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
// Force vite restart to clear import cache for @base-ui/react
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
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
            if (env.GROQ_API_KEY) {
              proxyReq.setHeader('Authorization', `Bearer ${env.GROQ_API_KEY}`);
            }
          });
        }
      },
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  }
})
