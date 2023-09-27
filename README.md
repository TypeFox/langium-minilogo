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

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/images/m2.jpg" width=800 alt="Image of Langium running standalone in the Browser">

To run these examples standalone in the web, you need to first build the regular application, and then build & copy assets over for usage in browsers.

```bash
# in case you've adjusted the grammar
npm run langium:generate

# compile minilogo, copy, and construct the appropriate web assets
npm run build:web
```

This builds Minilogo, and sets up the libraries that you will need in **public** for all MiniLogo programs. You can startup an simple express app on localhost:3000 with a default program by running the following.

```bash
npm run serve
```

In the same interface you can also add in any MiniLogo program (that is recognized by this implementation of MiniLogo in Langium) that you would like to test, and see the results printed to the canvas on the right hand side. Once changes are made, you can click the update button at the bottom of the page to trigger redrawing the canvas using the current program.

If you're running after making a large quantity of changes, you can always run `npm run clean` before building to ensure you have a stable state.

There are some example MiniLogo programs in the **examples** folder that you can try out as well.

At a high-level, updating the canvas works by:

- Monaco is started with a language client (LC), and is connected to an Minilogo language server (LS)
- The document is updated, and the LC passes this new document (program) to the LS
- the language server (Langium) receives the document
- the document is parsed & an AST is produced, validations are performed, etc.
- the generator is invoked to traverse and transform this AST into an array of drawing commands (includes evaluation of exprs)
- these resulting commands, along with the AST, are returned as the result as a response to a successfully validated (processed) document
- the front-end receives & processes these drawing instructions using a very simple stack-based machine
- the machine drives visual updates to the canvas

This is a hyper generalization of each step, but should be sufficient to get a good idea of how this example implementation works.

Here are the results of a couple of example programs

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/images/m1.jpg" width=500 alt="Image of the resulting HTML page generated test.logo">

<img src="https://raw.githubusercontent.com/montymxb/minilogo-langium-example/main/images/m3.gif" width=500 alt="Image of a turtle being drawn with MiniLogo via Langium">

## Running Locally

You can also directly spit out generated code from the command line, if you'd like to run this locally, you can run a generation test like so.

```bash
npm run generate:test

# or run & store the output into a file
./bin/cli.js examples/simple.logo > examples/simple.json
```

This will give you a a JSON array of drawing commands generated from the **examples/simple.logo** program. You can also run this on any other MiniLogo program that you'd like to test, such as **examples/test.logo** and **examples/turtle.logo**.

This output can be fed into another program to process the corresponding drawing commands, without needing to interact with a Minilogo program directly.
