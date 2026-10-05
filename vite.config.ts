import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages project site: https://shankar5459.github.io/TODO_Tracker/
  base: '/TODO_Tracker/',
})
