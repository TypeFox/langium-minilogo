import { CompositeGeneratorNode, NL, processGeneratorNode } from 'langium';
import { isPen, isMove, isLit, isMacro, isGroup, Stmt, Model, Expr, isRef, isBinExpr, isFor, isColor, isNegExpr, Def } from '../language-server/generated/ast';

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

/**
 * Generates raw javascript from a MiniLogo Model
 * @param model Model to generate JS from
 * @returns Generated JS that captures the program's intent
 */
export function generateJavaScript(model: Model): string {

    // Produce JS that draws on the HTML canvas
    // we'll start a `run_minilogo` function, and then generate our 
    // minilogo program into equivalent draw instructions for the canvas
    const fileNodeJS = generateStart();
    generateStatements(fileNodeJS, model.stmts);
    generateEnd(fileNodeJS);

    return processGeneratorNode(fileNodeJS);
}

function generateStart(): CompositeGeneratorNode {
    const fileNodeJS = new CompositeGeneratorNode();
    fileNodeJS.append(
        "// Generated MiniLogo Commands", NL,
        "MINI_LOGO_COMMANDS = [", NL
    );
    return fileNodeJS;
}

function generateStatements(fileNodeJS: CompositeGeneratorNode, stmts: Stmt[]) {
    // setup drawing state
    let state : DrawingState = {
        px: 0,
        py: 0,
        drawing: false
    };

    // minilogo evaluation env
    let env : MiniLogoGenEnv = new Map<string,number>();

    // write the mini logo function using the commands we produced, and write them out
    let computedJS = stmts.flatMap(s => evalStmt(s,env,state));
    if(computedJS !== undefined) {
        fileNodeJS.indent(i => {
            // good to go
            computedJS.forEach(line => {
                if (line) {
                    i.append(JSON.stringify(line), ',', NL);
                }
            });
        });
        
    } else {
        // failed to generate JS
        throw new Error("Failed to generate MiniLogo program to JS draw instructions!");

    }
}

function generateEnd(fileNodeJS: CompositeGeneratorNode) {
    // cap off our JS
    fileNodeJS.append(
        "];", NL,
    );
}

/**
 * Takes an env, a drawing state, and the active file node we're appending to
 * Effectful & recursive statement evaluation
 */
function evalStmt(stmt: Stmt, env: MiniLogoGenEnv, state: DrawingState) : (Object | undefined)[] {
    if(isPen(stmt)) {
        if(stmt.mode === 'up') {
            state.drawing = false;
            return [{
                cmd: 'penUp'
            }];
        } else {
            state.drawing = true;
            return [{
                cmd: 'penDown'
            }];
        }

    } else if(isMove(stmt)) {
        // update pen position
        let cmds: Object[] = [{
            cmd: 'move',
            x: evalExprWithEnv(stmt.ex, env),
            y: evalExprWithEnv(stmt.ey, env)
        }];

        if (state.drawing) {
            cmds.push({ cmd: 'penUp' });
            cmds.push({ cmd: 'penDown' });
        } else {
            cmds.push({ cmd: 'penDown' });
            cmds.push({ cmd: 'penUp' });
        }

        return cmds;

    } else if(isMacro(stmt)) {
        // get the cross ref & validate it
        let macro: Def | undefined = stmt.def.ref;
        if(macro === undefined) {
            throw new Error(stmt.def.error?.message ?? `Attempted to reference an undefined macro: ${stmt.def.$refText}`);
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

        let computedJS : (Object | undefined)[] = [];
        
        // perform loop
        const loopEnv = new Map(env);
        while(vi < ve) {
            loopEnv.set(stmt.var.name, vi++);
            stmt.body.forEach(s => {
                computedJS = computedJS.concat(evalStmt(s, new Map(loopEnv), state));
            });
        }

        return computedJS;

    } else if (isColor(stmt)) {
        // apply color to stroke
        if (stmt.color) {
            return [{cmd:'color', color: stmt.color}]
        } else {
            const r = evalExprWithEnv(stmt.r!, env);
            const g = evalExprWithEnv(stmt.g!, env);
            const b = evalExprWithEnv(stmt.b!, env);
            return [{cmd:'color', r, g, b}]
        }

    } else {
        throw new Error('Unrecognized Statement encountered: ' + (stmt as any)?.$type ?? 'Unknown Type');
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
        throw new Error(e.val.error?.message ?? `Attempted to lookup an unbound reference '${e.val.$refText}' in the env.`);

    } else if(isBinExpr(e)) {
        let opval = e.op;
        let v1    = evalExprWithEnv(e.e1, env);
        let v2    = evalExprWithEnv(e.e2, env);

        switch(opval) {
            case '+': return v1 + v2;
            case '-': return v1 - v2;
            case '*': return v1 * v2;
            case '/': return v1 / v2;
            default:    throw new Error(`Unrecognized bin op passed: ${opval}`);
        }
        
    } else if (isNegExpr(e)) {
        return -1 * evalExprWithEnv(e.ne, env);

    } else if(isGroup(e)) {
        return evalExprWithEnv(e.ge, env);

    }

    throw new Error('Unhandled Expression: ' + e);

}
