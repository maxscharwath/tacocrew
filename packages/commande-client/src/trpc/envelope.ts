import { ValidationError } from '../errors';

type SuperJsonMeta = {
  readonly values: Readonly<Record<string, readonly [string]>> | readonly [string];
  readonly v?: number;
};

type SuperJsonEnvelope<T> = {
  readonly json: T;
  readonly meta?: SuperJsonMeta;
};

export type TrpcRequestBody<T> = Readonly<Record<'0', SuperJsonEnvelope<T>>>;

// commande.app's tRPC server is configured with the superjson transformer, so
// non-JSON-native values (Date, undefined, …) must travel as plain JSON in
// `json` paired with a `meta.values` map describing how to revive them. We
// implement the two cases the request surface uses (observed in production
// HAR captures): Date (pickupTime, pickupEndTime) and undefined (procedures
// called with no input, optional fields sent explicitly). Inputs without any
// special values keep the legacy `{ json }` shape so unchanged calls stay
// byte-identical.
function encodeSuperJson<T>(input: T): SuperJsonEnvelope<T> {
  if (input === undefined) {
    // Root-level undefined uses the array form of `values`, exactly as the
    // commande.app web client sends it: {"json":null,"meta":{"values":["undefined"],"v":1}}
    return { json: null as T, meta: { values: ['undefined'], v: 1 } };
  }

  const values: Record<string, [string]> = {};

  function walk(value: unknown, path: string): unknown {
    if (value instanceof Date) {
      values[path] = ['Date'];
      return value.toISOString();
    }
    if (value === undefined && path !== '') {
      values[path] = ['undefined'];
      return null;
    }
    if (Array.isArray(value)) {
      return value.map((item, i) => walk(item, path === '' ? String(i) : `${path}.${i}`));
    }
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = walk(v, path === '' ? k : `${path}.${k}`);
      }
      return result;
    }
    return value;
  }

  const json = walk(input, '') as T;
  if (Object.keys(values).length === 0) {
    return { json };
  }
  return { json, meta: { values, v: 1 } };
}

export function encodeInput<T>(input: T): TrpcRequestBody<T> {
  return { 0: encodeSuperJson(input) };
}

export function encodeInputParam<T>(input: T): string {
  return encodeURIComponent(JSON.stringify(encodeInput(input)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function unwrapResponse(payload: unknown): unknown {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new ValidationError('Expected non-empty tRPC batch array response');
  }
  const first = payload[0];
  if (!isRecord(first)) {
    throw new ValidationError('Expected tRPC batch entry to be an object');
  }
  if ('error' in first) {
    throw new ValidationError('Cannot unwrap an error envelope as success');
  }
  const result = first.result;
  if (!isRecord(result)) {
    throw new ValidationError('Missing tRPC result field');
  }
  const data = result.data;
  if (!isRecord(data)) {
    throw new ValidationError('Missing tRPC result.data field');
  }
  if (!('json' in data)) {
    throw new ValidationError('Missing tRPC result.data.json field');
  }
  return data.json;
}

export type TrpcErrorShape = {
  readonly message: string;
  readonly code?: string | number;
  readonly data?: {
    readonly code?: string;
    readonly httpStatus?: number;
    readonly [key: string]: unknown;
  };
};

function toTrpcErrorData(value: unknown): TrpcErrorShape['data'] {
  if (!isRecord(value)) return undefined;
  const code = typeof value.code === 'string' ? value.code : undefined;
  const httpStatus = typeof value.httpStatus === 'number' ? value.httpStatus : undefined;
  const out: Record<string, unknown> = { ...value };
  if (code !== undefined) out.code = code;
  if (httpStatus !== undefined) out.httpStatus = httpStatus;
  return out;
}

export function extractError(payload: unknown): TrpcErrorShape | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const first = payload[0];
  if (!isRecord(first)) return null;
  if (!('error' in first)) return null;
  if (!isRecord(first.error)) return null;
  // With the superjson transformer the error body is nested one level deeper:
  // [{"error":{"json":{"message":…,"code":-32600,"data":{"code":"BAD_REQUEST",…}}}}]
  // Older/plain envelopes put the fields directly on `error`; accept both.
  const err = isRecord(first.error.json) ? first.error.json : first.error;
  const message = typeof err.message === 'string' ? err.message : 'Unknown tRPC error';
  const code =
    typeof err.code === 'string' || typeof err.code === 'number' ? err.code : undefined;
  return { message, code, data: toTrpcErrorData(err.data) };
}
