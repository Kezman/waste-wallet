import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

declare const process: { env: Record<string, string | undefined> }

// GitHub Pages отдаёт проект по адресу /<repo>/, поэтому префикс задаётся переменной окружения.
// Для Netlify, Cloudflare, Vercel и локальной сборки это просто "/".
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: false,
    watch: {
      // Временные файлы редактора и служебные папки роняют watcher (EBUSY) на Windows.
      ignored: ['**/.*', '**/.*/**', '**/docs/**', '**/dist/**'],
    },
  },
})
