#!/usr/bin/env bun
/**
 * Build script for plugin-biconomy
 */

import { build } from 'bun';
import { join, dirname } from 'path';

const __dirname = dirname(new URL(import.meta.url).pathname);

const result = await build({
  entrypoints: [join(__dirname, 'src/index.ts')],
  outdir: join(__dirname, 'dist'),
  target: 'node',
  format: 'esm',
  external: [
    '@elizaos/core',
    'viem',
  ],
  sourcemap: true,
  minify: false,
});

if (result.success) {
  console.log('✓ plugin-biconomy build successful');
} else {
  console.error('✗ plugin-biconomy build failed');
  process.exit(1);
}
