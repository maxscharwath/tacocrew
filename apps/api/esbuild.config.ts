import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to resolve TypeScript path aliases
const pathAliasPlugin: esbuild.Plugin = {
  name: 'path-alias',
  setup(build) {
    // Resolve @/* to ./src/*
    build.onResolve({ filter: /^@\// }, (args) => {
      const subpath = args.path.slice(2); // Remove '@/'
      let resolvedPath = resolve(__dirname, 'src', subpath);

      // Check if it's a file that exists or try extensions
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
      let found = false;

      for (const ext of extensions) {
        const pathWithExt = resolvedPath + ext;
        if (existsSync(pathWithExt)) {
          const stats = statSync(pathWithExt);
          if (stats.isFile()) {
            resolvedPath = pathWithExt;
            found = true;
            break;
          }
        }
      }

      return { path: resolvedPath };
    });
  },
};

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'esnext',
  format: 'esm',
  outfile: 'dist/index.js',
  packages: 'external',
  plugins: [pathAliasPlugin],
  sourcemap: true,
});
