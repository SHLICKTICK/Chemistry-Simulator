import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const STATIC_FILES = ['manifest.webmanifest', 'icons/favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png'];

/** Emits sw.js with the exact list of built files to precache (including lazy chunks such as Three.js). */
function serviceWorker() {
  let base = '/';
  return {
    name: 'chemsim-sw',
    apply: 'build' as const,
    configResolved(c: { base: string }) { base = c.base; },
    generateBundle(_: unknown, bundle: Record<string, { type: string; code?: string; source?: string | Uint8Array }>) {
      const hash = createHash('sha1');
      const files = Object.keys(bundle).sort();
      for (const f of files) hash.update(f).update(bundle[f].type === 'chunk' ? bundle[f].code! : (bundle[f].source as string | Uint8Array));
      // index.html is emitted by Vite's HTML plugin after this hook runs, so list it explicitly.
      const urls = [base, 'index.html', ...files, ...STATIC_FILES].map((f) => (f === base ? f : base + f));
      const src = readFileSync('sw.template.js', 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 10))
        .replace('__PRECACHE__', JSON.stringify(urls))
        .replace('__BASE__', base);
      (this as unknown as { emitFile(f: object): void }).emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

export default defineConfig({ plugins: [serviceWorker()], test: { include: ['src/**/*.test.ts'] } });
