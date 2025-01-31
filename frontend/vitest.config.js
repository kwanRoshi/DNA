import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/test/setup.js',
      'src/main.jsx'
    ],
    globals: true,
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        pretendToBeVisual: true,
        url: 'http://localhost'
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    maxConcurrency: 1,
    maxThreads: 1,
    minThreads: 1,
    reporters: ['default'],
    pool: 'threads',
    isolate: true,
    watch: false,
    passWithNoTests: false,
    allowOnly: true,
    sequence: {
      hooks: 'stack',
      shuffle: false,
      concurrent: false
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'src/test/**',
        '**/*.d.ts',
        'src/main.jsx',
        'src/vite-env.d.ts',
        'src/test/setup.js'
      ],
      include: [
        'src/components/**/*.{js,jsx}',
        'src/services/**/*.{js,jsx}',
        'src/utils/**/*.{js,jsx}'
      ],
      all: true,
      clean: true,
      cleanOnRerun: true,
      skipFull: false,
      perFile: true,
      reportOnFailure: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
        perFile: true
      },
      reportsDirectory: './coverage'
    }
  }
});
