import { Command } from 'commander';
import { Model } from '../language-server/generated/ast.js';
import { MiniLogoLanguageMetaData } from '../language-server/generated/module.js';
import { NodeFileSystem } from 'langium/node';
import { createMiniLogoServices } from '../language-server/minilogo-module.js';
import { extractAstNode } from './cli-util.js';
import { generateMiniLogoCmds } from '../generator/generator.js';

export const generateAst = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    // serialize & output the model ast
    const serializedAst = services.serializer.JsonSerializer.serialize(model, { sourceText: true, textRegions: true });
    console.log(serializedAst);
};

export const generateCmds = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    // directly output these commands to the console
    console.log(JSON.stringify(generateMiniLogoCmds(model)));
};

export type GenerateOptions = {}

export default async function(): Promise<void> {
    const program = new Command();

    // dynamically import & get the version from package.json
    // TODO 
    // const packageJson = await import('../../package.json', { assert: { type: 'json' } });
    const version = '2.0.0';
    // const version = (packageJson as unknown as { default: { version: string} }).default.version;
    program.version(version);

    const fileExtensions = MiniLogoLanguageMetaData.fileExtensions.join(', ');

    // generate an AST
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('Generates a MiniLogo AST in JSON format')
        .action(generateAst);

    // generate drawing commands
    program
        .command('generate-cmds')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('Generates Minilogo drawing commands, suitable for consumption by a simple stack-based drawing machine')
        .action(generateCmds);

    program.parse(process.argv);
}
