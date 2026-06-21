import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Merge process.env VITE_* vars (injected by Docker) with .env file vars
  const viteEnv: Record<string, string> = {}
  for (const [key, val] of Object.entries({ ...env, ...process.env })) {
    if (key.startsWith('VITE_')) viteEnv[`import.meta.env.${key}`] = JSON.stringify(val)
  }

  return {
    plugins: [react()],
    define: viteEnv,
    server: {
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/static': {
          target: process.env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})
