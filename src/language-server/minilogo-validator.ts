import { ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { MiniLogoAstType, Model, isMacro, Def, Stmt, isCmd, Cmd, Expr, isMove, isRef, isBinExpr, isGroup, isFor, isNegExpr } from './generated/ast';
import type { MiniLogoServices } from './minilogo-module';

/**
 * Map AST node types to validation checks.
 */
type MiniLogoChecks = { [type in MiniLogoAstType]?: ValidationCheck | ValidationCheck[] }

// MiniLogo env used for validation
type MiniLogoChkEnv = {
    defNames : Set<string>,
    paramNames : Set<string>
}

/**
 * Registry for validation checks.
 */
export class MiniLogoValidationRegistry extends ValidationRegistry {
    constructor(services: MiniLogoServices) {
        super(services);
        const validator = services.validation.MiniLogoValidator;
        const checks: MiniLogoChecks = {
            Model: validator.checkModel
        };
        this.register(checks, validator);
    }
}

/**
 * Implementation of custom validations.
 */
export class MiniLogoValidator {

    // Verify a minilogo expr, looking for undefined refs
    checkExpr(expr: Expr, env: MiniLogoChkEnv, accept: ValidationAcceptor): void {
        if(isRef(expr) && !env.paramNames.has(expr.val)) {
            // unbound ref
            accept(
                'error', 
                `Undefined reference ${expr.val}.`, 
                {node: expr, property: 'val'});

        } else if(isBinExpr(expr)) {
            // verify the sub-expressions
            [expr.e1, expr.e2].forEach(e => this.checkExpr(e, env, accept));

        } else if(isGroup(expr)) {
            // verify the wrapped expr
            this.checkExpr(expr.ge, env, accept);

        } else if(isNegExpr(expr)) {
            // verify negated expr
            this.checkExpr(expr.ne, env, accept);

        }
    }

    // Verify a minilogo cmd, only interested in the exprs used for move
    checkCmd(cmd: Cmd, env: MiniLogoChkEnv, accept: ValidationAcceptor): void {
        if (isMove(cmd)) {
            // verify Move's sub expressions
            [cmd.ex, cmd.ey].forEach(e => this.checkExpr(e, env, accept));

        } else if(isFor(cmd)) {
            // verify For loop's body
            // update env, and check that sub exprs are OK
            let origPar = env.paramNames.has(cmd.var);
            env.paramNames.add(cmd.var);
            cmd.b.body.forEach(s => this.checkStmt(s, env, accept));
            // restore
            origPar ? "" : env.paramNames.delete(cmd.var);

        }
    }

    // Verify a statement in the program within the context of known defs, & params at this point
    checkStmt(stmt: Stmt, env: MiniLogoChkEnv, accept: ValidationAcceptor): void {
        if(isMacro(stmt)) {
            if(!env.defNames.has(stmt.name)) {
                // undefined def
                accept(
                    'error', 
                    `Undefined macro ${stmt.name}! Try double checking your spelling, or add the correct macro def to your program.`, 
                    {node: stmt, property: 'name'});

            } else {
                // verify each expr passed to this macro
                stmt.args.forEach(e => this.checkExpr(e, env, accept));

            }

        } else if(isCmd(stmt)) {
            // verify this command
            this.checkCmd(stmt, env, accept);

        } else {
            // just in case...
            throw new Error("Undefined statement during validation!");

        }
    }

    // Verify the model once complete
    checkModel(model: Model, accept: ValidationAcceptor): void {
        // load all def names into a set for later validaion
        let miniLogoEnv : MiniLogoChkEnv = {
            defNames: new Set<string>(model.defs.map(d => d.name)),
            paramNames: new Set<string>()
        };
        // check all raw statements, looking for macro calls, make sure those defs exist, otherwise FAIL
        model.stmts.forEach(s => this.checkStmt(s, miniLogoEnv, accept));

        // for each def, chk statements for macro calls & refs, macro calls should exist, refs should be bound, otherwise FAIL
        model.defs.forEach(d => {
            this.checkDef(d, miniLogoEnv, accept);
            // flush any params we may have set
            miniLogoEnv.paramNames.clear();
        });
    }

    // Verify a definition, binding params, and verifying the subsequent list of stmts
    checkDef(def: Def, env: MiniLogoChkEnv, accept: ValidationAcceptor): void {
        // copy origin param names to restore post-verification
        let origParamNames : Set<string> = {... env.paramNames};

        // collect param names for ref
        def.params.forEach(p => env.paramNames.add(p));

        // verify each statement w/ these params bound
        def.b.body.forEach(s => this.checkStmt(s, env, accept));

        // restore original params, if any
        env.paramNames = origParamNames;
    }
}
