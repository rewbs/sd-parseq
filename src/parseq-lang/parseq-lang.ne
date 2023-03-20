@preprocessor esmodule
@{%
const moo = require("moo");

// Import all classes defined in parseq-lang-ast
// TODO - surely we can avoid all this repetition somehow?
const NumberLiteralAst = require("./parseq-lang-ast").NumberLiteralAst;
const StringLiteralAst = require("./parseq-lang-ast").StringLiteralAst;
const BooleanLiteralAst = require("./parseq-lang-ast").BooleanLiteralAst;
const NumberWithUnitAst = require("./parseq-lang-ast").NumberWithUnitAst;
const NegationAst = require("./parseq-lang-ast").NegationAst;
const FunctionCallAst = require("./parseq-lang-ast").FunctionCallAst;
const NamedArgAst = require("./parseq-lang-ast").NamedArgAst;
const UnnamedArgAst = require("./parseq-lang-ast").UnnamedArgAst;
const IfAst = require("./parseq-lang-ast").IfAst;
const BinaryOpAst = require("./parseq-lang-ast").BinaryOpAst;
const VariableReferenceAst = require("./parseq-lang-ast").VariableReferenceAst;

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
            d => new FunctionCallAst(d[0].start, tokenEnd(d[4]), d[3], d[0].value)
        %}
    | identifier _ "(" argument_list ")"
        {%
            d => new FunctionCallAst(d[0].start, tokenEnd(d[4]), d[3], d[0].value)
        %}
        
if_expression
    -> "if" __ expression __ expression
        {%
            d => new IfAst(tokenStart(d[0]), d[4].end, [d[2], d[4]])
        %}
    |  "if" __ expression _ expression _
       "else" __ expression
        {%
            d => new IfAst(tokenStart(d[0]), d[8].end, [d[2], d[4], d[8]])
        %}
    |  "if" __ expression _ expression _
       "else" __ if_expression
       {%
            d => new IfAst(tokenStart(d[0]), d[8].end, [d[2], d[4], d[8]])
       %}

argument_list
    -> null {% () => [] %}
    |  _ expression _ 
        {%
            d => [new UnnamedArgAst(tokenStart(d[1]), tokenEnd(d[1]), [d[1]])]
        %}
    |  _ expression _ "," argument_list
        {%
            d => [new UnnamedArgAst(tokenStart(d[1]), tokenEnd(d[1]), [d[1]]), ...d[4]]
        %} 

named_argument_list
    ->  _ identifier _ "=" _ expression _
        {%
            d => [new NamedArgAst(d[1].start, d[5].end, [d[5]], d[1].value)]
        %}

    |  _ identifier _ "=" _ expression _ "," named_argument_list
        {%
            d => [new NamedArgAst(d[1].start, d[5].end, [d[5]], d[1].value), ...d[8]]
        %}

expression -> boolean_expression         {% id %}

boolean_expression
    -> comparison_expression     {% id %}
    |  comparison_expression _ boolean_operator _ boolean_expression
        {%
            d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
        %}

boolean_operator
    -> "and"      {% id %}
    |  "or"       {% id %}    

comparison_expression
    -> additive_expression    {% id %}
    |  additive_expression _ comparison_operator _ comparison_expression
        {%
            d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
        %}

comparison_operator
    -> ">"   {% convertTokenId %}
    |  ">="  {% convertTokenId %}
    |  "<"   {% convertTokenId %}
    |  "<="  {% convertTokenId %}
    |  "=="  {% convertTokenId %}
    |  "!="  {% convertTokenId %}
    |  "&&"  {% convertTokenId %}
    |  "||"  {% convertTokenId %}

additive_expression
    -> multiplicative_expression    {% id %}
    |  multiplicative_expression _ [+-] _ additive_expression
        {%
            d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
        %}


multiplicative_expression
    -> negation     {% id %}
    |  negation _ [*/%\:\^] _ multiplicative_expression
        {%
            d => new BinaryOpAst(d[0].start, d[4].end, [d[0], d[4]], d[2].value)
        %}


negation
    -> unary_expression     {% id %}
    | "-" unary_expression
        {%
            d => new NegationAst(d[0].start, d[1].end, [d[1]])
        %}    

unary_expression
    -> number               {% id %}
    | identifier
        {%
            d => new VariableReferenceAst(d[0].start, d[0].end, [], d[0].value)
        %}
    |  call_expression    {% id %}
    |  string_literal     {% id %}
    |  if_expression      {% id %}
    |  boolean_literal    {% id %}
    |  "(" _ expression _ ")"
        {%
            d => d[2]
        %}

boolean_literal
    -> "true"
        {%
            d => new BooleanLiteralAst(tokenStart(d[0]),tokenEnd(d[0]), [], true)
        %}
    |  "false"
        {%
            d => new BooleanLiteralAst(tokenStart(d[0]),tokenEnd(d[0]), [], false)
        %}

line_comment -> %comment {% convertTokenId %}

string_literal -> %string_literal
        {% 
            d => new StringLiteralAst(d[0].start, d[0].end, [], d[0].value)
        %}

number -> %number_literal
        {%
            d => {
                // Putting logic here is nasty, but is necessary to avoid
                // a lookbehind regex in the lexer, which breaks Safari.
                let [_, value, unit] = d[0].text.match(/(.*?)([fsb])?$/);
                if (unit) {
                    return new NumberWithUnitAst(d[0].start, d[0].end, [
                        new NumberLiteralAst(d[0].start, d[0].end, [], Number(value))
                    ], unit);
                } else {
                    return new NumberLiteralAst(d[0].start, d[0].end, [], Number(value));
                }
            }
        %}

identifier -> %identifier {% convertTokenId %}

unit -> %unit {% convertTokenId %}

__ -> %ws:+

_ -> %ws:*