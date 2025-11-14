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

const HTTP_STATUS = {
  METHOD_NOT_ALLOWED: 405,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const ERROR_KEYS = {
  UNSUPPORTED_METHOD: 'errors.unsupportedMethod',
  VALIDATION_FAILED: 'errors.validation.failed',
  UNEXPECTED_GENERIC: 'errors.unexpected.generic',
} as const;

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
      const handlerResult = await executeHandler(method, config, request, params, form);
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
 * Execute the appropriate handler based on HTTP method
 */
async function executeHandler(
  method: string,
  config: ActionConfig,
  request: Request,
  params: ActionFunctionArgs['params'],
  form: string
): Promise<void | Response | undefined> {
  const unsupportedMethodResponse = () =>
    Response.json(
      { form, errorKey: ERROR_KEYS.UNSUPPORTED_METHOD },
      {
        status: HTTP_STATUS.METHOD_NOT_ALLOWED,
      }
    );

  switch (method) {
    case 'POST': {
      if (!config.handlers.POST) {
        return unsupportedMethodResponse();
      }
      const formData = await request.clone().formData();
      return await config.handlers.POST({ formData }, request, params);
    }
    case 'DELETE': {
      if (!config.handlers.DELETE) {
        return unsupportedMethodResponse();
      }
      return await config.handlers.DELETE(undefined, request, params);
    }
    case 'PATCH': {
      if (!config.handlers.PATCH) {
        return unsupportedMethodResponse();
      }
      return await config.handlers.PATCH(undefined, request, params);
    }
    case 'PUT': {
      if (!config.handlers.PUT) {
        return unsupportedMethodResponse();
      }
      return await config.handlers.PUT(undefined, request, params);
    }
    case 'GET': {
      if (!config.handlers.GET) {
        return unsupportedMethodResponse();
      }
      return await config.handlers.GET(undefined, request, params);
    }
    default:
      return unsupportedMethodResponse();
  }
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
          errorKey: ERROR_KEYS.VALIDATION_FAILED,
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
        errorKey: ERROR_KEYS.VALIDATION_FAILED,
        errorMessage: error.message,
      },
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  return Response.json(
    {
      form,
      errorKey: ERROR_KEYS.UNEXPECTED_GENERIC,
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}
