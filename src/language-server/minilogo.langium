// mini logo example grammar
// based on Eric Walkingshaw's MiniLogo
// https://web.engr.oregonstate.edu/~walkiner/teaching/cs381-wi21/minilogo.html

grammar MiniLogo

entry Model: (stmts+=Stmt | defs+=Def)*;

// Statements
Stmt:   Cmd | Macro;
Cmd:    Pen | Move | Color | For;
Macro:  def=[Def:ID] '(' (args+=Expr (',' args+=Expr)*)? ')';

// Definitions
Def:    'def' name=ID '(' (params+=Param (',' params+=Param)*)? ')' Block;

// Commands
Pen:    'pen' '(' mode=('up' | 'down') ')';
Move:   'move' '(' ex=Expr ',' ey=Expr ')';
Color:  'color' '(' ((r = Expr ',' g=Expr ',' b=Expr) | color=ID | color=HEX) ')';
For:    'for' var=Param '=' e1=Expr 'to' e2=Expr Block;


fragment Block: '{' body+=Stmt* '}';

Param: name=ID;


// Expressions
Expr: Add;

Add  infers Expr: 
    Mult     ({infer BinExpr.e1=current} op=('+'|'-') e2=Mult)*;
Mult infers Expr: 
    PrimExpr ({infer BinExpr.e1=current} op=('*'|'/') e2=PrimExpr)*;

PrimExpr: Lit | Ref | Group | NegExpr;

Lit:        val=NUMBER;
Ref:        val=[Param:ID];
Group:      '(' ge=Expr ')';
NegExpr:    '-' ne=Expr;

// Terminals
terminal HEX returns string:    /#(\d|[a-fA-F]){3,6}/;
terminal ID returns string:     /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number:    /(?:(?:-?[0-9]+)?\.[0-9]+)|-?[0-9]+/;
hidden terminal WS:             /\s+/;
hidden terminal ML_COMMENT:     /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT:     /\/\/[^\n\r]*/;