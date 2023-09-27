import shell from 'shelljs'

// copy workers to public
shell.cp('-fr', './node_modules/monaco-editor-workers/dist/', './public/monaco-editor-workers');
