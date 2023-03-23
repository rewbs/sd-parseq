import nearley from 'nearley';
//@ts-ignore
import ParserRules from './parseq-lang.js';
import { VariableReferenceAst } from './parseq-lang-ast';

export function parse(input: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(ParserRules));
  const parsed = parser.feed(input);
  return parsed.results[0][0];
}

export const defaultInterpolation = new VariableReferenceAst({ line: 0, col: 0 }, { line: 0, col: 0 }, [], "L");