import process from 'node:process';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { defineConfig, loadEnv } from 'vite';

const requireEnv = (env, key) => {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

const readPort = (env, key, fallbackPort) => {
  const value = Number.parseInt(env[key] || '', 10);
  return Number.isFinite(value) ? value : fallbackPort;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devPort = readPort(env, 'VITE_DEV_PORT', 5000);
  const previewPort = readPort(env, 'VITE_PREVIEW_PORT', devPort);
  const authPopupHeaders = {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  };

  return {
    plugins: [
      react(),
      federation({
        name: 'hostApp',
        remotes: {
          quizApp: requireEnv(env, 'VITE_QUIZ_REMOTE_URL'),
        },
        shared: ['react', 'react-dom'],
      }),
    ],
    server: {
      headers: authPopupHeaders,
      port: devPort,
      strictPort: true,
    },
    preview: {
      headers: authPopupHeaders,
      port: previewPort,
      strictPort: true,
      cors: true,
    },
    build: {
      target: 'esnext',
    },
  };
});
