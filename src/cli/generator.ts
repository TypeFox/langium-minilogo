import fs from 'fs';
import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import path from 'path';
import { isPen, isMove, isLit, isMacro, isGroup, Stmt, Def, Model, Expr, isRef, isBinExpr, isFor, isNegExpr } from '../language-server/generated/ast';
import { extractDestinationAndName } from './cli-util';

type MiniLogoGenEnv = Map<string,number>;

export function generateJavaScript(model: Model, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePathJS = `${path.join(data.destination, data.name)}.js`;
    const generatedFilePathHTML = `${path.join(data.destination, data.name)}.html`;

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

    let drawing = false;
    let px = 0;
    let py = 0;
    // minilogo evaluation env
    let miniEnv : MiniLogoGenEnv = new Map<string,number>();

    // map of funcs w/ their names
    // TODO this should be computed with cross refs instead !
    let defs = new Map<string, Def>();
    model.defs.map((d) => defs.set(d.name, d));

    // effectful & recursive statement evaluation
    function evalStmt(stmt: Stmt) : void {
        if(isPen(stmt)) {
            // pen change
            if(stmt.mode == 'up') {
                // lift pen up & complete existing path
                drawing = false;
                fileNodeJS.append("\tcontext.stroke();\n");

            } else {
                // push pen down & start new path
                drawing = true;
                fileNodeJS.append("\tcontext.beginPath();\n");

            }

        } else if(isMove(stmt)) {
            // update pen position
            px += evalExprWithEnv(stmt.ex, miniEnv);
            py += evalExprWithEnv(stmt.ey, miniEnv);

            if(drawing) {
                // draw a line
                fileNodeJS.append(`\tcontext.lineTo(${px},${py});\n`);

            } else {
                // then update position
                fileNodeJS.append(`\tcontext.moveTo(${px},${py});\n`);

            }

        } else if(isMacro(stmt)) {
            // lookup a macro to call
            let macro = defs.get(stmt.name);
            // TODO line below causes the language server to crash out, probably need to look into this some more at another point.
            // although it would be ideal to use, given the cross-ref is pre-computed & more efficient than rebuilding a map here
            //let macro = stmt.name.ref;

            if(!macro) {
                throw new Error(`Attempted to reference an undefined macro ${stmt.name}`);
            }

            let origMiniEnv = new Map(miniEnv);

            // produce pairs of string & exprs, using a tmp env
            let tmpEnv = new Map();
            macro.params.map((elm, idx) => tmpEnv.set(elm, evalExprWithEnv(stmt.args[idx], miniEnv)));
            // update miniEnv w/ temp env
            tmpEnv.forEach((v,k) => miniEnv.set(k,v));

            // evalute the body
            macro.b.body.forEach(evalStmt);

            // reset env
            miniEnv = origMiniEnv;

        } else if(isFor(stmt)) {
            // for loop bounds
            let vi = evalExprWithEnv(stmt.e1, miniEnv);
            let ve = evalExprWithEnv(stmt.e2, miniEnv);
    
            // clone binding to avoid clobbering any pre-existing binding
            //let origBind = miniEnv.get(stmt.var);
            let origEnv = new Map(miniEnv);
    
            // loop until we've performed all actions
            while(vi < ve) {
                miniEnv.set(stmt.var, vi);
                stmt.b.body.forEach(evalStmt);
                vi++;
            }
    
            // restore binding to prior state
            miniEnv = origEnv;
            //(origBind == undefined) ? miniEnv.delete(stmt.var) : miniEnv.set(stmt.var, origBind);
    
        }
    }

    // write the mini logo function using the commands we produced
    model.stmts.forEach(evalStmt);

    // check to cap off the previous path, if still active
    if(drawing) {
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

// Evaluates exprs to final vals for emission
function evalExprWithEnv(e: Expr, env: MiniLogoGenEnv): number | never {
    if(isLit(e)) {
        // literal value to use
        return e.val;

    } else if(isRef(e)) {
        // reference to try and find
        let v = env.get(e.val);
        if(v != undefined) {
            return v;
        } else {
            throw new Error(`Attempted to lookup an unbound reference '${e.val}' in the env!`);
        }

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
        throw new Error(`Unrecognized expression passed for evaluation: ${e}`);

    }

}
