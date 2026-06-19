import * as path from 'node:path';
import { defineConfig } from 'vite';

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
