/**
 * Order domain errors
 * Structured error types for order operations
 */

export enum OrderErrorCode {
  // Not found errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  GROUP_ORDER_NOT_FOUND = 'GROUP_ORDER_NOT_FOUND',
  USER_ORDER_NOT_FOUND = 'USER_ORDER_NOT_FOUND',

  // Data loading errors
  STOCK_LOAD_FAILED = 'STOCK_LOAD_FAILED',
  ORDERS_LOAD_FAILED = 'ORDERS_LOAD_FAILED',
  GROUP_LOAD_FAILED = 'GROUP_LOAD_FAILED',

  // Validation errors
  INVALID_ORDER_DATA = 'INVALID_ORDER_DATA',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',
  INVALID_SELECTION = 'INVALID_SELECTION',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  SERVER_ERROR = 'SERVER_ERROR',

  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface OrderError {
  code: OrderErrorCode;
  message: string;
  context?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Factory for creating structured order errors
 */
export const OrderErrorFactory = {
  notFound: (resource: string, id: string): OrderError => ({
    code: OrderErrorCode.ORDER_NOT_FOUND,
    message: `${resource} not found: ${id}`,
    context: { resource, id },
  }),

  groupNotFound: (id: string): OrderError => ({
    code: OrderErrorCode.GROUP_ORDER_NOT_FOUND,
    message: `Group order not found: ${id}`,
    context: { groupOrderId: id },
  }),

  userOrderNotFound: (id: string): OrderError => ({
    code: OrderErrorCode.USER_ORDER_NOT_FOUND,
    message: `User order not found: ${id}`,
    context: { userOrderId: id },
  }),

  stockLoadFailed: (originalError: Error): OrderError => ({
    code: OrderErrorCode.STOCK_LOAD_FAILED,
    message: 'Failed to load stock data',
    originalError,
  }),

  ordersLoadFailed: (originalError: Error): OrderError => ({
    code: OrderErrorCode.ORDERS_LOAD_FAILED,
    message: 'Failed to load orders',
    originalError,
  }),

  groupLoadFailed: (originalError: Error): OrderError => ({
    code: OrderErrorCode.GROUP_LOAD_FAILED,
    message: 'Failed to load group order',
    originalError,
  }),

  networkError: (originalError: Error): OrderError => ({
    code: OrderErrorCode.NETWORK_ERROR,
    message: `Network error: ${originalError.message}`,
    originalError,
  }),

  serverError: (status: number, originalError?: Error): OrderError => ({
    code: OrderErrorCode.SERVER_ERROR,
    message: `Server error (${status})`,
    context: { status },
    originalError,
  }),

  validationError: (message: string, context?: Record<string, unknown>): OrderError => ({
    code: OrderErrorCode.INVALID_ORDER_DATA,
    message,
    context,
  }),

  unknown: (originalError: Error): OrderError => ({
    code: OrderErrorCode.UNKNOWN_ERROR,
    message: `Unknown error: ${originalError.message}`,
    originalError,
  }),
};
