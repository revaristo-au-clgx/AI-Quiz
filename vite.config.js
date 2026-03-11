import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Change '/ai-quiz/' to match your GitHub repo name if different.
export default defineConfig({
  plugins: [react()],
  base: '/AI-Quiz/',
})
