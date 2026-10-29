import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['contracts', 'math-core', 'content', 'animation-engine'].map((name) => [
        `@mathstudy/${name}`,
        fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url)),
      ]),
    ),
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
});
