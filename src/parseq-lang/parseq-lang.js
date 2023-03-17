// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");

// Import all classes defined in parseq-lang-ast
// TODO - surely we can avoid all this repetition somehow?
const NumberLiteralAst = require("./parseq-lang-ast").NumberLiteralAst;
const StringLiteralAst = require("./parseq-lang-ast").StringLiteralAst;
const BooleanLiteralAst = require("./parseq-lang-ast").BooleanLiteralAst;
const NegationAst = require("./parseq-lang-ast").NegationAst;
const FunctionCallAst = require("./parseq-lang-ast").FunctionCallAst;
const NamedArgAst = require("./parseq-lang-ast").NamedArgAst;
const UnnamedArgAst = require("./parseq-lang-ast").UnnamedArgAst;
const IfAst = require("./parseq-lang-ast").IfAst;
const BinaryOpAst = require("./parseq-lang-ast").BinaryOpAst;

let comment, string_literal, number_literal, identifier, unit, ws;

const lexer = moo.compile({
    ws: {match: /[ \t\r\n]+/, lineBreaks: true }, 
    lte: "<=",
    lt: "<",
    gte: ">=",
    gt: ">",
    eq: "==",
    neq: "!=",
    and: "&&",
    or: "||",
    lparan: "(",
    rparan: ")",
    comma: ",",
    assignment: "=",
    plus: "+",
    minus: "-",
    multiply: "*",
    pow: "^",
    divide: "/",
    modulo: "%",
    colon: ":",
    comment: {
        match: /#[^\n]*/,
        value: s => s.substring(1)
    },
    string_literal: {
        match: /"(?:[^\n\\"]|\\["\\ntbfr])*"/,
        value: s => JSON.parse(s)
    },    
    number_literal: {
        match: /[0-9]+(?:\.[0-9]+)?[fsb]?/
    },    
    identifier: {
        match: /[a-zA-Z_][a-zA-Z_0-9]*/,
        type: moo.keywords({
            else: "else",
            if: "if",
            and: "and",
            or: "or",
            true: "true",
            false: "false",
        })
    }
});

function tokenStart(token) {
    return {
        line: token.line,
        col: token.col - 1
    };
}

function tokenEnd(token) {
    return {
        line: token.line,
        col: token.col + token.text?.length??0 - 1
    };
}

function convertToken(token) {
    return {
        type: token.type,
        value: token.value,
        start: tokenStart(token),
        end: tokenEnd(token)
    };
}

function convertTokenId(data) {
    return convertToken(data[0]);
}

var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "input", "symbols": ["_", "expression", "_"], "postprocess": d => [d[1]]},
    {"name": "parameter_list", "symbols": [], "postprocess": () => []},
    {"name": "parameter_list", "symbols": ["identifier"], "postprocess": d => [d[0]]},
    {"name": "parameter_list", "symbols": ["identifier", "_", {"literal":","}, "_", "parameter_list"], "postprocess": 
        d => [d[0], ...d[4]]
                },
    {"name": "call_expression", "symbols": ["identifier", "_", {"literal":"("}, "named_argument_list", {"literal":")"}], "postprocess": 
        d => new FunctionCallAst(d[0].start, tokenEnd(d[4]), d[3], d[0].value)
                },
    {"name": "call_expression", "symbols": ["identifier", "_", {"literal":"("}, "argument_list", {"literal":")"}], "postprocess": 
        d => new FunctionCallAst(d[0].start, tokenEnd(d[4]), d[3], d[0].value)
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "__", "expression"], "postprocess": 
        d => new IfAst(tokenStart(d[0]), d[4].end, [d[2], d[4]])
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "_", "expression", "_", {"literal":"else"}, "__", "expression"], "postprocess": 
        d => new IfAst(tokenStart(d[0]), d[8].end, [d[2], d[4], d[8]])
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "_", "expression", "_", {"literal":"else"}, "__", "if_expression"], "postprocess": 
        d => new IfAst(tokenStart(d[0]), d[8].end, [d[2], d[4], d[8]])
               },
    {"name": "argument_list", "symbols": [], "postprocess": () => []},
    {"name": "argument_list", "symbols": ["_", "expression", "_"], "postprocess": 
        d => [new UnnamedArgAst(tokenStart(d[1]), tokenEnd(d[1]), [d[1]])]
                },
    {"name": "argument_list", "symbols": ["_", "expression", "_", {"literal":","}, "argument_list"], "postprocess": 
        d => [new UnnamedArgAst(tokenStart(d[1]), tokenEnd(d[1]), [d[1]]), ...d[4]]
                },
    {"name": "named_argument_list", "symbols": ["_", "identifier", "_", {"literal":"="}, "_", "expression", "_"], "postprocess": 
        d => [new NamedArgAst(d[1].start, d[5].end, [d[5]], d[1].value)]
                },
    {"name": "named_argument_list", "symbols": ["_", "identifier", "_", {"literal":"="}, "_", "expression", "_", {"literal":","}, "named_argument_list"], "postprocess": 
        d => [new NamedArgAst(d[1].start, d[5].end, [d[5]], d[1].value), ...d[8]]
                },
    {"name": "expression", "symbols": ["boolean_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression", "_", "boolean_operator", "_", "boolean_expression"], "postprocess": 
        d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
                },
    {"name": "boolean_operator", "symbols": [{"literal":"and"}], "postprocess": id},
    {"name": "boolean_operator", "symbols": [{"literal":"or"}], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression"], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression", "_", "comparison_operator", "_", "comparison_expression"], "postprocess": 
        d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
                },
    {"name": "comparison_operator", "symbols": [{"literal":">"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":">="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"=="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"!="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"&&"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"||"}], "postprocess": convertTokenId},
    {"name": "additive_expression", "symbols": ["multiplicative_expression"], "postprocess": id},
    {"name": "additive_expression", "symbols": ["multiplicative_expression", "_", /[+-]/, "_", "additive_expression"], "postprocess": 
        d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
                },
    {"name": "multiplicative_expression", "symbols": ["negation"], "postprocess": id},
    {"name": "multiplicative_expression", "symbols": ["negation", "_", /[*/%\:\^]/, "_", "multiplicative_expression"], "postprocess": 
        d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
                },
    {"name": "negation", "symbols": ["unary_expression"], "postprocess": id},
    {"name": "negation", "symbols": [{"literal":"-"}, "unary_expression"], "postprocess": 
        d => new NegationAst(d[0].start, d[1].end, [d[1]])
                },
    {"name": "unary_expression", "symbols": ["number"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["identifier"], "postprocess": 
        d => ({
            type: "var_reference",
            var_name: d[0],
            start: d[0].start,
            end: d[0].end
        })
                },
    {"name": "unary_expression", "symbols": ["call_expression"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["string_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["if_expression"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["boolean_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": [{"literal":"("}, "_", "expression", "_", {"literal":")"}], "postprocess": 
        data => data[2]
                },
    {"name": "boolean_literal", "symbols": [{"literal":"true"}], "postprocess": 
        d => new BooleanLiteralAst(tokenStart(d[0]),tokenEnd(d[0]), [], true)
                },
    {"name": "boolean_literal", "symbols": [{"literal":"false"}], "postprocess": 
        d => new BooleanLiteralAst(tokenStart(d[0]),tokenEnd(d[0]), [], false)
                },
    {"name": "line_comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": convertTokenId},
    {"name": "string_literal", "symbols": [(lexer.has("string_literal") ? {type: "string_literal"} : string_literal)], "postprocess":  
        d => new StringLiteralAst(d[0].start, d[0].end, [], d[0].value)
                },
    {"name": "number", "symbols": [(lexer.has("number_literal") ? {type: "number_literal"} : number_literal)], "postprocess": 
        d => {
            // Putting logic here is nasty, but is necessary to avoid
            // a lookbehind regex in the lexer, which breaks Safari.
            let [_, value, unit] = d[0].text.match(/(.*?)([fsb])?$/);
            if (unit) {
                return {
                    type: "number_with_unit",
                    value: Number(value),
                    unit: unit,
                    start: d[0].start,
                    end: d[0].end
                };
            } else {
                return new NumberLiteralAst(d[0].start, d[0].end, [], Number(value));
            }
        }
                },
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": convertTokenId},
    {"name": "unit", "symbols": [(lexer.has("unit") ? {type: "unit"} : unit)], "postprocess": convertTokenId},
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]}
]
  , ParserStart: "input"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
