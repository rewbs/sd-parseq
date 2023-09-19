import { ParseqFunction } from "./parseq-lang-functions";

function posNegHelper(term: string, weight: number, pweight: number, nweight: number, promptType: boolean, prefix: string, suffix: string) {
  const moveNegToPos = !promptType && weight < 0;
  const movePosToNeg = promptType && weight < 0;

  let canonicalWeight;
  if (moveNegToPos) {
    canonicalWeight = !isNaN(pweight) ? pweight : Math.abs(weight);
  } else if (movePosToNeg) {
    canonicalWeight = !isNaN(nweight) ? nweight : Math.abs(weight);
  } else if (promptType) {
    canonicalWeight = !isNaN(pweight) ? pweight : Math.abs(weight);
  } else {
    canonicalWeight = !isNaN(nweight) ? nweight : Math.abs(weight);
  }

  const weightedTerm = `${prefix}${term}:${canonicalWeight.toFixed(4)}${suffix}`;

  if (weight === 0) {
    // Don't include 0-weight terms.
    return '';
  } else if (moveNegToPos || movePosToNeg) {
    return `__PARSEQ_MOVE__${weightedTerm}__PARSEQ_END_MOVE__`;
  } else {
    return weightedTerm;
  }
}

const functionLibrary: { [key: string]: ParseqFunction } = {
  "posneg": {
    description: "Weight term, and move to positive prompt if weigth is positive, negative prompt otherwise.",
    argDefs: [
      { description: "term", names: ["term", "t"], type: "string", required: true, default: "" },
      { description: "weight", names: ["weight", "w"], type: "number", required: true, default: 1 },
      { description: "positive prompt weight override", names: ["posweight", "pw"], type: "number", required: false, default: NaN },
      { description: "negative prompt weight override", names: ["negweight", "nw"], type: "number", required: false, default: NaN }

    ],
    call: (ctx, args) => {
      const [term, weight, pweight, nweight] = [String(args[0]), Number(args[1]), Number(args[2]), Number(args[3])];

      if (ctx.promptType === undefined) {
        throw new Error("posneg() can only be used in a prompt.");
      }

      return posNegHelper(term, weight, pweight, nweight, ctx.promptType, '(', ')');
    }
  },
  "posneg_lora": {
    description: "Weight lora, and move to positive prompt if weigth is positive, negative prompt otherwise.",
    argDefs: [
      { description: "lora", names: ["term", "t"], type: "string", required: true, default: "" },
      { description: "weight", names: ["weight", "w"], type: "number", required: true, default: 1 },
      { description: "positive prompt weight override", names: ["posweight", "pw"], type: "number", required: false, default: NaN },
      { description: "negative prompt weight override", names: ["negweight", "nw"], type: "number", required: false, default: NaN }

    ],
    call: (ctx, args) => {
      const [term, weight, pweight, nweight] = [String(args[0]), Number(args[1]), Number(args[2]), Number(args[3])];

      if (ctx.promptType === undefined) {
        throw new Error("posneg() can only be used in a prompt.");
      }

      return posNegHelper(term, weight, pweight, nweight, ctx.promptType, '<lora:', '>');
    }
  },
}

export default functionLibrary;