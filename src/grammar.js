// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
    Lexer: undefined,
    ParserRules: [
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "__$ebnf$1", "symbols": ["wschar"]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", "wschar"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": function(d) {return null;}},
    {"name": "wschar", "symbols": [/[ \t\n\v\f]/], "postprocess": id},
    {"name": "unsigned_int$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_int$ebnf$1", "symbols": ["unsigned_int$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_int", "symbols": ["unsigned_int$ebnf$1"], "postprocess": 
        function(d) {
            return parseInt(d[0].join(""));
        }
        },
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "int$ebnf$1$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "int$ebnf$1", "symbols": ["int$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "int$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "int$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "int$ebnf$2", "symbols": ["int$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "int", "symbols": ["int$ebnf$1", "int$ebnf$2"], "postprocess": 
        function(d) {
            if (d[0]) {
                return parseInt(d[0][0]+d[1].join(""));
            } else {
                return parseInt(d[1].join(""));
            }
        }
        },
    {"name": "unsigned_decimal$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$1", "symbols": ["unsigned_decimal$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "unsigned_decimal$ebnf$2$subexpression$1", "symbols": [{"literal":"."}, "unsigned_decimal$ebnf$2$subexpression$1$ebnf$1"]},
    {"name": "unsigned_decimal$ebnf$2", "symbols": ["unsigned_decimal$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "unsigned_decimal$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "unsigned_decimal", "symbols": ["unsigned_decimal$ebnf$1", "unsigned_decimal$ebnf$2"], "postprocess": 
        function(d) {
            return parseFloat(
                d[0].join("") +
                (d[1] ? "."+d[1][1].join("") : "")
            );
        }
        },
    {"name": "decimal$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "decimal$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$2", "symbols": ["decimal$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "decimal$ebnf$3$subexpression$1$ebnf$1", "symbols": ["decimal$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "decimal$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "decimal$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "decimal$ebnf$3", "symbols": ["decimal$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "decimal$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "decimal", "symbols": ["decimal$ebnf$1", "decimal$ebnf$2", "decimal$ebnf$3"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "")
            );
        }
        },
    {"name": "percentage", "symbols": ["decimal", {"literal":"%"}], "postprocess": 
        function(d) {
            return d[0]/100;
        }
        },
    {"name": "jsonfloat$ebnf$1", "symbols": [{"literal":"-"}], "postprocess": id},
    {"name": "jsonfloat$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$2", "symbols": ["jsonfloat$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$3$subexpression$1$ebnf$1", "symbols": ["jsonfloat$ebnf$3$subexpression$1$ebnf$1", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$3$subexpression$1", "symbols": [{"literal":"."}, "jsonfloat$ebnf$3$subexpression$1$ebnf$1"]},
    {"name": "jsonfloat$ebnf$3", "symbols": ["jsonfloat$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$3", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [/[+-]/], "postprocess": id},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": [/[0-9]/]},
    {"name": "jsonfloat$ebnf$4$subexpression$1$ebnf$2", "symbols": ["jsonfloat$ebnf$4$subexpression$1$ebnf$2", /[0-9]/], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "jsonfloat$ebnf$4$subexpression$1", "symbols": [/[eE]/, "jsonfloat$ebnf$4$subexpression$1$ebnf$1", "jsonfloat$ebnf$4$subexpression$1$ebnf$2"]},
    {"name": "jsonfloat$ebnf$4", "symbols": ["jsonfloat$ebnf$4$subexpression$1"], "postprocess": id},
    {"name": "jsonfloat$ebnf$4", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "jsonfloat", "symbols": ["jsonfloat$ebnf$1", "jsonfloat$ebnf$2", "jsonfloat$ebnf$3", "jsonfloat$ebnf$4"], "postprocess": 
        function(d) {
            return parseFloat(
                (d[0] || "") +
                d[1].join("") +
                (d[2] ? "."+d[2][1].join("") : "") +
                (d[3] ? "e" + (d[3][1] || "+") + d[3][2].join("") : "")
            );
        }
        },
    {"name": "interp", "symbols": ["expr"]},
    {"name": "expr$string$1", "symbols": [{"literal":"s"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$1", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "sin",
                operands: [data[4],data[8],data[12],data[16]] 
            };
        }
        },
    {"name": "expr$string$2", "symbols": [{"literal":"s"}, {"literal":"a"}, {"literal":"w"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$2", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "saw",
                operands: [data[4],data[8],data[12],data[16]] 
            };
        }
        },
    {"name": "expr$string$3", "symbols": [{"literal":"s"}, {"literal":"q"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$3", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "sq",
                operands: [data[4],data[8],data[12],data[16]] 
            };
        }
        },
    {"name": "expr$string$4", "symbols": [{"literal":"t"}, {"literal":"r"}, {"literal":"i"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$4", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "tri",
                operands: [data[4],data[8],data[12],data[16]] 
            };
        }
        },
    {"name": "expr$string$5", "symbols": [{"literal":"m"}, {"literal":"i"}, {"literal":"n"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$5", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "min",
                operands: [data[4],data[8]] 
            };
        }
        },
    {"name": "expr$string$6", "symbols": [{"literal":"m"}, {"literal":"a"}, {"literal":"x"}], "postprocess": function joiner(d) {return d.join('');}},
    {"name": "expr", "symbols": ["expr$string$6", "_", {"literal":"("}, "_", "expr", "_", {"literal":","}, "_", "expr", "_", {"literal":")"}], "postprocess": 
        function(data) {
            return {
                operator: "max",
                operands: [data[4],data[8]] 
            };
        }
        },
    {"name": "expr", "symbols": [{"literal":"L"}], "postprocess": 
        function(data) {
            return {
                operator: "L"
            };
        }
        },
    {"name": "expr", "symbols": [{"literal":"S"}], "postprocess": 
        function(data) {
            return {
                operator: "S"
            };
        }
        },
    {"name": "expr", "symbols": [{"literal":"P"}], "postprocess": 
        function(data) {
            return {
                operator: "P"
            };
        }
        },
    {"name": "expr", "symbols": [{"literal":"f"}], "postprocess": 
        function(data) {
            return {
                operator: "f"
            };
        }
        },
    {"name": "expr", "symbols": ["decimal"], "postprocess": 
        function(data) {
            return {
                operator: "constant",
                operand:  data[0]
            };
        }
        },
    {"name": "expr", "symbols": [{"literal":"."}], "postprocess": 
        function(data) {
            return {
                operator: "."
            };
        }
        },
    {"name": "expr", "symbols": ["expr", "_", {"literal":"+"}, "_", "expr"], "postprocess": 
        function(data) {
            return {
                operator: "sum",
                leftOperand:  data[0],
                rightOperand: data[4]
            };
        }
        },
    {"name": "expr", "symbols": ["expr", "_", {"literal":"-"}, "_", "expr"], "postprocess": 
        function(data) {
            return {
                operator: "sub",
                leftOperand:  data[0],
                rightOperand: data[4]
            };
        }
        },
    {"name": "expr", "symbols": ["expr", "_", {"literal":"*"}, "_", "expr"], "postprocess": 
        function(data) {
            return {
                operator: "mul",
                leftOperand:  data[0],
                rightOperand: data[4]
            };
        }
        },
    {"name": "expr", "symbols": ["expr", "_", {"literal":"/"}, "_", "expr"], "postprocess": 
        function(data) {
            return {
                operator: "div",
                leftOperand:  data[0],
                rightOperand: data[4] 
            };
        }
        },
    {"name": "phase", "symbols": ["decimal"]},
    {"name": "period", "symbols": ["decimal"]},
    {"name": "centre", "symbols": ["decimal"]},
    {"name": "amp", "symbols": ["decimal"]}
]
  , ParserStart: "interp"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
