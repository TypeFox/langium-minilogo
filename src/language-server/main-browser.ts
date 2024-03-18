/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { EmptyFileSystem, DocumentState } from 'langium';
import { BrowserMessageReader, BrowserMessageWriter, Diagnostic, NotificationType, createConnection } from 'vscode-languageserver/browser.js';
import { createMiniLogoServices } from './minilogo-module.js';
import { Model } from './generated/ast.js';
import { Command, getCommands } from './minilogo-actions.js';
import { generateMiniLogoCmds } from '../generator/generator.js';
import { startLanguageServer } from 'langium/lsp';

declare const self: DedicatedWorkerGlobalScope;

/* browser specific setup code */
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

// Inject the shared services and language-specific services
const { shared, MiniLogo } = createMiniLogoServices({connection, ...EmptyFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);

// Send a notification with the serialized AST after every document change
type DocumentChange = { uri: string, content: string, diagnostics: Diagnostic[] };
const documentChangeNotification = new NotificationType<DocumentChange>('browser/DocumentChange');
const jsonSerializer = MiniLogo.serializer.JsonSerializer;
shared.workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, documents => {
    for (const document of documents) {
        const module = document.parseResult.value as Model;
        let json: Command[] = [];
        
        if(document.diagnostics === undefined  || document.diagnostics.filter((i) => i.severity === 1).length === 0) {
            json = getCommands(generateMiniLogoCmds(module));
        }
        
        (module as unknown as {$commands: Command[]}).$commands = json;
        connection.sendNotification(documentChangeNotification, {
            uri: document.uri.toString(),
            content: jsonSerializer.serialize(module, { sourceText: true, textRegions: true }),
            diagnostics: document.diagnostics ?? []
        });
    }
});
