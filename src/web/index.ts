import { Model } from '../language-server/generated/ast.js';
import { createMiniLogoServices } from '../language-server/minilogo-module.js';
import { generateMiniLogoCmds } from '../generator/generator.js';
import { AstNode, EmptyFileSystem } from 'langium';
import { URI } from 'langium';
import { LangiumServices } from 'langium/lsp';

/**
 * Parses a MiniLogo program & generates output as a list of Objects
 * @param miniLogoProgram MiniLogo program to parse
 * @returns Generated output from this MiniLogo program
 */
export async function parseAndGenerate (miniLogoProgram: string): Promise<Object[]> {
    const services = createMiniLogoServices(EmptyFileSystem).MiniLogo;
    const model = await extractAstNodeFromString<Model>(miniLogoProgram, services);
    // generate mini logo drawing commands from the model
    const cmds = generateMiniLogoCmds(model);
    return Promise.resolve(cmds);
}

/**
 * Extracts an AST node from a virtual document, represented as a string
 * @param content Content to create virtual document from
 * @param services For constructing & building a virtual document
 * @returns A promise for the parsed result of the document
 */
async function extractAstNodeFromString<T extends AstNode>(content: string, services: LangiumServices): Promise<T> {
    const doc = services.shared.workspace.LangiumDocumentFactory.fromString(content, URI.parse('memory://minilogo.document'));
    await services.shared.workspace.DocumentBuilder.build([doc], { validation: true });
    return doc.parseResult?.value as T;
}