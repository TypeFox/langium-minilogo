import fs from 'fs';
import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import path from 'path';
import { isPen, isMove, isLit, isMacro, isGroup, Stmt, Model, Expr, isRef, isBinExpr, isFor, isNegExpr } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

// Map binds final values to names for references to function
type MiniLogoGenEnv = Map<string,number>;

// Represents the current drawing state
type DrawingState = {
    // point
    px:     number,
    py:     number,
    // whether then pen is touching the canvas or not
    drawing: boolean
};

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePathJS = path.join(data.destination, 'mini-logo.js');
    const generatedFilePathHTML = `${path.join(data.destination, data.name)}.html`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }

    fs.writeFileSync(generatedFilePathHTML, fs.readFileSync('./src/assets/index.html'));

    // write a JS file that draws on the HTML canvas from
    // we'll start a `run_minilogo` function, and then generate our 
    // minilogo program into equivalent draw instructions for the canvas
    const fileNodeJS = new CompositeGeneratorNode();
    fileNodeJS.append(
        '"use strict";', NL, NL,
        "function run_minilogo() {", NL
    );

    fileNodeJS.indent(i => {
        i.append(
            "let canvas = document.getElementById('minilogo-canvas');", NL,
            "let context = canvas.getContext('2d');", NL,
            "let mode = 'down';", NL,
            "context.strokeStyle = 'white';", NL,
            "context.moveTo(150,150);", NL,
            "context.beginPath();", NL
        );
    });

    // setup drawing state
    let state : DrawingState = {
        px: 0,
        py: 0,
        drawing: false
    };

    // minilogo evaluation env
    let env : MiniLogoGenEnv = new Map<string,number>();

    // write the mini logo function using the commands we produced, and write them out
    let computedJS = model.stmts.flatMap(s => evalStmt(s,env,state));
    if(computedJS !== undefined) {
        fileNodeJS.indent(i => {
            // good to go
            computedJS.forEach(line => {
                if (line) {
                    i.append(line, ';', NL);
                }
            });
        });
        
    } else {
        // failed to generate JS
        throw new Error("Failed to generate MiniLogo program to JS draw instructions!");

    }

    // check to cap off the previous path, if still active
    if(state.drawing) {
        fileNodeJS.append("\tcontext.stroke()");
    }

    // cap off our JS
    fileNodeJS.append(
        "}", NL,
        "window.onload = run_minilogo()", NL, NL
    );

    fs.writeFileSync(generatedFilePathJS, processGeneratorNode(fileNodeJS));

    return generatedFilePathHTML;
}

// effectful & recursive statement evaluation
// Takes an env, a drawing state, and the active file node we're appending to
function evalStmt(stmt: Stmt, env: MiniLogoGenEnv, state: DrawingState) : (string | undefined)[] {
    if(isPen(stmt)) {
        // pen change
        if(stmt.mode === 'up') {
            // lift pen up & complete existing path
            state.drawing = false;
            return ["context.stroke()"];

        } else {
            // push pen down & start new path, moving to the current point as well
            state.drawing = true;
            return [`context.beginPath()`, `context.moveTo(${state.px},${state.py})`];

        }

    } else if(isMove(stmt)) {
        // update pen position
        state.px += evalExprWithEnv(stmt.ex, env);
        state.py += evalExprWithEnv(stmt.ey, env);

        if(state.drawing) {
            // draw a line
            return [`context.lineTo(${state.px},${state.py})`];
        } else {
            // or update the pen's position
            return [`context.moveTo(${state.px},${state.py})`];
        }

    } else if(isMacro(stmt)) {
        // get the cross ref & validate it
        let macro = stmt.def.ref;
        if(macro === undefined) {
            throw new Error(`Attempted to reference an undefined macro: ${stmt.def}`);
        }

        // original env to restore post evaluation
        let macroEnv = new Map(env);

        // produce pairs of string & exprs, using a tmp env
        // this is important to avoid mixing of params that are only present in the tmp env w/ our actual env
        let tmpEnv = new Map<string, number>();

        macro.params.map((elm, idx) => tmpEnv.set(elm.name, evalExprWithEnv(stmt.args[idx], macroEnv)));
        tmpEnv.forEach((v,k) => macroEnv.set(k,v));

        return macro.body.flatMap(s => evalStmt(s, macroEnv, state));

    } else if(isFor(stmt)) {
        // for loop bounds
        let vi = evalExprWithEnv(stmt.e1, env);
        let ve = evalExprWithEnv(stmt.e2, env);

        let computedJS : (string | undefined)[] = [];
        
        // perform loop
        const loopEnv = new Map(env);
        while(vi < ve) {
            loopEnv.set(stmt.var.name, vi++);
            stmt.body.forEach(s => {
                computedJS = computedJS.concat(evalStmt(s, new Map(loopEnv), state));
            });
        }

        return computedJS;

    } else {
        return [];
    }
}

// Evaluates exprs to final vals for emission
function evalExprWithEnv(e: Expr, env: MiniLogoGenEnv): number {
    if(isLit(e)) {
        return e.val;

    } else if(isRef(e)) {
        const v = env.get(e.val.ref?.name ?? '');
        if (v !== undefined) {
            return v;
        }
        throw new Error(`Attempted to lookup an unbound reference '${e.val}' in the env.`);

    } else if(isBinExpr(e)) {
        let opval = e.op.val;
        let v1    = evalExprWithEnv(e.e1, env);
        let v2    = evalExprWithEnv(e.e2, env);

        switch(opval) {
            case 'add': return v1 + v2;
            case 'sub': return v1 - v2;
            case 'mul': return v1 * v2;
            case 'div': return v1 / v2;
            default:    throw new Error(`Unrecognized bin op passed: ${opval}`);
        }
        
    } else if (isNegExpr(e)) {
        return -1 * evalExprWithEnv(e.ne, env);

    } else if(isGroup(e)) {
        return evalExprWithEnv(e.ge, env);

    }

    throw new Error('Unhandled Expression');

}
