// mini logo example grammar
// Written by Benjamin F. Wilson
// based on Eric Walkingshaw's MiniLogo
// https://web.engr.oregonstate.edu/~walkiner/teaching/cs381-wi21/minilogo.html

grammar MiniLogo

// model consists of zero or more cmds and zero or more defs (macros)
entry Model:
    (stmts += Stmt | defs += Def)*;

// statement is a command or function app
// macros bind args to param names and evaluate a list of statements, potentially using those bindings
Stmt:
    Cmd | Macro;

// macro definition, w/ a body of statements
Def:
    'def' name=ID '(' (params+=Param (',' params+=Param)*)? ')' Block;

// general parameter
Param:
    name=ID;

// MiniLogo commands, these either change the pen state by position and up/down (not drawing or drawing), or allow looping
Cmd:
    Pen | Move | For;

// calling a macro by name
Macro:
    def=[Def:ID] '(' (args+=Expr (',' args+=Expr)*)? ')';
    // TODO using name=[Def:ID], matching the 'name' prop on the ref, causes a crash in the language server due a cyclic structure being created
    // prevents the reply msg from the language server from being stringified
    // cryptic error was tough to debug, something that could be improved most likely

// Pen command
Pen:
    'pen' '(' mode=('up' | 'down') ')';

// Move command
Move:
    'move' '(' ex=Expr ',' ey=Expr ')';

// For loop
For:
    'for' var=Param '=' e1=Expr 'to' e2=Expr Block;

// block of statements, used in defs & for loops
fragment Block:
    '{' body+=Stmt* '}';

//
// Expressions, literal ints, refs to vars, binary expressions, and parenthetically grouped exprs
//
Expr:
    Lit | Ref | BinExpr | Group | NegExpr;

// Literal int (number)
Lit:
    val=INT;

// expressions can be references to bound vars
Ref:
    val=[Param:ID]; // Xref to params

// Prefix notation w/ literal op names for binary application
BinExpr:
    op=BinOp e1=Expr e2=Expr;

// Alternation of binop constants
BinOp:
    val=('add' | 'sub' | 'mul' | 'div');

// A parenthentically wrapped expr
Group:
    '(' ge=Expr ')';

// Negated expr
NegExpr:
    '-' ne=Expr;

//
// Terminals
//

// std. ids
terminal ID: /[_a-zA-Z][\w_]*/;
// set of ints (pos/neg) recognized
terminal INT returns number: /-?[0-9]+/;

hidden terminal WS: /\s+/;
// going w/ C-style comments
hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;