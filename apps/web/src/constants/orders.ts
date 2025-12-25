/**
 * Order-related constants
 * Centralized source of truth for magic strings and numbers
 */

export const FORM_FIELD_NAMES = {
  TACO_SIZE: 'tacoSize',
  KIND: 'kind',
  EDIT_ORDER_ID: 'editOrderId',
  MEATS: 'meats',
  SAUCES: 'sauces',
  GARNITURES: 'garnitures',
  EXTRAS: 'extras',
  DRINKS: 'drinks',
  DESSERTS: 'desserts',
  NOTE: 'note',
  MEAT_QUANTITY: (id: string) => `meat_quantity_${id}`,
} as const;

export const FORM_MODES = {
  EMPTY: 'empty',
  EDITING: 'editing',
  LOADING: 'loading',
  SUBMITTED: 'submitted',
  ERROR: 'error',
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SUBMISSION_ERROR: 'SUBMISSION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export const VALIDATION_MESSAGES = {
  MISSING_SELECTION: 'orders.create.validation.missingSelection',
  GARNISH_NOT_AVAILABLE: 'orders.create.validation.garnishNotAvailable',
  INVALID_TACO_SIZE: 'orders.create.validation.invalidTacoSize',
  OUT_OF_STOCK: 'orders.create.validation.outOfStock',
} as const;

export const API_ENDPOINTS = {
  ORDERS: '/api/v1/orders',
  ORDER_ITEMS: (orderId: string) => `/api/v1/orders/${orderId}/items`,
  USER_ORDER: (orderId: string, itemId: string) => `/api/v1/orders/${orderId}/items/${itemId}`,
} as const;

export const ANIMATION_DURATIONS = {
  REVEAL: 500,
  TRANSITION: 300,
  FADE: 200,
} as const;

export const UI_LIMITS = {
  MIN_ITEMS_FOR_SUMMARY: 1,
  MAX_VISIBLE_PREVIOUS_ORDERS: 5,
  BADGE_COUNT_THRESHOLD: 99,
} as const;
