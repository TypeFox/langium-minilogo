import { MonacoEditorLanguageClientWrapper, vscode } from './monaco-editor-wrapper/index.js';
import { buildWorkerDefinition } from "./monaco-editor-workers/index.js";

buildWorkerDefinition('./monaco-editor-workers/workers', new URL('', window.location.href).href, false);

MonacoEditorLanguageClientWrapper.addMonacoStyles('monaco-editor-styles');

const client = new MonacoEditorLanguageClientWrapper('42');
const editorConfig = client.getEditorConfig();
editorConfig.setMainLanguageId('minilogo');

editorConfig.setMonarchTokensProvider({
    keywords: [
        'color','def','down','for','move','pen','to','up'
    ],
    operators: [
        '-',',','*','/','+','='
    ],
    symbols:  /-|,|\(|\)|\{|\}|\*|\/|\+|=/,

    tokenizer: {
        initial: [
            { regex: /#(\d|[a-fA-F]){3,6}/, action: {"token":"string"} },
            { regex: /[_a-zA-Z][\w_]*/, action: { cases: { '@keywords': {"token":"keyword"}, '@default': {"token":"string"} }} },
            { regex: /(?:(?:-?[0-9]+)?\.[0-9]+)|-?[0-9]+/, action: {"token":"number"} },
            { include: '@whitespace' },
            { regex: /@symbols/, action: { cases: { '@operators': {"token":"operator"}, '@default': {"token":""} }} },
        ],
        whitespace: [
            { regex: /\s+/, action: {"token":"white"} },
            { regex: /\/\*/, action: {"token":"comment","next":"@comment"} },
            { regex: /\/\/[^\n\r]*/, action: {"token":"comment"} },
        ],
        comment: [
            { regex: /[^\/\*]+/, action: {"token":"comment"} },
            { regex: /\*\//, action: {"token":"comment","next":"@pop"} },
            { regex: /[\/\*]/, action: {"token":"comment"} },
        ],
    }
});

editorConfig.theme = 'vs-dark';
editorConfig.useLanguageClient = true;
editorConfig.useWebSocket = false;

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

editorConfig.setMainCode(mainCode);

const workerURL = new URL('./minilogo-server-worker.js', import.meta.url);

const lsWorker = new Worker(workerURL.href, {
    type: 'classic',
    name: 'MiniLogoLS'
});
client.setWorker(lsWorker);

// keep a reference to a promise for when the editor is finished starting, we'll use this to setup the canvas on load
const startingPromise = client.startEditor(document.getElementById("monaco-editor-root"));

// Set a status message to display below the update button
function setStatus(msg) {
    document.getElementById('status-msg').innerHTML = msg;
}

let running = false;
const generateAndDisplay = (() => {
    if (running) {
        return;
    }
    running = true;
    setStatus('');
    console.info('generating & running current code...');
    const value = client.editor.getValue();
    if (window.localStorage) {
        window.localStorage.setItem('mainCode', value);
    }
    // execute custom command, and receive the response
    vscode.commands.executeCommand('parseAndGenerate', value).then((minilogoCmds) => {
        return updateMiniLogoCanvas(minilogoCmds);
    }).catch((e) => {
        setStatus(e);
    }).finally(() => {
        console.info('done...');
        running = false;
    });
});

// Updates the mini-logo canvas
window.generateAndDisplay = generateAndDisplay;

// Takes generated MiniLogo commands, and draws on an HTML5 canvas
function updateMiniLogoCanvas(cmds) {
    const canvas = document.getElementById('minilogo-canvas');
    const context = canvas.getContext('2d');

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
                dispatchCommand(cmds.shift(), context);
            } else {
                // finish existing draw
                if (drawing) {
                    context.stroke();
                }
                clearInterval(id);
                resolve();
            }
        }, 1);
    });

    // dispatches a single command in the current context
    function dispatchCommand(cmd, context) {
        if (cmd.cmd) {
            switch (cmd.cmd) {
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
                    const x = cmd.x;
                    const y = cmd.y;
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
                    if (cmd.color) {
                        // literal color or hex
                        context.strokeStyle = cmd.color;
                    } else {
                        // literal r,g,b components
                        context.strokeStyle = `rgb(${cmd.r},${cmd.g},${cmd.b})`;
                    }
                    break;

            }
        }
    }
    return doneDrawingPromise;
}

startingPromise.then(() => {
    generateAndDisplay();
});
