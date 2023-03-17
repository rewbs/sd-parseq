export type InvocationContext = {
  fieldName: string;
  activeKeyframe: number;
  definedFrames: number[];
  definedValues: number[];
  allKeyframes: number[];
  FPS: number;
  BPM: number;
  variableMap: Map<string, number>;
  frame: number;
}

type InputLocation = {
  line: number | undefined;
  col: number | undefined;
}

abstract class ParseqAstNode {
  constructor(protected start: InputLocation,
    protected end: InputLocation,
    protected children: ParseqAstNode[],
    protected value?: string | number) {
      // TODO - fix all cases where nodes have missing position info.
      if (!start) {
        start = {line: undefined, col: undefined};
      }
      if (!end) {
        start = {line: undefined, col: undefined};
      }      
  }

  abstract invoke(ctx: InvocationContext): string | number;

  public debug(): any {
    const currentNode = `${this.constructor.name}:{${this.value ?? ''}} (${this.start?.line}:${this.start?.col}->${this.end?.line}:${this.end?.col})`;
    
    if (this.children.length > 0) {
      const children = this.children.flatMap(child => child.debug ? child.debug() : child);
      return [currentNode, children];
    } else {
      return currentNode;
    }
  }
}

export class NumberLiteralAst extends ParseqAstNode {
  invoke(ctx: InvocationContext): number {
    return Number(this.value ?? 0);
  }
}

export class StringLiteralAst extends ParseqAstNode {
  invoke(ctx: InvocationContext): string {
    return String(this.value ?? '');
  }
}
export class BooleanLiteralAst extends ParseqAstNode {
  invoke(ctx: InvocationContext): number {
    return this.value ? 1 : 0;
  }
}  

export class NegationAst extends ParseqAstNode {
  invoke(ctx: InvocationContext): number | string {
    const negatable = this.children[0].invoke(ctx);
    if (typeof negatable === 'string') {
      return "-" + negatable;
    } else {
      return -negatable;
    }
  }
}

export class BinaryOpAst extends ParseqAstNode {
  private leftNode = this.children[0];
  private rightNode = this.children[1];

  invoke(ctx: InvocationContext): number | string {
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



export class IfAst extends ParseqAstNode {

  private conditionNode = this.children[0];
  private consequentNode = this.children[1];
  private alternateNode = this.children[2] || null;

  invoke(ctx: InvocationContext): number | string {
    if (this.conditionNode.invoke(ctx) > 0) {
      return this.consequentNode.invoke(ctx);
    } else if (this.alternateNode)  {
      return this.alternateNode.invoke(ctx);
    } else {
      return 0;
    }
  }
}

export class FunctionCallAst extends ParseqAstNode {

  private funcDef: ParseqFunction;

  constructor(protected start: InputLocation,
    protected end: InputLocation,
    protected children: ParseqAstNode[],
    protected value: string | number) {
    super(start, end, children, value);
    this.funcDef = functionLibrary[value];
  }

  isNamedArgs(): boolean {
    // All arguments are either named or unnamed, you can't mix & match (enforced by grammar).
    // So it's sufficient to check the first arg.
    return this.children.length > 0 && this.children[0] instanceof NamedArgAst;
  }

  invoke(ctx: InvocationContext): number | string {
    const args = this.evaluateArgs(ctx);
    return this.funcDef.call(ctx, args);
  }

  private evaluateArgs = (ctx: InvocationContext): (number | string)[] => {

    // Check that all required args are present
    const requiredArgs = this.funcDef.argDefs.filter(arg => arg.required);
    const missingArgs: boolean = this.isNamedArgs() ?
      requiredArgs.some(arg => arg.names.every(name => !this.children.some(child => (child as NamedArgAst).getName() === name)))
      : this.children.length < requiredArgs.length;
    if (missingArgs) {
      throw new Error(`Missing required argument(s) for function '${this.value} (${this.funcDef.description})'. Required arguments: ${requiredArgs.map(arg => arg.names.join('/')).join(', ')}`);
    }

    // Check that all args are known
    let extraArgs: { extras: number, names: string[] };
    if (this.isNamedArgs()) {
      const extraArgNames = this.children.map(child => (child as NamedArgAst).getName())
        .filter(name => !this.funcDef.argDefs.some(arg => arg.names.includes(name)));
      extraArgs = {
        extras: extraArgNames.length,
        names: extraArgNames
      };
    } else {
      extraArgs = {
        extras: this.children.length - this.funcDef.argDefs.length,
        names: []
      };
    }
    if (extraArgs.names.length > 0) {
      throw new Error(`Unrecognised argument(s) for function '${this.value} (${this.funcDef.description})': ${extraArgs.names.join(', ')}. Supported arguments: ${this.funcDef.argDefs.map(arg => arg.names.join('/')).join(', ')}`);
    } else if (extraArgs.extras > 0) {
      throw new Error(`Too many arguments for function '${this.value} (${this.funcDef.description})'. Expected ${this.funcDef.argDefs.length} arguments, got ${this.children.length}`);
    }

    // Check that no duplicate args are present
    if (this.isNamedArgs()) {
      const duplicateArgNames = this.funcDef.argDefs.filter(arg => this.children.filter(child => arg.names.includes((child as NamedArgAst).getName())).length > 1)
        .map(arg => arg.names.join('/'));

      if (duplicateArgNames.length > 0) {
        throw new Error(`Duplicate arguments for function '${this.value} (${this.funcDef.description})': ${duplicateArgNames.join(', ')}`);
      }
    }

    // Evaluate arguments in order of definition (checking type before returning)
    return this.funcDef.argDefs.map((argDef, idx) => {
      const argNode = this.isNamedArgs() ?
        this.children.find(child => argDef.names.includes((child as NamedArgAst).getName()))
        : this.children[idx];
      if (argNode) {
        const argVal = argNode.invoke(ctx);
        if (typeof argVal !== argDef.type) {
          throw new Error(`Invalid argument type for argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'. Expected type '${argDef.type}', got '${typeof argVal}'`);
        } else {
          return argVal;
        }
      } else {
        if (argDef.required) {
          throw new Error(`Missing required argument '${argDef.names.join('/')}' for function '${this.value} (${this.funcDef.description})'`);
        } else {
          return argDef.default;
        }
      }
    });
  }


}

export class NamedArgAst extends ParseqAstNode {
  getName(): string {
    return this.value as string ?? '';
  }
  invoke(ctx: InvocationContext): number | string {
    return this.children[1].invoke(ctx);
  }
}

export class UnnamedArgAst extends ParseqAstNode {
  invoke(ctx: InvocationContext): number | string {
    return this.children[0].invoke(ctx);
  }
}

type ArgDef = {
  names: string[];
  description: string;
  type: string;
  required: boolean;
  default: number | string;
}

type ParseqFunction = {
  description: string;
  argDefs: ArgDef[];
  call(ctx: InvocationContext, args: (number | string)[]): number | string;
}


const functionLibrary: { [key: string]: ParseqFunction } = {

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

}


// function FunctionCallFactory(start: InputLocation, end: InputLocation, args: ParseqAstNode[], name: string): FunctionCallAst {
// }


