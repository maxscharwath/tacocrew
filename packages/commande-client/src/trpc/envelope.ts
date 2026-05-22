import { ValidationError } from '../errors';

type SuperJsonMeta = {
  readonly values: Readonly<Record<string, readonly [string]>>;
};

type SuperJsonEnvelope<T> = {
  readonly json: T;
  readonly meta?: SuperJsonMeta;
};

export type TrpcRequestBody<T> = Readonly<Record<'0', SuperJsonEnvelope<T>>>;

// commande.app's tRPC server is configured with the superjson transformer, so
// non-JSON-native values (Date, undefined, …) must travel as plain JSON in
// `json` paired with a `meta.values` map describing how to revive them. We
// only implement the Date case — that's the only special type the request
// surface uses today (pickupTime, pickupEndTime). Inputs without any special
// values keep the legacy `{ json }` shape so unchanged calls stay byte-identical.
function encodeSuperJson<T>(input: T): SuperJsonEnvelope<T> {
  const values: Record<string, [string]> = {};

  function walk(value: unknown, path: string): unknown {
    if (value instanceof Date) {
      values[path] = ['Date'];
      return value.toISOString();
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
  return { json, meta: { values } };
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
  readonly code?: string;
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
  const err = first.error;
  if (!isRecord(err)) return null;
  const message = typeof err.message === 'string' ? err.message : 'Unknown tRPC error';
  const code = typeof err.code === 'string' ? err.code : undefined;
  return { message, code, data: toTrpcErrorData(err.data) };
}
