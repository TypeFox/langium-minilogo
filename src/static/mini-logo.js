"use strict";

/**
 * Base implementation of mini-logo for the browser
 */

let MINI_LOGO_COMMANDS = [];

const PEN_DOWN = 'down';
const PEN_UP = 'up';

const MiniLogoState = {
    x: 0,
    y: 0,
    penMode: PEN_DOWN
}

let savedState = undefined;

/**
 * Updates the minilogo canvas
 */
function updateMiniLogoCanvas(commands) {
    const canvas = document.getElementById('minilogo-canvas');

    if (commands) {
        // set new mini logo command stack
        MINI_LOGO_COMMANDS = commands;
    }

    if (!canvas) {
        throw new Error('Could not get a reference to the minilogo-canvas');
    }

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Could not get a reference to the 2D context');
    }

    if (savedState === undefined) {
        context.save();
        savedState = 1;
    } else {
        context.restore();
    }

    // set state
    MiniLogoState.x = 0;
    MiniLogoState.y = 0;
    MiniLogoState.penMode = PEN_DOWN;
    context.clearRect(0, 0, canvas.width, canvas.height);

    // draw a basic grid behind stuff...
    drawGrid(context, canvas);

    context.strokeStyle = 'white';

    // use the command stack to execute each commmand with a small delay
    const id = setInterval(() => {

        if (MINI_LOGO_COMMANDS.length > 0) {
            dispatchCommand(MINI_LOGO_COMMANDS.shift(), context);
        } else {
            if (MiniLogoState.penMode == PEN_DOWN) {
                // finish existing draw
                context.stroke();
            }
            clearInterval(id);
        }
    }, 1);
}

/**
 * Draws background grid
 */
function drawGrid(context, canvas) {
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
}

function dispatchCommand(cmd, context) {
    if (cmd.cmd) {
        switch (cmd.cmd) {
            case 'penUp':
                MiniLogoState.penMode = PEN_UP;
                context.stroke();
                break;

            case 'penDown':
                MiniLogoState.penMode = PEN_DOWN;
                context.beginPath();
                context.moveTo(MiniLogoState.x, MiniLogoState.y);
                break;

            case 'move':
                const x = cmd.x;
                const y = cmd.y;
                MiniLogoState.x += x;
                MiniLogoState.y += y;
                if (MiniLogoState.penMode == PEN_UP) {
                    // move no draw
                    context.moveTo(MiniLogoState.x, MiniLogoState.y);
                } else {
                    // move & draw
                    context.lineTo(MiniLogoState.x, MiniLogoState.y);
                }
                break;

            case 'color':
                if (cmd.color) {
                    context.strokeStyle = cmd.color;
                } else {
                    context.strokeStyle = `rgb(${cmd.r},${cmd.g},${cmd.b})`;
                }
                break;

            default:
                throw new Error("Unrecognized command encountered: " + cmd.cmd);

        }
    } else {
        throw new Error("Command is not defined!");
    }
}

window.onload = updateMiniLogoCanvas();