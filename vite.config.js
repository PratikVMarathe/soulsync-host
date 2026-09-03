import process from 'node:process';
import path from 'node:path';
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

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = command === 'serve';
  const devPort = readPort(env, 'VITE_DEV_PORT', 5000);
  const previewPort = readPort(env, 'VITE_PREVIEW_PORT', devPort);
  const authPopupHeaders = {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  };
  const workspaceRoot = path.resolve(process.cwd(), '..');

  return {
    resolve: isDev
      ? {
          alias: {
            'adminApp/AdminModule': path.resolve(workspaceRoot, 'soulsync-admin/src/AdminModule.jsx'),
            'quizApp/QuizWidget': path.resolve(workspaceRoot, 'soulsync-quiz/src/App.jsx'),
          },
        }
      : {},
    plugins: [
      react(),
      ...(!isDev
        ? [
            federation({
              name: 'hostApp',
              remotes: {
                adminApp: requireEnv(env, 'VITE_ADMIN_REMOTE_URL'),
                quizApp: requireEnv(env, 'VITE_QUIZ_REMOTE_URL'),
              },
              shared: ['react', 'react-dom', 'react-router', 'react-router-dom'],
            }),
          ]
        : []),
    ],
    server: {
      fs: {
        allow: [workspaceRoot],
      },
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
      // The federation plugin rewrites string inputs incorrectly on Windows.
      rollupOptions: {
        input: {
          index: 'index.html',
        },
      },
      target: 'esnext',
    },
  };
});
