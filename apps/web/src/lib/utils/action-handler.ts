import type { ActionFunctionArgs } from 'react-router';
import { redirect } from 'react-router';
import { ApiError } from '@/lib/api/http';

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
 * Check if error body contains ZodError
 */
function isZodErrorBody(errorBody: unknown): errorBody is {
  error: { name: string; issues: unknown[] };
} {
  return (
    Boolean(errorBody) &&
    typeof errorBody === 'object' &&
    errorBody !== null &&
    'error' in errorBody &&
    typeof errorBody.error === 'object' &&
    errorBody.error !== null &&
    'name' in errorBody.error &&
    errorBody.error.name === 'ZodError' &&
    'issues' in errorBody.error &&
    Array.isArray(errorBody.error.issues)
  );
}

/**
 * Process ZodError issues into field errors and messages
 */
function processZodIssues(issues: unknown[]): {
  fieldErrors: Record<string, string>;
  messages: string[];
} {
  const fieldErrors: Record<string, string> = {};
  const messages: string[] = [];

  for (const issue of issues) {
    if (typeof issue !== 'object' || issue === null || !('path' in issue) || !('message' in issue)) {
      continue;
    }

    const path = Array.isArray(issue.path)
      ? issue.path.filter((p: unknown) => typeof p === 'string').join('.')
      : '';

    if (path && !fieldErrors[path] && typeof issue.message === 'string') {
      fieldErrors[path] = issue.message;
    } else if (!path && typeof issue.message === 'string') {
      messages.push(issue.message);
    }
  }

  return { fieldErrors, messages };
}

/**
 * Build user-friendly validation message
 */
function buildValidationMessage(
  fieldErrors: Record<string, string>,
  messages: string[]
): string {
  if (Object.keys(fieldErrors).length > 0) {
    return `Validation failed: ${Object.entries(fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join(', ')}`;
  }
  if (messages.length > 0) {
    return messages.join(', ');
  }
  return 'Validation failed. Please check your input.';
}

/**
 * Parse ZodError from API response
 */
function parseZodError(errorBody: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} | null {
  if (!isZodErrorBody(errorBody)) {
    return null;
  }

  const { fieldErrors, messages } = processZodIssues(errorBody.error.issues);
  const message = buildValidationMessage(fieldErrors, messages);

  return { message, fieldErrors };
}

/**
 * Extract error message from API error body
 */
function extractApiErrorMessage(body: unknown, defaultMessage: string): string {
  if (typeof body !== 'object' || !body || !('error' in body)) {
    return defaultMessage;
  }

  const errorObj = body.error;
  if (
    typeof errorObj === 'object' &&
    errorObj &&
    'message' in errorObj &&
    typeof errorObj.message === 'string'
  ) {
    return errorObj.message;
  }

  return defaultMessage;
}

/**
 * Handle ApiError response
 */
function handleApiError(error: ApiError, form: string): Response {
  // Try to parse ZodError first
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

  // Fall back to standard error message
  const errorMessage = extractApiErrorMessage(error.body, error.message);
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

/**
 * Handle errors consistently across all actions
 */
function handleActionError(error: unknown, form: string): Response {
  if (error instanceof ApiError) {
    return handleApiError(error, form);
  }

  if (error instanceof Response) {
    return error;
  }

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
