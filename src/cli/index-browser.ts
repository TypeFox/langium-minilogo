import { Model } from '../language-server/generated/ast';
import { createMiniLogoServices } from '../language-server/minilogo-module';
import { generateJavaScript } from './generator';
import { AstNode, EmptyFileSystem, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

export async function parseAndGenerate (contents: string): Promise<string> {
    const services = createMiniLogoServices(EmptyFileSystem).MiniLogo;
    const model = await extractAstNodeFromString<Model>(contents, services);
    return Promise.resolve(generateJavaScript(model));
}

async function extractAstNodeFromString<T extends AstNode>(content: string, services: LangiumServices): Promise<T> {
    const doc = services.shared.workspace.LangiumDocumentFactory.fromString(content, URI.parse('memory://minilogo.document'));
    await services.shared.workspace.DocumentBuilder.build([doc], { validationChecks: 'all' });
    if (doc.parseResult.lexerErrors.length > 0) {
        throw new Error('Lexer Errors Encountered');
    } else if (doc.parseResult.parserErrors.length > 0) {
        throw new Error('Parser Errors Encountered');
    } else if ((doc.diagnostics ?? []).length > 0) {
        throw new Error('Diagnostic issues present!');
    }
    return doc.parseResult?.value as T;
}