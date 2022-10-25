function id(x) { return x[0]; }

const moo = require("moo");

let comment, string_literal, number_literal, identifier, unit, ws;
export default function getGrammar() {
    return grammar;
}  


const lexer = moo.compile({
    ws: {match: /[ \t\r\n]+/, lineBreaks: true }, 
    lte: "<=",
    lt: "<",
    gte: ">=",
    gt: ">",
    eq: "==",
    lparan: "(",
    rparan: ")",
    comma: ",",
    assignment: "=",
    plus: "+",
    minus: "-",
    multiply: "*",
    divide: "/",
    modulo: "%",
    colon: ":",
    comment: {
        match: /#[^\n]*/,
        value: s => s.substring(1)
    },
    unit: {
        match: /(?<=[0-9])[fsb]/
    }, 
    number_literal: {
        match: /[0-9]+(?:\.[0-9]+)?/,
        value: s => Number(s)
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
    const lastNewLine = token.text.lastIndexOf("\n");
    if (lastNewLine !== -1) {
        throw new Error("Unsupported case: token with line breaks");
    }
    return {
        line: token.line,
        col: token.col + token.text.length - 1
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

const grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "input", "symbols": ["_", "expression", "_"], "postprocess": d => [d[1]]},
    {"name": "parameter_list", "symbols": [], "postprocess": () => []},
    {"name": "parameter_list", "symbols": ["identifier"], "postprocess": d => [d[0]]},
    {"name": "parameter_list", "symbols": ["identifier", "_", {"literal":","}, "_", "parameter_list"], "postprocess": 
        d => [d[0], ...d[4]]
                },
    {"name": "call_expression", "symbols": ["identifier", "_", {"literal":"("}, "named_argument_list", {"literal":")"}], "postprocess": 
        d => ({
            type: "call_expression_named_args",
            fun_name: d[0],
            arguments: d[3],
            start: d[0].start,
            end: tokenEnd(d[4])
        })
                },
    {"name": "call_expression", "symbols": ["identifier", "_", {"literal":"("}, "argument_list", {"literal":")"}], "postprocess": 
        d => ({
            type: "call_expression",
            fun_name: d[0],
            arguments: d[3],
            start: d[0].start,
            end: tokenEnd(d[4])
        })
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "__", "expression"], "postprocess": 
        d => ({
            type: "if_expression",
            condition: d[2],
            consequent: d[4],
            start: tokenStart(d[0]),
            end: d[4].end
        })
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "_", "expression", "_", {"literal":"else"}, "__", "expression"], "postprocess": 
        d => ({
            type: "if_expression",
            condition: d[2],
            consequent: d[4],
            alternate: d[8],
            start: tokenStart(d[0]),
            end: d[8].end
        })
                },
    {"name": "if_expression", "symbols": [{"literal":"if"}, "__", "expression", "_", "expression", "_", {"literal":"else"}, "__", "if_expression"], "postprocess": 
        d => ({
            type: "if_expression",
            condition: d[2],
            consequent: d[4],
            alternate: d[8],
            start: tokenStart(d[0]),
            end: d[8].end
        })
               },
    {"name": "argument_list", "symbols": [], "postprocess": () => []},
    {"name": "argument_list", "symbols": ["_", "expression", "_"], "postprocess": d => [d[1]]},
    {"name": "argument_list", "symbols": ["_", "expression", "_", {"literal":","}, "argument_list"], "postprocess": 
        d => [d[1], ...d[4]]
                },
    {"name": "named_argument_list", "symbols": ["_", "identifier", "_", {"literal":"="}, "_", "expression", "_"], "postprocess": 
        d => [{
                name: d[1],
                value: d[5]
              }]
                },
    {"name": "named_argument_list", "symbols": ["_", "identifier", "_", {"literal":"="}, "_", "expression", "_", {"literal":","}, "named_argument_list"], "postprocess": 
        d => [{
                name: d[1],
                value: d[5]
              },
              ...d[8]
              ]
                },
    {"name": "expression", "symbols": ["boolean_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression"], "postprocess": id},
    {"name": "boolean_expression", "symbols": ["comparison_expression", "_", "boolean_operator", "_", "boolean_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "boolean_operator", "symbols": [{"literal":"and"}], "postprocess": id},
    {"name": "boolean_operator", "symbols": [{"literal":"or"}], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression"], "postprocess": id},
    {"name": "comparison_expression", "symbols": ["additive_expression", "_", "comparison_operator", "_", "comparison_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: d[2],
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "comparison_operator", "symbols": [{"literal":">"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":">="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<"}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"<="}], "postprocess": convertTokenId},
    {"name": "comparison_operator", "symbols": [{"literal":"=="}], "postprocess": convertTokenId},
    {"name": "additive_expression", "symbols": ["multiplicative_expression"], "postprocess": id},
    {"name": "additive_expression", "symbols": ["multiplicative_expression", "_", /[+-]/, "_", "additive_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "multiplicative_expression", "symbols": ["negation"], "postprocess": id},
    {"name": "multiplicative_expression", "symbols": ["negation", "_", /[*/%]/, "_", "multiplicative_expression"], "postprocess": 
        d => ({
            type: "binary_operation",
            operator: convertToken(d[2]),
            left: d[0],
            right: d[4],
            start: d[0].start,
            end: d[4].end
        })
                },
    {"name": "negation", "symbols": ["number_with_unit"], "postprocess": id},
    {"name": "negation", "symbols": [{"literal":"-"}, "number_with_unit"], "postprocess": 
        d => ({
            type: "negation",
            value: d[1],
            start: d[0].start,
            end: d[1].end
        })        
                },
    {"name": "number_with_unit", "symbols": ["number", "unit"], "postprocess": 
        d => ({
            type: "number_with_unit",
            left: d[0],
            right: d[1],
            start: d[0].start,
            end: d[1].end
        })
                },
    {"name": "number_with_unit", "symbols": ["unary_expression"], "postprocess": id},
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
    {"name": "unary_expression", "symbols": ["if_expression"], "postprocess": id},
    {"name": "unary_expression", "symbols": ["boolean_literal"], "postprocess": id},
    {"name": "unary_expression", "symbols": [{"literal":"("}, "expression", {"literal":")"}], "postprocess": 
        data => data[1]
                },
    {"name": "boolean_literal", "symbols": [{"literal":"true"}], "postprocess": 
        d => ({
            type: "boolean_literal",
            value: true,
            start: tokenStart(d[0]),
            end: tokenEnd(d[0])
        })
                },
    {"name": "boolean_literal", "symbols": [{"literal":"false"}], "postprocess": 
        d => ({
            type: "boolean_literal",
            value: false,
            start: tokenStart(d[0]),
            end: tokenEnd(d[0])
        })
                },
    {"name": "line_comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment )], "postprocess": convertTokenId},
    {"name": "string_literal", "symbols": [(lexer.has("string_literal") ? {type: "string_literal"} : string_literal)], "postprocess": convertTokenId},
    {"name": "number", "symbols": [(lexer.has("number_literal") ? {type: "number_literal"} : number_literal)], "postprocess": convertTokenId},
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

