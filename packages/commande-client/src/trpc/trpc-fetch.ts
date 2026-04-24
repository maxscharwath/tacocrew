import { NetworkError, ValidationError } from '../errors';
import type { Logger } from '../types';
import { encodeInput, encodeInputParam, extractError, unwrapResponse } from './envelope';
import { mapTrpcError } from './errors';

export type TrpcFetcherOptions = {
  readonly baseUrl: string;
  readonly logger: Logger;
  readonly fetchImpl?: typeof fetch;
  readonly defaultHeaders?: Readonly<Record<string, string>>;
};

export type TrpcCallOptions = {
  readonly signal?: AbortSignal;
};

const MAX_BODY_EXCERPT_LENGTH = 512;

function truncate(body: string): string {
  if (body.length <= MAX_BODY_EXCERPT_LENGTH) return body;
  return `${body.slice(0, MAX_BODY_EXCERPT_LENGTH)}…[truncated]`;
}

function buildUrl(baseUrl: string, procedure: string, query?: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  const qs = query ? `&${query}` : '';
  return `${trimmed}/api/trpc/${procedure}?batch=1${qs}`;
}

export class TrpcFetcher {
  private readonly baseUrl: string;
  private readonly logger: Logger;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: Readonly<Record<string, string>>;

  constructor(options: TrpcFetcherOptions) {
    this.baseUrl = options.baseUrl;
    this.logger = options.logger;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async query<TInput = unknown>(
    procedure: string,
    input: TInput,
    opts: TrpcCallOptions = {}
  ): Promise<unknown> {
    const encoded = encodeInputParam(input);
    const url = buildUrl(this.baseUrl, procedure, `input=${encoded}`);
    this.logger.debug('trpc.query', { procedure, url });
    return this.execute(procedure, url, {
      method: 'GET',
      signal: opts.signal,
    });
  }

  async mutation<TInput = unknown>(
    procedure: string,
    input: TInput,
    opts: TrpcCallOptions = {}
  ): Promise<unknown> {
    const url = buildUrl(this.baseUrl, procedure);
    const body = JSON.stringify(encodeInput(input));
    this.logger.debug('trpc.mutation', { procedure, url });
    return this.execute(procedure, url, {
      method: 'POST',
      body,
      signal: opts.signal,
      extraHeaders: { 'content-type': 'application/json' },
    });
  }

  private async execute(
    procedure: string,
    url: string,
    init: {
      readonly method: 'GET' | 'POST';
      readonly body?: string;
      readonly signal?: AbortSignal;
      readonly extraHeaders?: Readonly<Record<string, string>>;
    }
  ): Promise<unknown> {
    const headers: Record<string, string> = {
      accept: '*/*',
      'x-trpc-source': 'nextjs-react',
      ...this.defaultHeaders,
      ...(init.extraHeaders ?? {}),
    };

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        method: init.method,
        body: init.body,
        headers,
        signal: init.signal,
      });
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        throw cause;
      }
      throw new NetworkError(
        `Network request failed for ${procedure}: ${cause instanceof Error ? cause.message : String(cause)}`,
        { cause }
      );
    }

    const text = await response.text();
    this.logger.debug('trpc.response', {
      procedure,
      status: response.status,
      bytes: text.length,
    });

    let parsed: unknown;
    try {
      parsed = text.length > 0 ? JSON.parse(text) : null;
    } catch (cause) {
      throw new ValidationError(`Invalid JSON from ${procedure}`, {
        cause,
        bodyExcerpt: truncate(text),
      });
    }

    const errShape = extractError(parsed);
    if (errShape) {
      throw mapTrpcError(errShape, truncate(text));
    }

    if (!response.ok) {
      throw new NetworkError(
        `HTTP ${response.status} from ${procedure}`,
        { bodyExcerpt: truncate(text) }
      );
    }

    try {
      return unwrapResponse(parsed);
    } catch (cause) {
      if (cause instanceof ValidationError) {
        throw new ValidationError(cause.message, {
          cause,
          bodyExcerpt: truncate(text),
        });
      }
      throw cause;
    }
  }
}
