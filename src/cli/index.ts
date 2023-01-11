import colors from 'colors';
import fs from 'fs';
import { Command } from 'commander';
import { Model } from '../language-server/generated/ast';
import { MiniLogoLanguageMetaData } from '../language-server/generated/module';
import { NodeFileSystem } from 'langium/node';
import { createMiniLogoServices } from '../language-server/minilogo-module';
import { extractAstNode, extractDestinationAndName } from './cli-util';
import { generateMiniLogoCmds } from '../generator/generator';
import path from 'path';
import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMiniLogoServices(NodeFileSystem).MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedJS = getCmdStackString(model);

    const data = extractDestinationAndName(fileName, opts.destination);
    const dest = path.join(data.destination, data.name);
    const generatedFileJSPath = path.join(dest, 'mini-logo.js');
    const generatedFileHTMLPath = path.join(dest, 'index.html');

    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // read mini-logo, and add generated JS to it
    const fileContents = fs.readFileSync(fileName).toString('utf-8').replaceAll(/`/g, '\\`');
    const baseJsContent = fs.readFileSync('./src/static/setup.js');
    const programText = `\n\nconst LOGO_PROGRAM_TEXT = \`${fileContents}\`;`;

    fs.writeFileSync(generatedFileJSPath, baseJsContent + '\n\n' + generatedJS + '\n\n' + programText);
    fs.writeFileSync(generatedFileHTMLPath, fs.readFileSync('./src/static/index.html'));

    console.log(colors.green(`HTML/Javascript code generated successfully: ${generatedFileHTMLPath}`));
};

/**
 * Gets the command stack as a string
 * @param model Model to extract command stack from
 * @returns String to add to JS
 */
function getCmdStackString(model: Model): string {
    const generatedCmds = generateMiniLogoCmds(model);

    // build output JS so something draws to the canvas on load, quickly
    const fileNodeJS = new CompositeGeneratorNode();
    fileNodeJS.append(
        "// Generated MiniLogo Commands", NL,
        "MINI_LOGO_COMMANDS = [", NL
    );
    fileNodeJS.append();

    // add cmds
    if(generatedCmds !== undefined) {
        fileNodeJS.indent(i => {
            generatedCmds.forEach(cmd => {
                i.append(JSON.stringify(cmd), ',', NL);
            });
        });
    }

    // cap off
    fileNodeJS.append(
        "];", NL,
    );

    return processGeneratorNode(fileNodeJS);
}

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(require('../../package.json').version);

    const fileExtensions = MiniLogoLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates an HTML page with JavaScript code that draws on a canvas')
        .action(generateAction);

    program.parse(process.argv);
}
