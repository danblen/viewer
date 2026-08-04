import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Standalone (self-contained) library build.
//
// Unlike the default build (which externalizes every heavy dep as a
// peerDependency), this variant bundles ALL rendering deps —
// react-markdown, highlight.js, remark-*, rehype-highlight, diff — INTO the
// single emitted JS file. Only React itself stays external so the consuming
// app shares one React instance (bundling React would break hooks).
//
// The result is a drop-in `codeview.js` + `codeview.css` pair that a consumer
// can vendor directly (no npm peer deps to install). Used by aiteam.

// Where the built bundle should be mirrored so the aiteam repo stays
// self-contained (it must run even when this repo isn't present).
// Override with AITEAM_VENDOR_DIR, or set to '' to disable the sync.
const AITEAM_VENDOR_DIR =
  process.env.AITEAM_VENDOR_DIR ?? resolve(__dirname, '../../../../ws-aiteam/aiteam/src/vendor/codeview');

export default defineConfig({
  plugins: [
    react(),
    {
      // After each build, ensure a type declaration sits next to the JS bundle
      // (TS resolves `import '.../codeview'` via the sibling codeview.d.ts),
      // and mirror the bundle into the aiteam vendored backup when reachable.
      name: 'codeview-build-sync',
      closeBundle() {
        const outDir = resolve(__dirname, 'dist-standalone');
        copyFileSync(resolve(__dirname, 'index.d.ts'), resolve(outDir, 'codeview.d.ts'));

        if (AITEAM_VENDOR_DIR) {
          const dst = AITEAM_VENDOR_DIR;
          try {
            mkdirSync(dst, { recursive: true });
            for (const name of ['codeview.js', 'codeview.css', 'codeview.d.ts']) {
              copyFileSync(resolve(outDir, name), resolve(dst, name));
            }
            console.log(`[codeview] synced bundle -> ${dst}`);
          } catch (err) {
            console.warn(`[codeview] skipping aiteam sync (${dst}): ${err.message}`);
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist-standalone',
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es'],
      fileName: () => 'codeview.js',
    },
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      // Keep only React external; everything else is bundled in.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'codeview.css' : '[name][extname]',
      },
    },
  },
});
