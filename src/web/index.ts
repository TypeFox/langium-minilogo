import { Model } from '../language-server/generated/ast';
import { createMiniLogoServices } from '../language-server/minilogo-module';
import { generateJavaScript } from '../generator/generator';
import { AstNode, EmptyFileSystem, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

/**
 * Parses a MiniLogo program & generates Javascript code as a string
 * @param miniLogoProgram MiniLogo program to parse
 * @returns Generated Javascript code from this MiniLogo program
 */
export async function parseAndGenerate (miniLogoProgram: string): Promise<string> {
    const services = createMiniLogoServices(EmptyFileSystem).MiniLogo;
    const model = await extractAstNodeFromString<Model>(miniLogoProgram, services);
    return Promise.resolve(generateJavaScript(model));
}

/**
 * Extracts an AST node from a virtual document, represented as a string
 * @param content Content to create virtual document from
 * @param services For constructing & building a virtual document
 * @returns A promise for the parsed result of the document
 */
async function extractAstNodeFromString<T extends AstNode>(content: string, services: LangiumServices): Promise<T> {
    const doc = services.shared.workspace.LangiumDocumentFactory.fromString(content, URI.parse('memory://minilogo.document'));
    await services.shared.workspace.DocumentBuilder.build([doc], { validationChecks: 'all' });
    return doc.parseResult?.value as T;
}