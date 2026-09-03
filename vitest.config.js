import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'adminApp/AdminModule': path.resolve(dirname, '../soulsync-admin/src/AdminModule.jsx'),
      'quizApp/QuizWidget': path.resolve(dirname, '../soulsync-quiz/src/App.jsx'),
    },
  },
  test: {
    coverage: {
      exclude: [
        'src/main.jsx',
        'src/config/**',
        '**/*.config.{js,ts}',
        '**/assets/**',
        'node_modules/**',
        'dist/**',
      ],
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
  },
});
