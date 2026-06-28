import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/teqnika-ngrok/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/photos': 'http://localhost:8000',
    },
  },
})
