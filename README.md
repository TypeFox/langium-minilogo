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

This setups up the libraries that you will need in **examples/generated/libs** for all examples.

To build the examples included, you can run these two commands below -- one for each example.

```bash
npm run generate:test
npm run generate:logo
```

This will create **examples/generated/test** and **examples/generated/langium**. Each of these folders contains a single index.html that includes the minilogo web worker (from libs) to get the language server running. They also include their respective **mini-logo.js** file to prepare the canvas for drawing, and sketch up the preliminary image.

To make it easy to access these files, you can use the built-in express server to access these static assets.

```
npm run serve
```

This will listen on localhost:3000 by default, and makes it easy to view both the test and langium minilogo applications.

Each one runs an instance of Langium & Monaco. This makes it easy to change your program on the fly, trigger an update via the 'Update Canvas' button, and then view your results drawn in realtime.


## Running Locally

To run this simple language, you can first build up the grammar

To run the language you can first generate from the langium grammar, and build the project:
```bash
$ npm run langium:generate
$ npm run build
```

After this you can generate the resulting code from the given MiniLogo test program (or another if you wish). This implementation using Langium genererates 2 files:
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

Note that both of these examples are generated statically from the CLI, and are capable of being used as standalone web-apps for writing MiniLogo programs. For this, please see the **Running in the Web** section above.
