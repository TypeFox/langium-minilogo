/// <reference types="vite/client" />

// monaco-languageclient imports
import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { MonacoVscodeApiWrapper, type MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper';
import { LanguageClientWrapper, type LanguageClientConfig } from 'monaco-languageclient/lcwrapper';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser';

// load TextMate grammar and language configuration as raw strings (vite ?raw import)
import languageConfig from '../../language-configuration.json?raw';
import textmateGrammar from '../../syntaxes/minilogo.tmLanguage.json?raw';

/**
 * Pen command (up or down)
 */
type MiniLogoPen = {
    name: 'penUp' | 'penDown'
};

/**
 * Move command
 */
type MiniLogoMove = {
    name: 'move'
    args: {
        x: number;
        y: number;
    }
};

type HexOrLitColor = {
    color: string
} | {
    r: number
    g: number
    b: number
};

/**
 * Color command
 */
type MiniLogoColor = {
    name: 'color'
    args: HexOrLitColor
};

/**
 * MiniLogo commands
 */
type MiniLogoCommand = MiniLogoPen | MiniLogoMove | MiniLogoColor;

interface DocumentChangeResponse {
    content: string;
}

/**
 * Retrieves the program code to display, either a default or from local storage
 */
function getMainCode() {
    let mainCode = `
    def test() {
        move(100, 0)
        pen(down)
        move(100, 100)
        move(-100, 100)
        move(-100, -100)
        move(100, -100)
        pen(up)
    }
    color(white)
    test()

    `;

    // seek to restore any previous code from our last session
    if (window.localStorage) {
        const storedCode = window.localStorage.getItem('mainCode');
        if (storedCode !== null) {
            mainCode = storedCode;
        }
    }

    return mainCode;
}

/**
 * Creates & returns a fresh worker using the Minilogo language server
 */
function getWorker() {
    return new Worker(
        new URL('../language-server/main-browser.ts', import.meta.url),
        { type: 'module', name: 'MiniLogoLS' }
    );
}

/**
 * Set a status message to display below the update button
 * @param msg Status message to display
 */
function setStatus(msg: string) {
    const elm = document?.getElementById('status-msg');
    if (elm) {
        elm.innerHTML = msg;
    }
}

async function main() {
    const languageId = 'minilogo';

    // create the language server worker and message transports
    const worker = getWorker();
    const reader = new BrowserMessageReader(worker);
    const writer = new BrowserMessageWriter(worker);

    // register TextMate grammar and language config as a virtual extension
    const extensionFilesOrContents = new Map<string, string | URL>();
    extensionFilesOrContents.set('/minilogo-configuration.json', languageConfig);
    extensionFilesOrContents.set('/minilogo-grammar.json', textmateGrammar);

    // configure the VS Code API layer
    const vscodeApiConfig: MonacoVscodeApiConfig = {
        $type: 'extended',
        viewsConfig: {
            $type: 'EditorService',
            htmlContainer: document.getElementById('monaco-editor-root')!
        },
        monacoWorkerFactory: configureDefaultWorkerFactory,
        userConfiguration: {
            json: JSON.stringify({
                'workbench.colorTheme': 'Default Dark Modern',
                'editor.guides.bracketPairsHorizontal': 'active',
                'editor.wordBasedSuggestions': 'off',
                'editor.experimental.asyncTokenization': true
            })
        },
        extensions: [{
            config: {
                name: 'minilogo-language',
                publisher: 'TypeFox',
                version: '1.0.0',
                engines: { vscode: '*' },
                contributes: {
                    languages: [{
                        id: languageId,
                        extensions: ['.logo'],
                        aliases: ['MiniLogo', 'minilogo'],
                        configuration: '/minilogo-configuration.json'
                    }],
                    grammars: [{
                        language: languageId,
                        scopeName: 'source.minilogo',
                        path: '/minilogo-grammar.json'
                    }]
                }
            },
            filesOrContents: extensionFilesOrContents
        }]
    };

    // configure the language client connection
    const languageClientConfig: LanguageClientConfig = {
        languageId,
        clientOptions: {
            documentSelector: [languageId]
        },
        connection: {
            options: {
                $type: 'WorkerDirect',
                worker
            },
            messageTransports: { reader, writer }
        }
    };

    // configure the editor content
    const editorAppConfig: EditorAppConfig = {
        codeResources: {
            modified: {
                text: getMainCode(),
                uri: '/workspace/example.minilogo'
            }
        }
    };

    // start in order: API wrapper -> language client -> editor app
    const apiWrapper = new MonacoVscodeApiWrapper(vscodeApiConfig);
    await apiWrapper.start();

    const lcWrapper = new LanguageClientWrapper(languageClientConfig);
    await lcWrapper.start();

    const editorApp = new EditorApp(editorAppConfig);
    await editorApp.start(document.getElementById('monaco-editor-root')!);

    // get the language client for notification handling
    const client = lcWrapper.getLanguageClient();
    if (!client) {
        throw new Error('Unable to obtain language client for MiniLogo!');
    }

    let running = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    client.onNotification('browser/DocumentChange', (resp: DocumentChangeResponse) => {

        // always store the current program in local storage
        const models = editorApp.getTextModels();
        const value = models.modified?.getValue();
        if (window.localStorage && value) {
            window.localStorage.setItem('mainCode', value);
        }

        // block until we're finished with a given run
        if (running) {
            return;
        }

        // clear previous timeouts
        if (timeout) {
            clearTimeout(timeout);
        }

        // set a timeout to run the current code
        timeout = setTimeout(async () => {
            running = true;
            setStatus('');
            console.info('generating & running current code...');

            // decode & run commands
            let result = JSON.parse(resp.content);
            let commands = result.$commands;
            try {
                await updateMiniLogoCanvas(commands);
                running = false;
            } catch (e) {
                // failed at some point, log & disable running so we can try again
                console.error(e);
                running = false;
            }

        }, 200);
    });

    /**
     * Takes generated MiniLogo commands, and draws on an HTML5 canvas
     */
    function updateMiniLogoCanvas(cmds: MiniLogoCommand[]) {
        const canvas : HTMLCanvasElement | null = document.getElementById('minilogo-canvas') as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error('Unable to find canvas element!');
        }
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Unable to get canvas context!');
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.beginPath();
        context.strokeStyle = '#333';
        for (let x = 0; x <= canvas.width; x+=(canvas.width / 10)) {
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
        }
        for (let y = 0; y <= canvas.height; y+=(canvas.height / 10)) {
            context.moveTo(0, y);
            context.lineTo(canvas.width, y);
        }
        context.stroke();

        context.strokeStyle = 'white';

        // maintain some state about our drawing context
        let drawing = false;
        let posX = 0;
        let posY = 0;

        const doneDrawingPromise = new Promise((resolve) => {
            // use the command list to execute each command with a small delay
            const id = setInterval(() => {
                if (cmds.length > 0) {
                    dispatchCommand(cmds.shift() as MiniLogoCommand, context);
                } else {
                    // finish existing draw
                    if (drawing) {
                        context.stroke();
                    }
                    clearInterval(id);
                    resolve('');
                }
            }, 1);
        });

        // dispatches a single command in the current context
        function dispatchCommand(cmd: MiniLogoCommand, context: CanvasRenderingContext2D) {
            if (cmd.name) {
                switch (cmd.name) {
                    // pen is lifted off the canvas
                    case 'penUp':
                        drawing = false;
                        context.stroke();
                        break;

                    // pen is put down onto the canvas
                    case 'penDown':
                        drawing = true;
                        context.beginPath();
                        context.moveTo(posX, posY);
                        break;

                    // move across the canvas
                    // will draw only if the pen is 'down'
                    case 'move':
                        const x = cmd.args.x;
                        const y = cmd.args.y;
                        posX += x;
                        posY += y;
                        if (!drawing) {
                            // move, no draw
                            context.moveTo(posX, posY);
                        } else {
                            // move & draw
                            context.lineTo(posX, posY);
                        }
                        break;

                    // set the color of the stroke
                    case 'color':
                        if ((cmd.args as { color: string }).color) {
                            // literal color or hex
                            context.strokeStyle = (cmd.args  as { color: string }).color;
                        } else {
                            // literal r,g,b components
                            const args = cmd.args as { r: number, g: number, b: number };
                            context.strokeStyle = `rgb(${args.r},${args.g},${args.b})`;
                        }
                        break;

                    // fallback in case we missed an instruction
                    default:
                        throw new Error('Unrecognized command received: ' + JSON.stringify(cmd));

                }
            }
        }
        return doneDrawingPromise;
    }
}

main();
