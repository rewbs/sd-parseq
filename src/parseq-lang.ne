@preprocessor esmodule
@{%
const moo = require("moo");

let comment, string_literal, number_literal, identifier, unit, ws;

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

%}

@lexer lexer

input
    -> _ expression _  {% d => [d[1]] %}
    

parameter_list
    -> null        {% () => [] %}
    | identifier   {% d => [d[0]] %}
    | identifier _ "," _ parameter_list
        {%
            d => [d[0], ...d[4]]
        %}

call_expression
    ->  identifier _ "(" named_argument_list ")"
        {%
            d => ({
                type: "call_expression_named_args",
                fun_name: d[0],
                arguments: d[3],
                start: d[0].start,
                end: tokenEnd(d[4])
            })
        %}
    | identifier _ "(" argument_list ")"
        {%
            d => ({
                type: "call_expression",
                fun_name: d[0],
                arguments: d[3],
                start: d[0].start,
                end: tokenEnd(d[4])
            })
        %}
        
if_expression
    -> "if" __ expression __ expression
        {%
            d => ({
                type: "if_expression",
                condition: d[2],
                consequent: d[4],
                start: tokenStart(d[0]),
                end: d[4].end
            })
        %}
    |  "if" __ expression _ expression _
       "else" __ expression
        {%
            d => ({
                type: "if_expression",
                condition: d[2],
                consequent: d[4],
                alternate: d[8],
                start: tokenStart(d[0]),
                end: d[8].end
            })
        %}
    |  "if" __ expression _ expression _
       "else" __ if_expression
       {%
            d => ({
                type: "if_expression",
                condition: d[2],
                consequent: d[4],
                alternate: d[8],
                start: tokenStart(d[0]),
                end: d[8].end
            })
       %}

argument_list
    -> null {% () => [] %}
    |  _ expression _  {% d => [d[1]] %}
    |  _ expression _ "," argument_list
        {%
            d => [d[1], ...d[4]]
        %}

named_argument_list
    ->  _ identifier _ "=" _ expression _
        {%
            d => [{
                    name: d[1],
                    value: d[5]
                  }]
        %}
    |  _ identifier _ "=" _ expression _ "," named_argument_list
        {%
            d => [{
                    name: d[1],
                    value: d[5]
                  },
                  ...d[8]
                  ]
        %}

expression -> boolean_expression         {% id %}

boolean_expression
    -> comparison_expression     {% id %}
    |  comparison_expression _ boolean_operator _ boolean_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

boolean_operator
    -> "and"      {% id %}
    |  "or"       {% id %}

comparison_expression
    -> additive_expression    {% id %}
    |  additive_expression _ comparison_operator _ comparison_expression
        {%
            d => ({
                type: "binary_operation",
                operator: d[2],
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

comparison_operator
    -> ">"   {% convertTokenId %}
    |  ">="  {% convertTokenId %}
    |  "<"   {% convertTokenId %}
    |  "<="  {% convertTokenId %}
    |  "=="  {% convertTokenId %}

additive_expression
    -> multiplicative_expression    {% id %}
    |  multiplicative_expression _ [+-] _ additive_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

multiplicative_expression
    -> negation     {% id %}
    |  negation _ [*/%] _ multiplicative_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

negation
    -> unary_expression     {% id %}
    | "-" unary_expression
        {%
            d => ({
                type: "negation",
                value: d[1],
                start: d[0].start,
                end: d[1].end
            })        
        %}    

unary_expression
    -> number               {% id %}
    | identifier
        {%
            d => ({
                type: "var_reference",
                var_name: d[0],
                start: d[0].start,
                end: d[0].end
            })
        %}
    |  call_expression      {% id %}
    |  string_literal       {% id %}
    |  if_expression      {% id %}
    |  boolean_literal      {% id %}
    |  "(" _ expression _ ")"
        {%
            data => data[2]
        %}

boolean_literal
    -> "true"
        {%
            d => ({
                type: "boolean_literal",
                value: true,
                start: tokenStart(d[0]),
                end: tokenEnd(d[0])
            })
        %}
    |  "false"
        {%
            d => ({
                type: "boolean_literal",
                value: false,
                start: tokenStart(d[0]),
                end: tokenEnd(d[0])
            })
        %}

line_comment -> %comment {% convertTokenId %}

string_literal -> %string_literal {% convertTokenId %}

number -> %number_literal
        {%
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
                    return {
                        type: "number_literal",
                        value: Number(value),
                        start: d[0].start,
                        end: d[0].end
                    };
                }
            }
        %}

identifier -> %identifier {% convertTokenId %}

unit -> %unit {% convertTokenId %}

__ -> %ws:+

_ -> %ws:*