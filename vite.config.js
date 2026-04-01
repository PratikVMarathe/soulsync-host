import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'hostApp',
      remotes: {
        quizApp: 'http://localhost:5001/assets/remoteEntry.js',
      },
      // THIS MUST BE A SIMPLE ARRAY:
      shared: ['react', 'react-dom']
    })
  ],
  server: {
    port: 5000,
    strictPort: true,
  },
  preview: {
    port: 5000,
    strictPort: true,
    cors: true
  },
  build: {
    target: 'esnext'
  }
})