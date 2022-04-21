import { startLanguageServer } from 'langium';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { createMiniLogoServices } from './minilogo-module';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared } = createMiniLogoServices({ connection });

// Start the language server with the shared services
startLanguageServer(shared);
