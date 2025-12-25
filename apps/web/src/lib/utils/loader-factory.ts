import type { LoaderFunctionArgs } from 'react-router';
import { defer } from './defer';
import { withAuthErrorHandling } from './loader-helpers';

type LoaderHandler<T> = (args: LoaderFunctionArgs) => Promise<T>;

export function createLoader<T extends Record<string, unknown>>(
  handler: LoaderHandler<T>
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async (args: LoaderFunctionArgs): Promise<Response> => {
    const data = await withAuthErrorHandling(() => handler(args), args.request);
    return Response.json(data);
  };
}

export function createDeferredLoader<T extends Record<string, unknown>>(handler: LoaderHandler<T>) {
  return (args: LoaderFunctionArgs) => {
    const data = withAuthErrorHandling(() => handler(args), args.request);
    return defer({ data });
  };
}
