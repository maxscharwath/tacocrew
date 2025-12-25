/**
 * Result type for functional error handling
 * Enables type-safe error handling without try/catch
 */

/**
 * Result<T, E> - Either a success with value T or an error with E
 * Inspired by Rust's Result type
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
  ok: true;
  value: T;
}

export interface Failure<E> {
  ok: false;
  error: E;
}

// ============================================================================
// Constructors
// ============================================================================

/**
 * Create a successful result
 */
export const Ok = <T>(value: T): Result<T, never> => ({
  ok: true,
  value,
});

/**
 * Create a failed result
 */
export const Err = <E>(error: E): Result<never, E> => ({
  ok: false,
  error,
});

// ============================================================================
// Combinators
// ============================================================================

/**
 * Map over success value
 */
export const map = <T, U, E>(result: Result<T, E>, f: (value: T) => U): Result<U, E> => {
  if (result.ok) {
    return Ok(f(result.value));
  }
  return result;
};

/**
 * Flat map (bind) operation
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  f: (value: T) => Result<U, E>
): Result<U, E> => {
  if (result.ok) {
    return f(result.value);
  }
  return result;
};

/**
 * Map over error
 */
export const mapError = <T, E, E2>(result: Result<T, E>, f: (error: E) => E2): Result<T, E2> => {
  if (result.ok) {
    return result;
  }
  return Err(f(result.error));
};

/**
 * Get value or default
 */
export const getOrElse = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.ok ? result.value : defaultValue;
};

/**
 * Unwrap with custom error message
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T => {
  return result.ok ? result.value : defaultValue;
};

/**
 * Execute side effect for success or failure
 */
export const match = <T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R
): R => {
  return result.ok ? onSuccess(result.value) : onFailure(result.error);
};

/**
 * Type guard for success
 */
export const isOk = <T, E>(result: Result<T, E>): result is Success<T> => {
  return result.ok;
};

/**
 * Type guard for failure
 */
export const isErr = <T, E>(result: Result<T, E>): result is Failure<E> => {
  return !result.ok;
};

/**
 * Convert async operation to Result
 */
export const fromPromise = async <T, E extends Error = Error>(
  promise: Promise<T>,
  errorHandler?: (error: unknown) => E
): Promise<Result<T, E>> => {
  try {
    const value = await promise;
    return Ok(value);
  } catch (error) {
    const err = error instanceof Error ? (error as E) : new Error(String(error));
    return Err(errorHandler ? errorHandler(error) : (err as E));
  }
};

/**
 * Combine multiple results (like Promise.all)
 * Returns an error if any result is an error, otherwise returns array of all values
 */
export const all = <
  T extends readonly Result<unknown, unknown>[],
  V = { [K in keyof T]: T[K] extends Result<infer U, unknown> ? U : never },
  E = T[number] extends Result<unknown, infer Err> ? Err : never,
>(
  results: T
): Result<V, E> => {
  const values: unknown[] = [];

  for (const result of results) {
    if (!isOk(result)) {
      return result as Result<V, E>;
    }
    values.push(result.value);
  }

  return Ok(values as V);
};
