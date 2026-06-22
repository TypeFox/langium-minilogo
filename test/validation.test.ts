import { describe, test, expect, beforeAll } from 'vitest';
import { type ValidationResult, validationHelper, expectError, expectNoIssues } from 'langium/test';
import { createMiniLogoServices } from '../src/language-server/minilogo-module.js';
import { EmptyFileSystem } from 'langium';
import type { Model } from '../src/language-server/generated/ast.js';

let validate: (input: string) => Promise<ValidationResult<Model>>;

beforeAll(() => {
    const services = createMiniLogoServices(EmptyFileSystem);
    validate = validationHelper<Model>(services.MiniLogo);
});

describe('duplicate def validation', () => {

    test('no error for unique defs', async () => {
        const result = await validate(`
            def foo() { }
            def bar() { }
        `);
        expectNoIssues(result);
    });

    test('error for duplicate def names', async () => {
        const result = await validate(`
            def square(x) { }
            def square(y) { }
        `);
        // the second def should produce the error
        expectError(result, /non-unique name 'square'/, {
            node: result.document.parseResult.value.defs[1],
            property: 'name'
        });
    });

    test('error for three defs with the same name', async () => {
        const result = await validate(`
            def dup() { }
            def dup() { }
            def dup() { }
        `);
        // second and third should each get an error
        const errors = result.diagnostics.filter(d => d.severity === 1);
        expect(errors.length).toBe(2);
    });

    test('only duplicate names clash, unique ones are fine', async () => {
        const result = await validate(`
            def a() { }
            def b() { }
            def a() { }
            def c() { }
        `);
        const errors = result.diagnostics.filter(d => d.severity === 1);
        expect(errors.length).toBe(1);
    });

});

describe('duplicate param validation', () => {

    test('no error for unique params', async () => {
        const result = await validate(`
            def foo(x, y, z) { }
        `);
        expectNoIssues(result);
    });

    test('error for duplicate param names', async () => {
        const result = await validate(`
            def foo(a, b, a) { }
        `);
        expectError(result, /Param a is non-unique for Def 'foo'/, {
            node: result.document.parseResult.value.defs[0].params[2],
            property: 'name'
        });
    });

    test('error for multiple duplicate params', async () => {
        const result = await validate(`
            def foo(x, x, y, y) { }
        `);
        const errors = result.diagnostics.filter(d => d.severity === 1);
        expect(errors.length).toBe(2);
    });

    test('same param names in different defs are fine', async () => {
        const result = await validate(`
            def foo(x, y) { }
            def bar(x, y) { }
        `);
        expectNoIssues(result);
    });

});

describe('parsing valid programs', () => {

    test('empty program is valid', async () => {
        const result = await validate('');
        expectNoIssues(result);
    });

    test('basic move and pen commands', async () => {
        const result = await validate(`
            move(100, 200)
            pen(up)
            pen(down)
        `);
        expectNoIssues(result);
    });

    test('color with RGB values', async () => {
        const result = await validate(`
            color(255, 128, 0)
        `);
        expectNoIssues(result);
    });

    test('color with hex value', async () => {
        const result = await validate(`
            color(#ff00aa)
        `);
        expectNoIssues(result);
    });

    test('for loop', async () => {
        const result = await validate(`
            for x = 0 to 10 {
                move(x, 0)
            }
        `);
        expectNoIssues(result);
    });

    test('nested for loops', async () => {
        const result = await validate(`
            for x = 0 to 10 {
                for y = 0 to 10 {
                    move(x, y)
                }
            }
        `);
        expectNoIssues(result);
    });

    test('def with body and macro call', async () => {
        const result = await validate(`
            def square(size) {
                pen(down)
                move(size, 0)
                move(0, size)
                move(-1 * size, 0)
                move(0, -1 * size)
                pen(up)
            }
            square(100)
        `);
        expectNoIssues(result);
    });

    test('expressions with arithmetic', async () => {
        const result = await validate(`
            def foo(x, y) {
                move(x + 1, y * 2 - 3)
                move((x + y) / 2, -x)
            }
            foo(10, 20)
        `);
        expectNoIssues(result);
    });

});

describe('parsing invalid programs', () => {

    test('program with syntax errors has parser errors', async () => {
        const result = await validate('def {');
        expect(result.document.parseResult.parserErrors.length).toBeGreaterThan(0);
    });

    test('unresolved macro reference produces a linker error', async () => {
        const result = await validate('notDefined(1, 2)');
        // linker errors show up as diagnostics
        const errors = result.diagnostics.filter(d => d.severity === 1);
        expect(errors.length).toBeGreaterThan(0);
    });

});
