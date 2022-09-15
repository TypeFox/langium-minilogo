// mini logo example grammar
// based on Eric Walkingshaw's MiniLogo
// https://web.engr.oregonstate.edu/~walkiner/teaching/cs381-wi21/minilogo.html

grammar MiniLogo

entry Model: (stmts+=Stmt | defs+=Def)*;

// Statements
Stmt:   Cmd | Macro;
Cmd:    Pen | Move | For;
Macro:  def=[Def:ID] '(' (args+=Expr (',' args+=Expr)*)? ')';

// Definitions
Def:    'def' name=ID '(' (params+=Param (',' params+=Param)*)? ')' Block;

// Commands
Pen:    'pen' '(' mode=('up' | 'down') ')';
Move:   'move' '(' ex=Expr ',' ey=Expr ')';
For:    'for' var=Param '=' e1=Expr 'to' e2=Expr Block;


fragment Block: '{' body+=Stmt* '}';

Param: name=ID;


// Expressions
Expr:       Lit | Ref | BinExpr | Group | NegExpr;
Lit:        val=INT;
Ref:        val=[Param:ID];
BinExpr:    op=BinOp e1=Expr e2=Expr;
BinOp:      val=('add' | 'sub' | 'mul' | 'div');
Group:      '(' ge=Expr ')';
NegExpr:    '-' ne=Expr;

// Terminals
terminal ID returns string:     /[_a-zA-Z][\w_]*/;
terminal INT returns number:    /-?[0-9]+/;
hidden terminal WS:             /\s+/;
hidden terminal ML_COMMENT:     /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT:     /\/\/[^\n\r]*/;