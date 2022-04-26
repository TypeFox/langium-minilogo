/******************************************************************************
 * This file was generated by langium-cli 0.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import { loadGrammar, Grammar } from 'langium';

let loadedMiniLogoGrammar: Grammar | undefined;
export const MiniLogoGrammar = (): Grammar => loadedMiniLogoGrammar ||(loadedMiniLogoGrammar = loadGrammar(`{
  "$type": "Grammar",
  "usedGrammars": [],
  "hiddenTokens": [],
  "imports": [],
  "rules": [
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Model",
      "hiddenTokens": [],
      "entry": true,
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "stmts",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Stmt"
              }
            },
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "defs",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Def"
              }
            },
            "elements": []
          }
        ],
        "cardinality": "*"
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Stmt",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Cmd"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Macro"
            },
            "elements": []
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Def",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "def",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "ID"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "params",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "arguments": [],
                  "rule": {
                    "$refText": "Param"
                  }
                },
                "elements": []
              },
              {
                "$type": "Group",
                "elements": [
                  {
                    "$type": "Keyword",
                    "value": ",",
                    "elements": []
                  },
                  {
                    "$type": "Assignment",
                    "feature": "params",
                    "operator": "+=",
                    "terminal": {
                      "$type": "RuleCall",
                      "arguments": [],
                      "rule": {
                        "$refText": "Param"
                      }
                    }
                  }
                ],
                "cardinality": "*"
              }
            ],
            "cardinality": "?"
          },
          {
            "$type": "Keyword",
            "value": ")"
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Block"
            }
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Param",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "name",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "arguments": [],
          "rule": {
            "$refText": "ID"
          }
        },
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Cmd",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Pen"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Move"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "For"
            },
            "elements": []
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Macro",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "def",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$refText": "Def"
              },
              "terminal": {
                "$type": "RuleCall",
                "arguments": [],
                "rule": {
                  "$refText": "ID"
                }
              }
            },
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "args",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "arguments": [],
                  "rule": {
                    "$refText": "Expr"
                  }
                },
                "elements": []
              },
              {
                "$type": "Group",
                "elements": [
                  {
                    "$type": "Keyword",
                    "value": ",",
                    "elements": []
                  },
                  {
                    "$type": "Assignment",
                    "feature": "args",
                    "operator": "+=",
                    "terminal": {
                      "$type": "RuleCall",
                      "arguments": [],
                      "rule": {
                        "$refText": "Expr"
                      }
                    }
                  }
                ],
                "cardinality": "*"
              }
            ],
            "cardinality": "?"
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Pen",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "pen",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "mode",
            "operator": "=",
            "terminal": {
              "$type": "Alternatives",
              "elements": [
                {
                  "$type": "Keyword",
                  "value": "up",
                  "elements": []
                },
                {
                  "$type": "Keyword",
                  "value": "down"
                }
              ]
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Move",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "move",
            "elements": []
          },
          {
            "$type": "Keyword",
            "value": "("
          },
          {
            "$type": "Assignment",
            "feature": "ex",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "ey",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "For",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "for",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "var",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Param"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": "="
          },
          {
            "$type": "Assignment",
            "feature": "e1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": "to"
          },
          {
            "$type": "Assignment",
            "feature": "e2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Block"
            }
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Block",
      "hiddenTokens": [],
      "fragment": true,
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "{",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "body",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Stmt"
              }
            },
            "cardinality": "*"
          },
          {
            "$type": "Keyword",
            "value": "}"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Expr",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Lit"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Ref"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "BinExpr"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "Group"
            },
            "elements": []
          },
          {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "NegExpr"
            },
            "elements": []
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Lit",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "val",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "arguments": [],
          "rule": {
            "$refText": "INT"
          }
        },
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Ref",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "val",
        "operator": "=",
        "terminal": {
          "$type": "CrossReference",
          "type": {
            "$refText": "Param"
          },
          "terminal": {
            "$type": "RuleCall",
            "arguments": [],
            "rule": {
              "$refText": "ID"
            }
          }
        },
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "BinExpr",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "BinOp"
              }
            },
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "e1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "Assignment",
            "feature": "e2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "BinOp",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Assignment",
        "feature": "val",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "add",
              "elements": []
            },
            {
              "$type": "Keyword",
              "value": "sub"
            },
            {
              "$type": "Keyword",
              "value": "mul"
            },
            {
              "$type": "Keyword",
              "value": "div"
            }
          ]
        },
        "elements": []
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "Group",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "(",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "ge",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          },
          {
            "$type": "Keyword",
            "value": ")"
          }
        ]
      }
    },
    {
      "$type": "ParserRule",
      "parameters": [],
      "name": "NegExpr",
      "hiddenTokens": [],
      "alternatives": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Keyword",
            "value": "-",
            "elements": []
          },
          {
            "$type": "Assignment",
            "feature": "ne",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "arguments": [],
              "rule": {
                "$refText": "Expr"
              }
            }
          }
        ]
      }
    },
    {
      "$type": "TerminalRule",
      "name": "ID",
      "terminal": {
        "$type": "RegexToken",
        "regex": "[_a-zA-Z][\\\\w_]*",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "name": "INT",
      "type": {
        "$type": "ReturnType",
        "name": "number"
      },
      "terminal": {
        "$type": "RegexToken",
        "regex": "-?[0-9]+",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "WS",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\s+",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "ML_COMMENT",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\/\\\\*[\\\\s\\\\S]*?\\\\*\\\\/",
        "elements": []
      }
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "SL_COMMENT",
      "terminal": {
        "$type": "RegexToken",
        "regex": "\\\\/\\\\/[^\\\\n\\\\r]*",
        "elements": []
      }
    }
  ],
  "interfaces": [],
  "types": [],
  "isDeclared": true,
  "name": "MiniLogo"
}`));
