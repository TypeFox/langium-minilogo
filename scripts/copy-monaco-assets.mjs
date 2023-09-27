import shell from 'shelljs'

// copy wrapper & workers to public
shell.cp('-fr', './node_modules/monaco-editor-wrapper/bundle', './public/monaco-editor-wrapper');
shell.cp('-fr', './node_modules/monaco-editor-workers/dist/', './public/monaco-editor-workers');