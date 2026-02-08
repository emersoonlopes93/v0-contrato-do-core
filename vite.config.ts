import path from "path"
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = env.VITE_DEV_PORT ? Number(env.VITE_DEV_PORT) : 5173
  const devPort = Number.isFinite(port) ? port : 5173
  const apiPort = env.PORT ?? '3000'
  const apiUrl = env.VITE_API_URL || `http://localhost:${apiPort}`

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: apiUrl,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  }
})
