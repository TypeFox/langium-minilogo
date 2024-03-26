import shell from 'shelljs'

// copy workers to public
shell.mkdir('-p', './public/monaco-editor-wrapper/dist/workers');
shell.cp('-fr', './node_modules/monaco-editor-wrapper/dist/workers/editorWorker-es.js', './public/monaco-editor-wrapper/dist/workers/editorWorker-es.js');
