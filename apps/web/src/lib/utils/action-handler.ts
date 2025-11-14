import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { ApiError } from '../api/http';

type ActionHandler<T = void> = (
  params: T,
  request: Request,
  routeParams: ActionFunctionArgs['params']
) => Promise<void> | void | Response | Promise<Response>;

type ActionHandlers = {
  POST?: ActionHandler<{ formData: FormData }>;
  DELETE?: ActionHandler<void>;
  PATCH?: ActionHandler<void>;
  PUT?: ActionHandler<void>;
  GET?: ActionHandler<void>;
};

type ActionConfig = {
  handlers: ActionHandlers;
  onSuccess?: (
    request: Request,
    params: ActionFunctionArgs['params']
  ) => Response | Promise<Response>;
  getFormName?: (method: string, request: Request) => string | Promise<string>;
};

/**
 * Generic action handler that routes by HTTP method and handles errors consistently
 */
export function createActionHandler(
  config: ActionConfig
): (args: ActionFunctionArgs) => Promise<Response> {
  return async ({ request, params }: ActionFunctionArgs): Promise<Response> => {
    const { getMethod } = await import('./form-data');
    const method = await getMethod(request);
    const form = (await config.getFormName?.(method, request)) || 'unknown';

    try {
      let handler: ActionHandler<{ formData: FormData }> | ActionHandler<void> | undefined;
      if (method === 'POST') {
        handler = config.handlers.POST;
      } else if (method === 'DELETE') {
        handler = config.handlers.DELETE;
      } else if (method === 'PATCH') {
        handler = config.handlers.PATCH;
      } else if (method === 'PUT') {
        handler = config.handlers.PUT;
      } else if (method === 'GET') {
        handler = config.handlers.GET;
      }

      if (!handler) {
        return Response.json({ form, errorKey: 'errors.unsupportedMethod' }, { status: 405 });
      }

      // For POST, pass formData to help distinguish between different POST actions
      let handlerResult: void | Response | undefined;
      if (method === 'POST') {
        const formData = await request.clone().formData();
        if (config.handlers.POST) {
          handlerResult = await config.handlers.POST({ formData }, request, params);
        }
      } else if (method === 'DELETE' && config.handlers.DELETE) {
        handlerResult = await config.handlers.DELETE(undefined, request, params);
      } else if (method === 'PATCH' && config.handlers.PATCH) {
        handlerResult = await config.handlers.PATCH(undefined, request, params);
      } else if (method === 'PUT' && config.handlers.PUT) {
        handlerResult = await config.handlers.PUT(undefined, request, params);
      } else if (method === 'GET' && config.handlers.GET) {
        handlerResult = await config.handlers.GET(undefined, request, params);
      }

      // If handler returns a Response, use it (for redirects, etc.)
      if (handlerResult instanceof Response) {
        return handlerResult;
      }

      // Call success handler or default redirect
      if (config.onSuccess) {
        return await config.onSuccess(request, params);
      }

      // Default: redirect to current route (should be overridden)
      return redirect(request.url);
    } catch (error) {
      return handleActionError(error, form);
    }
  };
}

/**
 * Parse ZodError from API response
 */
function parseZodError(errorBody: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} | null {
  if (!errorBody || typeof errorBody !== 'object') {
    return null;
  }

  // Check if it's a ZodError response from the API
  if (!('error' in errorBody) || typeof errorBody.error !== 'object' || errorBody.error === null) {
    return null;
  }

  const error = errorBody.error;
  if (
    !('name' in error) ||
    error.name !== 'ZodError' ||
    !('issues' in error) ||
    !Array.isArray(error.issues)
  ) {
    return null;
  }

  const issues = error.issues;

  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const issue of issues) {
    if (
      typeof issue !== 'object' ||
      issue === null ||
      !('path' in issue) ||
      !('message' in issue)
    ) {
      continue;
    }
    const path = Array.isArray(issue.path)
      ? issue.path.filter((p: unknown) => typeof p === 'string').join('.')
      : '';
    if (path) {
      // Use the first error for each field
      if (!fieldErrors[path] && typeof issue.message === 'string') {
        fieldErrors[path] = issue.message;
      }
    } else if (typeof issue.message === 'string') {
      messages.push(issue.message);
    }
  }

  // Build a user-friendly message
  const message =
    Object.keys(fieldErrors).length > 0
      ? `Validation failed: ${Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join(', ')}`
      : messages.length > 0
        ? messages.join(', ')
        : 'Validation failed. Please check your input.';

  return { message, fieldErrors };
}

/**
 * Handle errors consistently across all actions
 */
function handleActionError(error: unknown, form: string): Response {
  if (error instanceof ApiError) {
    // Try to parse ZodError from the API response
    const zodError = parseZodError(error.body);
    if (zodError) {
      return Response.json(
        {
          form,
          errorKey: 'errors.validation.failed',
          errorMessage: zodError.message,
          fieldErrors: zodError.fieldErrors,
        },
        { status: error.status }
      );
    }

    // Fall back to standard error message extraction
    let errorMessage = error.message;
    if (typeof error.body === 'object' && error.body && 'error' in error.body) {
      const errorObj = error.body.error;
      if (
        typeof errorObj === 'object' &&
        errorObj &&
        'message' in errorObj &&
        typeof errorObj.message === 'string'
      ) {
        errorMessage = errorObj.message;
      }
    }

    return Response.json(
      {
        form,
        errorKey: error.key,
        errorMessage,
        errorDetails: error.details,
      },
      { status: error.status }
    );
  }

  // Handle Response errors (from throw new Response(...))
  if (error instanceof Response) {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return Response.json(
      {
        form,
        errorKey: 'errors.validation.failed',
        errorMessage: error.message,
      },
      { status: 400 }
    );
  }

  return Response.json(
    {
      form,
      errorKey: 'errors.unexpected.generic',
    },
    { status: 500 }
  );
}
