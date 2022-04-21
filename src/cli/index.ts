import colors from 'colors';
import { Command } from 'commander';
import { Model } from '../language-server/generated/ast';
import { MiniLogoLanguageMetaData } from '../language-server/generated/module';
import { createMiniLogoServices } from '../language-server/minilogo-module';
import { extractAstNode } from './cli-util';
import { generateJavaScript } from './generator';

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createMiniLogoServices().MiniLogo;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateJavaScript(model, fileName, opts.destination);
    console.log(colors.green(`HTML/Javascript code generated successfully: ${generatedFilePath}`));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        .version(require('../../package.json').version);

    const fileExtensions = MiniLogoLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .option('-d, --destination <dir>', 'destination directory of generating')
        .description('generates an HTML page with JavaScript code that draws on a canvas')
        .action(generateAction);

    program.parse(process.argv);
}
