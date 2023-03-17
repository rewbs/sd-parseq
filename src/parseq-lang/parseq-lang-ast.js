"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnnamedArgAst = exports.NamedArgAst = exports.FunctionCallAst = exports.IfAst = exports.BinaryOpAst = exports.NegationAst = exports.BooleanLiteralAst = exports.StringLiteralAst = exports.NumberLiteralAst = void 0;
class ParseqAstNode {
    constructor(start, end, children, value) {
        this.start = start;
        this.end = end;
        this.children = children;
        this.value = value;
        // TODO - fix all cases where nodes have missing position info.
        if (!start) {
            start = { line: undefined, col: undefined };
        }
        if (!end) {
            start = { line: undefined, col: undefined };
        }
    }
    debug() {
        const currentNode = `${this.constructor.name}:{${this.value ?? ''}} (${this.start?.line}:${this.start?.col}->${this.end?.line}:${this.end?.col})`;
        if (this.children.length > 0) {
            const children = this.children.flatMap(child => child.debug ? child.debug() : child);
            return [currentNode, children];
        }
        else {
            return currentNode;
        }
    }
}
class NumberLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return Number(this.value ?? 0);
    }
}
exports.NumberLiteralAst = NumberLiteralAst;
class StringLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return String(this.value ?? '');
    }
}
exports.StringLiteralAst = StringLiteralAst;
class BooleanLiteralAst extends ParseqAstNode {
    invoke(ctx) {
        return this.value ? 1 : 0;
    }
}
exports.BooleanLiteralAst = BooleanLiteralAst;
class NegationAst extends ParseqAstNode {
    invoke(ctx) {
        const negatable = this.children[0].invoke(ctx);
        if (typeof negatable === 'string') {
            return "-" + negatable;
        }
        else {
            return -negatable;
        }
    }
}
exports.NegationAst = NegationAst;
class BinaryOpAst extends ParseqAstNode {
    constructor() {
        super(...arguments);
        this.leftNode = this.children[0];
        this.rightNode = this.children[1];
    }
    invoke(ctx) {
        const left = this.leftNode.invoke(ctx);
        const right = this.rightNode.invoke(ctx);
        switch (this.value) {
            case '+':
                //@ts-ignore - fall back to JS type juggling.
                return left + right;
            case '-':
                //@ts-ignore - fall back to JS type juggling.
                return left - right;
            case '*':
                //@ts-ignore - fall back to JS type juggling.
                return left * right;
            case '/':
                //@ts-ignore - fall back to JS type juggling.
                return left / right;
            case '%':
                //@ts-ignore - fall back to JS type juggling.
                return left % right;
            case '^':
                //@ts-ignore - fall back to JS type juggling.
                return left ** right;
            case '==':
                return left == right ? 1 : 0;
            case '!=':
                return left != right ? 1 : 0;
            case '<':
                return left < right ? 1 : 0;
            case '<=':
                return left <= right ? 1 : 0;
            case '>':
                return left > right ? 1 : 0;
            case '>=':
                return left >= right ? 1 : 0;
            case 'and':
            case '&&':
                return left > 0 && right > 0 ? 1 : 0;
            case 'or':
            case '||':
                return left > 0 || right > 0 ? 1 : 0;
            case ':':
                return "(" + left + ":" + right + ")";
            default:
                throw new Error(`Unknown binary operator '${JSON.stringify(this.value)}' at ${this.start?.line}:${this.start?.col}.`);
        }
    }
}
exports.BinaryOpAst = BinaryOpAst;
class IfAst extends ParseqAstNode {
    constructor() {
        super(...arguments);
        this.conditionNode = this.children[0];
        this.consequentNode = this.children[1];
        this.alternateNode = this.children[2] || null;
    }
    invoke(ctx) {
        if (this.conditionNode.invoke(ctx) > 0) {
            return this.consequentNode.invoke(ctx);
        }
        else if (this.alternateNode) {
            return this.alternateNode.invoke(ctx);
        }
        else {
            return 0;
        }
    }
}
exports.IfAst = IfAst;
class FunctionCallAst extends ParseqAstNode {
    constructor(start, end, children, value) {
        super(start, end, children, value);
        this.start = start;
        this.end = end;
        this.children = children;
        this.value = value;
        this.evaluateArgs = (ctx) => {
            // Check that all required args are present
            const requiredArgs = this.funcDef.argDefs.filter(arg => arg.required);
            const missingArgs = this.isNamedArgs() ?
                requiredArgs.some(arg => arg.names.every(name => !this.children.some(child => child.getName() === name)))
                : this.children.length < requiredArgs.length;
            if (missingArgs) {
                throw new Error(`Missing required argument(s) for function '${this.value} (${this.funcDef.description})'. Required arguments: ${requiredArgs.map(arg => arg.names.join('/')).join(', ')}`);
            }
            // Check that all args are known
            let extraArgs;
            if (this.isNamedArgs()) {
                const extraArgNames = this.children.map(child => child.getName())
                    .filter(name => !this.funcDef.argDefs.some(arg => arg.names.includes(name)));
                extraArgs = {
                    extras: extraArgNames.length,
                    names: extraArgNames
                };
            }
            else {
                extraArgs = {
                    extras: this.children.length - this.funcDef.argDefs.length,
                    names: []
                };
            }
            if (extraArgs.names.length > 0) {
                throw new Error(`Unrecognised argument(s) for function '${this.value} (${this.funcDef.description})': ${extraArgs.names.join(', ')}. Supported arguments: ${this.funcDef.argDefs.map(arg => arg.names.join('/')).join(', ')}`);
            }
            else if (extraArgs.extras > 0) {
                throw new Error(`Too many arguments for function '${this.value} (${this.funcDef.description})'. Expected ${this.funcDef.argDefs.length} arguments, got ${this.children.length}`);
            }
            // Check that no duplicate args are present
            if (this.isNamedArgs()) {
                const duplicateArgNames = this.funcDef.argDefs.filter(arg => this.children.filter(child => arg.names.includes(child.getName())).length > 1)
                    .map(arg => arg.names.join('/'));
                if (duplicateArgNames.length > 0) {
                    throw new Error(`Duplicate arguments for function '${this.value} (${this.funcDef.description})': ${duplicateArgNames.join(', ')}`);
                }
            }
            // Evaluate arguments in order of definition (checking type before returning)
            return this.funcDef.argDefs.map((argDef, idx) => {
                const argNode = this.isNamedArgs() ?
                    this.children.find(child => argDef.names.includes(child.getName()))
                    : this.children[idx];
                if (argNode) {
                    const argVal = argNode.invoke(ctx);
                    if (typeof argVal !== argDef.type) {
                        throw new Error(`Invalid argument type for argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'. Expected type '${argDef.type}', got '${typeof argVal}'`);
                    }
                    else {
                        return argVal;
                    }
                }
                else {
                    if (argDef.required) {
                        throw new Error(`Missing required argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'`);
                    }
                    else {
                        return argDef.default;
                    }
                }
            });
        };
        this.funcDef = functionLibrary[value];
    }
    isNamedArgs() {
        // All arguments are either named or unnamed, you can't mix & match (enforced by grammar).
        // So it's sufficient to check the first arg.
        return this.children.length > 0 && this.children[0] instanceof NamedArgAst;
    }
    invoke(ctx) {
        const args = this.evaluateArgs(ctx);
        return this.funcDef.call(ctx, args);
    }
}
exports.FunctionCallAst = FunctionCallAst;
class NamedArgAst extends ParseqAstNode {
    getName() {
        return this.value ?? '';
    }
    invoke(ctx) {
        return this.children[1].invoke(ctx);
    }
}
exports.NamedArgAst = NamedArgAst;
class UnnamedArgAst extends ParseqAstNode {
    invoke(ctx) {
        return this.children[0].invoke(ctx);
    }
}
exports.UnnamedArgAst = UnnamedArgAst;
const functionLibrary = {
    "min": {
        description: "returns the smaller of 2 arguments 'a' and 'b'",
        argDefs: [
            { description: "term a", names: ["a"], type: "number", required: true, default: 0 },
            { description: "term b", names: ["b"], type: "number", required: true, default: 0 }
        ],
        call: (ctx, args) => Math.min(...args.map(arg => Number(arg)))
    },
    "max": {
        description: "returns the greater of 2 arguments 'a' and 'b'",
        argDefs: [
            { description: "term a", names: ["a"], type: "number", required: true, default: 0 },
            { description: "term b", names: ["b"], type: "number", required: true, default: 0 }
        ],
        call: (ctx, args) => Math.max(...args.map(arg => Number(arg)))
    }
};
// function FunctionCallFactory(start: InputLocation, end: InputLocation, args: ParseqAstNode[], name: string): FunctionCallAst {
// }
