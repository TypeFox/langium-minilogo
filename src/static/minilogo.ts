import { EditorApp, type EditorAppConfig } from 'monaco-languageclient/editorApp';
import { type LanguageClientConfig, LanguageClientWrapper } from 'monaco-languageclient/lcwrapper';
import { type MonacoVscodeApiConfig, MonacoVscodeApiWrapper } from 'monaco-languageclient/vscodeApiWrapper';
import { configureDefaultWorkerFactory } from 'monaco-languageclient/workerFactory';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser';

const languageConfig = `{
    "comments": {
        // symbol used for single line comment. Remove this entry if your language does not support line comments
        "lineComment": "//",
        // symbols used for start and end a block comment. Remove this entry if your language does not support block comments
        "blockComment": [ "/*", "*/" ]
    },
    // symbols used as brackets
    "brackets": [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"]
    ],
    // symbols that are auto closed when typing
    "autoClosingPairs": [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
        ["\\"", "\\""],
        ["'", "'"]
    ],
    // symbols that can be used to surround a selection
    "surroundingPairs": [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
        ["\\"", "\\""],
        ["'", "'"]
    ]
}`;

// custom textmate grammar for minilogo
const textmateGrammar = `
{
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "name": "MiniLogo",
  "scopeName": "source.minilogo",
  "fileTypes": [".logo"],
  "patterns": [
    { "include": "#comments" },
    { "include": "#definition" },
    { "include": "#for-loop" },
    { "include": "#builtin-call" },
    { "include": "#macro-call" },
    { "include": "#hex-color" },
    { "include": "#numbers" },
    { "include": "#operators" },
    { "include": "#punctuation" }
  ],
  "repository": {
    "comments": {
      "patterns": [
        {
          "name": "comment.block.minilogo",
          "begin": "/\\*",
          "beginCaptures": {
            "0": { "name": "punctuation.definition.comment.begin.minilogo" }
          },
          "end": "\\*/",
          "endCaptures": {
            "0": { "name": "punctuation.definition.comment.end.minilogo" }
          }
        },
        {
          "name": "comment.line.double-slash.minilogo",
          "begin": "//",
          "beginCaptures": {
            "0": { "name": "punctuation.definition.comment.minilogo" }
          },
          "end": "$"
        }
      ]
    },

    "definition": {
      "comment": "Function definition: def name(param1, param2) { ... }",
      "begin": "\\b(def)\\s+([_a-zA-Z]\\w*)",
      "beginCaptures": {
        "1": { "name": "keyword.control.def.minilogo" },
        "2": { "name": "entity.name.function.minilogo" }
      },
      "end": "(?<=\\})",
      "patterns": [
        { "include": "#parameter-list" },
        { "include": "#block" }
      ]
    },

    "parameter-list": {
      "comment": "Parameter list in a def declaration",
      "begin": "\\(",
      "beginCaptures": {
        "0": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        { "include": "#comments" },
        {
          "name": "variable.parameter.minilogo",
          "match": "\\b[_a-zA-Z]\\w*\\b"
        },
        {
          "name": "punctuation.separator.comma.minilogo",
          "match": ","
        }
      ]
    },

    "block": {
      "comment": "Block body: { ... }",
      "begin": "\\{",
      "beginCaptures": {
        "0": { "name": "punctuation.brace.open.minilogo" }
      },
      "end": "\\}",
      "endCaptures": {
        "0": { "name": "punctuation.brace.close.minilogo" }
      },
      "patterns": [
        { "include": "#comments" },
        { "include": "#for-loop" },
        { "include": "#builtin-call" },
        { "include": "#macro-call" },
        { "include": "#hex-color" },
        { "include": "#numbers" },
        { "include": "#operators" },
        { "include": "#punctuation" }
      ]
    },

    "for-loop": {
      "comment": "for var = expr to expr { ... }",
      "begin": "\\b(for)\\s+([_a-zA-Z]\\w*)\\s*(=)",
      "beginCaptures": {
        "1": { "name": "keyword.control.for.minilogo" },
        "2": { "name": "variable.other.loop.minilogo" },
        "3": { "name": "keyword.operator.assignment.minilogo" }
      },
      "end": "(?=\\{)",
      "patterns": [
        {
          "name": "keyword.control.to.minilogo",
          "match": "\\bto\\b"
        },
        { "include": "#expression" }
      ]
    },

    "builtin-call": {
      "comment": "Built-in commands: pen(), move(), color()",
      "patterns": [
        { "include": "#pen-call" },
        { "include": "#move-call" },
        { "include": "#color-call" }
      ]
    },

    "pen-call": {
      "comment": "pen(up) or pen(down)",
      "begin": "\\b(pen)\\s*(\\()",
      "beginCaptures": {
        "1": { "name": "support.function.builtin.minilogo" },
        "2": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        {
          "name": "constant.language.pen-mode.minilogo",
          "match": "\\b(up|down)\\b"
        }
      ]
    },

    "move-call": {
      "comment": "move(expr, expr)",
      "begin": "\\b(move)\\s*(\\()",
      "beginCaptures": {
        "1": { "name": "support.function.builtin.minilogo" },
        "2": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        { "include": "#expression" },
        { "include": "#punctuation" }
      ]
    },

    "color-call": {
      "comment": "color(r, g, b) or color(#hex) or color(name)",
      "begin": "\\b(color)\\s*(\\()",
      "beginCaptures": {
        "1": { "name": "support.function.builtin.minilogo" },
        "2": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        { "include": "#hex-color" },
        {
          "comment": "Named color identifier inside color()",
          "name": "support.constant.color-name.minilogo",
          "match": "\\b(?!\\d)[_a-zA-Z]\\w*\\b"
        },
        { "include": "#expression" },
        { "include": "#punctuation" }
      ]
    },

    "macro-call": {
      "comment": "User-defined macro call: name(args...)",
      "begin": "\\b([_a-zA-Z]\\w*)\\s*(\\()",
      "beginCaptures": {
        "1": { "name": "entity.name.function.call.minilogo" },
        "2": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        { "include": "#expression" },
        { "include": "#punctuation" }
      ]
    },

    "expression": {
      "comment": "Expressions: numbers, references, operators, nested groups",
      "patterns": [
        { "include": "#comments" },
        { "include": "#hex-color" },
        { "include": "#numbers" },
        { "include": "#operators" },
        { "include": "#group" },
        {
          "comment": "Variable/parameter reference in an expression",
          "name": "variable.other.minilogo",
          "match": "\\b[_a-zA-Z]\\w*\\b"
        }
      ]
    },

    "group": {
      "comment": "Parenthesized sub-expression",
      "begin": "\\(",
      "beginCaptures": {
        "0": { "name": "punctuation.parenthesis.open.minilogo" }
      },
      "end": "\\)",
      "endCaptures": {
        "0": { "name": "punctuation.parenthesis.close.minilogo" }
      },
      "patterns": [
        { "include": "#expression" },
        { "include": "#punctuation" }
      ]
    },

    "hex-color": {
      "name": "constant.other.color.hex.minilogo",
      "match": "#[0-9a-fA-F]{3,6}\\b"
    },

    "numbers": {
      "patterns": [
        {
          "comment": "Decimal number: .5 or 3.14 or -2.7",
          "name": "constant.numeric.decimal.minilogo",
          "match": "-?(?:[0-9]+)?\\.[0-9]+"
        },
        {
          "comment": "Integer: 42 or -7",
          "name": "constant.numeric.integer.minilogo",
          "match": "-?[0-9]+"
        }
      ]
    },

    "operators": {
      "patterns": [
        {
          "name": "keyword.operator.arithmetic.minilogo",
          "match": "[+\\-*/]"
        },
        {
          "name": "keyword.operator.assignment.minilogo",
          "match": "="
        }
      ]
    },

    "punctuation": {
      "patterns": [
        {
          "name": "punctuation.separator.comma.minilogo",
          "match": ","
        },
        {
          "name": "punctuation.parenthesis.open.minilogo",
          "match": "\\("
        },
        {
          "name": "punctuation.parenthesis.close.minilogo",
          "match": "\\)"
        },
        {
          "name": "punctuation.brace.open.minilogo",
          "match": "\\{"
        },
        {
          "name": "punctuation.brace.close.minilogo",
          "match": "\\}"
        }
      ]
    }
  }
}
`;

/**
 * Pen command (up or down)
 */
type MiniLogoPen = {
    name: 'penUp' | 'penDown';
};

/**
 * Move command
 */
type MiniLogoMove = {
    name: 'move';
    args: {
        x: number;
        y: number;
    };
};

type HexOrLitColor =
    | {
          color: string;
      }
    | {
          r: number;
          g: number;
          b: number;
      };

/**
 * Color command
 */
type MiniLogoColor = {
    name: 'color';
    args: HexOrLitColor;
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
        // new URL('../language-server/main-browser.ts', import.meta.url),
        new URL('../../out/language-server/main-browser-min.js', import.meta.url),
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
        extensions: [
            {
                config: {
                    name: 'minilogo-language',
                    publisher: 'TypeFox',
                    version: '1.0.0',
                    engines: { vscode: '*' },
                    contributes: {
                        languages: [
                            {
                                id: languageId,
                                extensions: ['.logo'],
                                aliases: ['MiniLogo', 'minilogo'],
                                configuration: '/minilogo-configuration.json'
                            }
                        ],
                        grammars: [
                            {
                                language: languageId,
                                scopeName: 'source.minilogo',
                                path: '/minilogo-grammar.json'
                            }
                        ]
                    }
                },
                filesOrContents: extensionFilesOrContents
            }
        ]
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
                uri: '/workspace/example.logo'
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
        const canvas: HTMLCanvasElement | null = document.getElementById('minilogo-canvas') as HTMLCanvasElement | null;
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
        for (let x = 0; x <= canvas.width; x += canvas.width / 10) {
            context.moveTo(x, 0);
            context.lineTo(x, canvas.height);
        }
        for (let y = 0; y <= canvas.height; y += canvas.height / 10) {
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
                            context.strokeStyle = (cmd.args as { color: string }).color;
                        } else {
                            // literal r,g,b components
                            const args = cmd.args as { r: number; g: number; b: number };
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
