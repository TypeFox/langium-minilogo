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
    const generatedFilePathJS = `${path.join(data.destination, data.name)}.js`;
    const generatedFilePathHTML = `${path.join(data.destination, data.name)}.html`;

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination);
    }

    // write out an HTML file for our canvas ops
    const fileNodeHTML = new CompositeGeneratorNode();
    // crude literal writing
    fileNodeHTML.append(
        "<!DOCTYPE html>\n",
        "<html>\n",
        "<head>\n",
        "<meta charset='utf-8'>",
        `<script src='${data.name}.js' async></script>`,
        "<title>MiniLogo to HTML Canvas via Langium</title>",
        "</head>\n",
        "<body>\n",
        "<h1 style='text-align:center'>MiniLogo -&gt; to HTML Canvas via Langium</h1>\n",
        "<canvas id='minilogo-canvas' width=500 height=600 style='display:block;margin:8px auto;text-align:center;border:2px solid #ccc'></canvas>\n",
        "</body>\n",
        "</html>");
    fs.writeFileSync(generatedFilePathHTML, processGeneratorNode(fileNodeHTML));

    // write a JS file that draws on the HTML canvas from
    // we'll start a `run_minilogo` function, and then compile our 
    // minilogo program into equivalent draw instructions for the canvas
    const fileNodeJS = new CompositeGeneratorNode();
    fileNodeJS.append(
        '"use strict";',
        NL, NL,
        "function run_minilogo() {\n", 
        "\tlet canvas = document.getElementById('minilogo-canvas');\n",
        // simple 2d context to draw with
        "\tlet context = canvas.getContext('2d');\n",
        // move off from the corner, so the cursor can be seen
        "\tcontext.moveTo(150,150);\n",
        // start a path
        "\tcontext.beginPath();\n",
        NL);

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
    if(computedJS != undefined) {
        // good to go
        computedJS.forEach(line => fileNodeJS.append(line + ";\n"));

    } else {
        // failed to compile to JS
        throw new Error("Failed to compile MiniLogo program to JS draw instructions!"); 

    }

    // check to cap off the previous path, if still active
    if(state.drawing) {
        fileNodeJS.append("\tcontext.stroke();");
    }

    // cap off our JS
    fileNodeJS.append(
        "}\n",
        "window.onload = run_minilogo();\n", NL);

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, { recursive: true });
    }
    fs.writeFileSync(generatedFilePathJS, processGeneratorNode(fileNodeJS));

    return generatedFilePathHTML;
}

// effectful & recursive statement evaluation
// Takes an env, a drawing state, and the active file node we're appending to
function evalStmt(stmt: Stmt, env: MiniLogoGenEnv, state: DrawingState) : (string | undefined)[] {
    if(isPen(stmt)) {
        // pen change
        if(stmt.mode == 'up') {
            // lift pen up & complete existing path
            state.drawing = false;
            return ["context.stroke()"];

        } else {
            // push pen down & start new path, moving to the current point as well
            state.drawing = true;
            return [`context.beginPath()`,`context.moveTo(${state.px},${state.py})`];

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
        if(macro == undefined) {
            throw new Error(`Attempted to reference an undefined macro: ${stmt.def}`);
        }

        // original env to restore post evaluation
        let origEnv = new Map<string,number>(env);

        // produce pairs of string & exprs, using a tmp env
        // this is important to avoid mixing of params that are only present in the tmp env w/ our actual env
        let tmpEnv = new Map<string, number>();

        macro.params.map((elm, idx) => tmpEnv.set(elm.name, evalExprWithEnv(stmt.args[idx], env)));

        // update miniEnv w/ temp env
        tmpEnv.forEach((v,k) => env.set(k,v));

        // evalute the body
        let computedJS = macro.body.flatMap(s => evalStmt(s, env, state));

        // reset env
        env = origEnv;

        return computedJS;

    } else if(isFor(stmt)) {
        // for loop bounds
        let vi = evalExprWithEnv(stmt.e1, env);
        let ve = evalExprWithEnv(stmt.e2, env);

        // clone binding to avoid clobbering any pre-existing binding
        let origEnv = new Map(env);

        let fvar = stmt.var.name;

        // loop until we've performed all actions
        let computedJS : (string | undefined)[] = [];
        while(vi < ve) {
            // update env
            env.set(fvar, vi);
            // manage effects from individual evaluations
            let rEnv = new Map(env);
            // evalute body, and capture results
            stmt.body.forEach(s => {
                // get results
                computedJS = computedJS.concat(evalStmt(s,env,state));
                // clear effects
                env = rEnv;
            });
            // step forward
            vi++;
        }

        // restore binding to prior state
        env = origEnv;

        return computedJS;

    } else {
        // unrecognized result...
        return [];

    }
}

// Evaluates exprs to final vals for emission
function evalExprWithEnv(e: Expr, env: MiniLogoGenEnv): number | never {
    if(isLit(e)) {
        // literal value to use
        return e.val;

    } else if(isRef(e)) {
        // reference to try and find
        let r = e.val.ref;
        if(r != undefined) {
            let v = env.get(r.name);
            if(v !== undefined) {
                return v;
            }
        }
        // shouldn't get to this point w/ cross refs working...
        throw new Error(`Attempted to lookup an unbound reference '${e.val}' in the env!`);

    } else if(isBinExpr(e)) {
        // binary expression to resolve
        let opval = e.op.val;

        // evaluate these exprs under the given env
        let v1 = evalExprWithEnv(e.e1, env);
        let v2 = evalExprWithEnv(e.e2, env);

        // based on our op val, perform the operate binop
        switch(opval) {
            case 'add': return v1 + v2;
            case 'sub': return v1 - v2;
            case 'mul': return v1 * v2;
            case 'div': return v1 / v2;
            default:  throw new Error(`Unrecognized bin op passed: ${opval}`);
        }
        
    } else if (isNegExpr(e)) {
        // return negated form
        return evalExprWithEnv(e.ne, env)*-1;

    } else if(isGroup(e)) {
        // recursively call to evaluate the wrapped expression
        return evalExprWithEnv(e.ge, env);

    } else {
        // unrecognized expression, but we shouldn't expect to get to this point
        // TODO would need better clarification on 'what' the expr was while printing out
        throw new Error(`Unrecognized expression passed for evaluation.`);

    }

}
