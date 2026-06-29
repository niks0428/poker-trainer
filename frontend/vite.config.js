import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/poker-trainer/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5700',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
