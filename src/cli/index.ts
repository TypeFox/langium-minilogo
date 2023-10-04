import { Command } from 'commander';
import { Model } from '../language-server/generated/ast.js';
import { MiniLogoLanguageMetaData } from '../language-server/generated/module.js';
import { NodeFileSystem } from 'langium/node';
import { createMiniLogoServices } from '../language-server/minilogo-module.js';
import { extractAstNode } from './cli-util.js';
import { generateMiniLogoCmds } from '../generator/generator.js';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const generateAst = async (fileName: string): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    // serialize & output the model ast
    const serializedAst = services.serializer.JsonSerializer.serialize(model, { sourceText: true, textRegions: true });
    console.log(serializedAst);
};

export const generateCmds = async (fileName: string): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    // directly output these commands to the console
    console.log(JSON.stringify(generateMiniLogoCmds(model)));
};

export default async function(): Promise<void> {
    const program = new Command();

    // dynamically import & get the version from package.json
    const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf-8');
    const version = JSON.parse(packageContent).version;
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
