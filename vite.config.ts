import * as path from 'node:path';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src/static',
    plugins: [
        importMetaUrlPlugin
    ],
    build: {
        outDir: path.resolve(__dirname, 'public'),
        emptyOutDir: true
    },
    resolve: {
        dedupe: ['vscode']
    },
    worker: {
        format: 'es'
    }
});
