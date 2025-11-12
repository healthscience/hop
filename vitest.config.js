import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    concurrency: 1,  // Run tests sequentially
    threads: false,  // Disable parallel execution
    isolate: true,   // Ensure each test runs in isolation
    watch: false,    // Disable watch mode
  },
});