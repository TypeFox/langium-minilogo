# CHANGELOG

# 2.0.0

- Moved to ESM
- Updated to TypeScript 5.2.2
- Updated to Langium 2.0.0
- Updated monaco-editor-wrapper to the latest version (3.1.0), and the built-in example accordingly
- Updated the built-in web-app to use the latest wrapper & langium versions, plus some freshening up
- Reworked the CLI to directly output either an AST or generated drawing commands as JSON, more closely matching the language server's output on document validation
- Reworked the old generate:test script (and dropped generate:logo) to just output the CLI's generated drawing commands to the console
- Changed the package.json to use explicit exports, for ESM compatibility
- renamed cli.js to minilogo.js

# 1.2.0

- Bumped to Langium version 1.2.0
- Updated associated packages to support usage of the new [langium-minilogo npm package](https://www.npmjs.com/package/langium-minilogo)
- Setup a document listener in the language server, allowing the client to register for & receive Minilogo commands from validated documents

# 1.0.0

- Initial release