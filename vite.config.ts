import { defineConfig } from 'vite';
import * as path from 'node:path';

export default defineConfig({
    root: 'src/static',
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
