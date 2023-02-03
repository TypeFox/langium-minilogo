# MiniLogo in Langium

An example of implementing a simple DSL, MiniLogo, in Langium.

MiniLogo is a example language for operating a 'pen' to draw on a surface. If you're familiar with python's [Turtle graphics](https://docs.python.org/3/library/turtle.html), it's similar to that.

This implementation is based on [Eric Walkingshaw's grammar and semantics at OSU](https://web.engr.oregonstate.edu/~walkiner/teaching/cs381-wi21/minilogo.html).

Which in turn, is based on the [Logo language](https://el.media.mit.edu/logo-foundation/what_is_logo/logo_programming.html) itself.

There is, at this time, a single example in **examples/test.logo**. Which demonstrates the aspects of MiniLogo:
- **Move** commands to change position of the pen
- **Pen up/down** commands to change the drawing state
- Basic arithmetic expressions of **literal ints**, **references**, and **binary expressions**. Parenthesized and negated expressions are allowed as well
- Common arithmetic binary functions are in infix notation: **+**, **-**, **\*** and **/**
- **For** loops allow a means to bind a single variable to an expr, with a second expression as an excluded upper bound, and a body of statements that are executed on each loop
- **Macros** are definable, taking arguments upon calling that are bound to parameters which can be referenced in a macro's body
- **Color** can be set for the lines that are drawn, affecting all subsequent 'move' comands. 

Notably, there is *no branching* instruction present, as there are *no booleans* present in this language.

## Running in the Web

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/m2.jpg" width=800 alt="Image of Langium running standalone in the Browser">

To run these examples standalone in the web, you need to first build the regular application, and then build & copy assets over for usage in browsers.

```bash
npm run build
npm run build:web
```

This setups up the libraries that you will need in **public** for all MiniLogo programs. You can startup an simple express app on localhost:3000 with a default program by running the following.

```bash
npm run serve
```

In the same interface you can also add in any MiniLogo program (that is recognized by this implementation of MiniLogo in Langium) that you would like to test, and see the results printed to the canvas on the right hand side. Once changes are made, you can click the update button at the bottom of the page to trigger redrawing the canvas using the current program.

There are some example MiniLogo programs in the **examples** folder that you can try out as well.

At a high-level, updating the canvas works by:

- Monaco executes a custom LSP command, passing the current program
- the language server (Langium) receives this LSP command through a registered command handler
- the generator API is invoked using the provided program
- generator invokes the parser on provided program
- an AST is produced, validations are performed, etc.
- the generator traverses and transforms this AST into an array of drawing commands (includes evaluation of exprs)
- these drawing commands are returned as the result of executing the LSP command
- the front-end proceses these drawing instructions using a very simple stack-based machine
- the machine drives visual updates to the canvas

This is a hyper generalization of each step, but should be sufficient to get a good idea of how this example implementation works.

## Running Locally

To run this simple language, you can first build up the grammar

To run the language you can first generate from the langium grammar, and build the project:
```bash
$ npm run langium:generate
$ npm run build
```

After this you can generate the resulting code from the given MiniLogo test program (or another if you wish). This implementation using Langium generates 2 files:
- **index.html**, a simple HTML page with a canvas where the results are shown
- **mini-logo.js**, a simple JS file where MiniLogo instructions are compiled into equivalent drawing commands for the canvas, along with some pre-written functions to assist in the process.

```bash
$ npm run generate:test
```

The result is present in `examples/generated/test/index.html`, which you can open in your browser, and view the following.

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/m1.jpg" width=500 alt="Image of the resulting HTML page generated test.logo">

For a more advanced example, you can generate a program that will draw an approximation of the langium logo.

```bash
$ npm run generate:logo
```

For fun, there's also a turtle example too.

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/m3.gif" width=500 alt="Image of a turtle being drawn with MiniLogo via Langium">

Note that these examples are generated statically from the CLI, and are capable of being used as standalone web-apps for writing MiniLogo programs. For this, please see the **Running in the Web** section above.
