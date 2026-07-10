import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.mjs',
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Mark native modules or peer dependencies as external if needed
  external: ['esbuild', 'pino', 'cosmiconfig', 'zod', 'react', 'ink', 'effect']
}).catch(() => process.exit(1));
