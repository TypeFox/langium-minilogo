import { Command } from 'commander';
import { Model } from '../language-server/generated/ast.js';
import { MiniLogoLanguageMetaData } from '../language-server/generated/module.js';
import { NodeFileSystem } from 'langium/node';
import { createMiniLogoServices } from '../language-server/minilogo-module.js';
import { extractAstNode } from './cli-util.js';
import { generateMiniLogoCmds } from '../generator/generator.js';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    // directly output these commands to the console
    console.log(JSON.stringify(generateMiniLogoCmds(model)));
};

export type GenerateOptions = {}

export default async function(): Promise<void> {
    const program = new Command();

    // dynamically import & get the version from package.json
    const version = ((await import('../../package.json', { assert: { type: 'json' } })) as unknown as { version: string}).version;
    program.version(version);

    const fileExtensions = MiniLogoLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('Generates Minilogo drawing commands, suitable for consumption by a simple stack-based drawing machine')
        .action(generateAction);

    program.parse(process.argv);
}
