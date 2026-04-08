// vite.config.ts
import fs from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fs.realpathSync.native(process.cwd())

export default defineConfig(({ mode }) => {
  // Carga las variables según el modo (development/production)
  const env = loadEnv(mode, projectRoot, '')
  
  return {
    root: projectRoot,
    plugins: [react()],
    server: {
      // Proxy SOLO para desarrollo
      proxy: mode === 'production' ? {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
        },
      } : undefined,
    },
    // Define para que esté disponible en el cliente
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL),
    },
  }
})