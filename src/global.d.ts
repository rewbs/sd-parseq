// Stop the TS compiler complaining about findLast and findLastIndex not being defined.
// see: https://github.com/microsoft/TypeScript/issues/48829
export {}

declare global {
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any
    ): number
    findLast(
        predicate: (value: T, index: number, obj: T[]) => unknown,
        thisArg?: any
      ): T    
  }
}