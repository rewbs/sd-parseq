@builtin "whitespace.ne" # `_` means arbitrary amount of whitespace
@builtin "number.ne"     # `int`, `decimal`, and `percentage` number primitives
interp -> expr
expr -> "sin" _ "(" _ centre _ "," _ phase _ "," _ period _ "," _ amp _ ")" {%
    function(data) {
        return {
            operator: "sin",
            operands: [data[4],data[8],data[12],data[16]] 
        };
    }
%}
expr -> "saw" _ "(" _ centre _ "," _ phase _ "," _ period _ "," _ amp _ ")" {%
    function(data) {
        return {
            operator: "saw",
            operands: [data[4],data[8],data[12],data[16]] 
        };
    }
%}
expr -> "sq" _ "(" _ centre _ "," _ phase _ "," _ period _ "," _ amp _ ")" {%
    function(data) {
        return {
            operator: "sq",
            operands: [data[4],data[8],data[12],data[16]] 
        };
    }
%}
expr -> "tri" _ "(" _ centre _ "," _ phase _ "," _ period _ "," _ amp _ ")" {%
    function(data) {
        return {
            operator: "tri",
            operands: [data[4],data[8],data[12],data[16]] 
        };
    }
%}
          | "L" {%
    function(data) {
        return {
            operator: "L"
        };
    }
%}
          | "S" {%
    function(data) {
        return {
            operator: "S"
        };
    }
%}
          | "P" {%
    function(data) {
        return {
            operator: "P"
        };
    }
%}
          | "."  {%
    function(data) {
        return {
            operator: "."
        };
    }
%}
          | expr _ "+" _ expr {%
    function(data) {
        return {
            operator: "sum",
            leftOperand:  data[0],
            rightOperand: data[4]
        };
    }
%}
          | expr _ "-" _ expr {%
    function(data) {
        return {
            operator: "sub",
            leftOperand:  data[0],
            rightOperand: data[4]
        };
    }
%}
          | expr _ "*" _ expr {%
    function(data) {
        return {
            operator: "mul",
            leftOperand:  data[0],
            rightOperand: data[4]
        };
    }
%}
          | expr _ "/" _ expr {%
    function(data) {
        return {
            operator: "div",
            leftOperand:  data[0],
            rightOperand: data[4] 
        };
    }
%}
phase    -> decimal
period     -> decimal 
centre   -> decimal 
amp      -> decimal 