import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
      }
    },
    deps: {
      optimizer: {
        web: {
          include: ['zustand', 'react', 'react-dom', 'react-router-dom']
        }
      }
    },
    testTimeout: 20000,
    hookTimeout: 20000,
    threads: false,
    isolate: false,
    sequence: {
      concurrent: false,
      shuffle: false
    },
    pool: 'threads',
    minThreads: 1,
    maxThreads: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/test/**',
        '**/*.d.ts',
      ],
    },
  },
});
