import { ValidationAcceptor, ValidationCheck, ValidationRegistry } from 'langium';
import { Def, MiniLogoAstType, Model } from './generated/ast';
import type { MiniLogoServices } from './minilogo-module';

/**
 * Map AST node types to validation checks.
 */
type MiniLogoChecks = { [type in MiniLogoAstType]?: ValidationCheck | ValidationCheck[] }

/**
 * Registry for validation checks.
 */
export class MiniLogoValidationRegistry extends ValidationRegistry {
    constructor(services: MiniLogoServices) {
        super(services);
        const validator = services.validation.MiniLogoValidator;

        const checks: MiniLogoChecks = {
            Model: validator.checkUniqueDefs,
            Def:   validator.checkUniqueParams
        };

        this.register(checks, validator);
    }
}

export class MiniLogoValidator {

    checkUniqueDefs(model: Model, accept: ValidationAcceptor): void {
        const reported = new Set();
        model.defs.forEach(d => {
            if (reported.has(d.name)) {
                accept('error',  `Def has non-unique name '${d.name}'.`,  {node: d, property: 'name'});
            }
            reported.add(d.name);
        });
    }

    checkUniqueParams(def: Def, accept: ValidationAcceptor): void {
        const reported = new Set();
        def.params.forEach(p => {
            if (reported.has(p.name)) {
                accept('error', `Param ${p.name} is non-unique for Def '${def.name}'`, {node: p, property: 'name'});
            }
            reported.add(p.name);
        });
    }
}
