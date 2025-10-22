import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// Vite config with React SWC plugin. Nothing exotic.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
