import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@core': r('./src/core'), '@ui': r('./src/ui'), '@modules': r('./src/modules') },
  },
  test: { environment: 'jsdom', globals: false },
});
