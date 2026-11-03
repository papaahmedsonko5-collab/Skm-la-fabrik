import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Même alias « @/ » que dans tsconfig.json, pour tester les modules du site.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
