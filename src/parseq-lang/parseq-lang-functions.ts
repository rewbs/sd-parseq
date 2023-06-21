import { InvocationContext, ParseqAstNode } from "./parseq-lang-ast";
import { InterpolationType, TimeSeries } from "./parseq-timeseries";
import mathsFunctions from './parseq-lang-functions-maths'
import promptFunctions from './parseq-lang-functions-prompt'
import infoFunctions from './parseq-lang-functions-info'
import curveFunctions from './parseq-lang-functions-curve'
import oscFunctions from './parseq-lang-functions-osc'
import conversionFunctions from './parseq-lang-functions-conversion'
import metaFunctions from './parseq-lang-functions-meta'

export type ArgDef = {
    names: string[];
    description: string;
    type: string;
    required: boolean;
    default: number | string | ((ctx: InvocationContext) => number | string);
}

export type ParseqFunction = {
    description: string;
    argDefs: ArgDef[];
    call(ctx: InvocationContext, args: (number | string)[], node: ParseqAstNode): number | string;
}

const functionLibrary : { [key: string]: ParseqFunction } = {
    "missingFunction": {
        description: "invoked when function is not found",
        argDefs: [
          { description: "term a", names: ["a"], type: "number", required: false, default: 0 },
          { description: "term b", names: ["b"], type: "number", required: false, default: 0 },
          { description: "term c", names: ["c"], type: "number", required: false, default: 0 },
          { description: "term d", names: ["d"], type: "number", required: false, default: 0 },
          { description: "term e", names: ["e"], type: "number", required: false, default: 0 },
          { description: "term f", names: ["f"], type: "number", required: false, default: 0 },
          { description: "term g", names: ["g"], type: "number", required: false, default: 0 },
        ],
        call: (ctx, args, node) => {
            // TODO: hook for custom missing function handlers.
          const t = ctx.timeSeries.find((t => t.alias === node.getValue()));
          if (t?.ts) {
            const timeSeries = new TimeSeries(t.ts.data, t.ts.timestampType);
            return timeSeries.getValueAt(Number(args[0]), ctx.FPS, args[1] ? InterpolationType.Linear : InterpolationType.Step)??0;
          } else {
            throw new Error(`Unknown function: '${node.getValue()}'`)
          }
        }
      },    
    ...mathsFunctions,
    ...oscFunctions,    
    ...curveFunctions,
    ...promptFunctions,
    ...infoFunctions,
    ...conversionFunctions,
    ...metaFunctions
}

export default functionLibrary;