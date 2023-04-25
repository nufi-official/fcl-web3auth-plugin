export function believeMeIs<T>(x: unknown): asserts x is T {
  // empty
}

// https://stackoverflow.com/questions/39419170/how-do-i-check-that-a-switch-block-is-exhaustive-in-typescript
export const safeAssertUnreachable = (x: never): never => {
  throw new Error(`Unreachable switch case:${x}`)
}

export const id = <T>(x: T) => x

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const typeAssert = <_ extends true>() => undefined

export function assert(cond: boolean, errMsg?: string): asserts cond {
  if (!cond) throw new Error(`Assertion failed${errMsg ? `: ${errMsg}` : ''}`)
}

// https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-420227672
export type Equals<T, S> = [T] extends [S]
  ? [S] extends [T]
    ? true
    : false
  : false
