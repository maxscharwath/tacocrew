/**
 * Form validation types
 * Represents validation state and messages
 */

import type { FormField } from './form-error';

export interface ValidationResult {
  isValid: boolean;
  messages: ValidationMessage[];
}

export interface ValidationMessage {
  field: FormField;
  messageKey: string;
  severity: 'error' | 'warning';
  params?: Record<string, unknown>;
}

export interface ValidationRules {
  maxMeats?: number;
  maxSauces?: number;
  allowGarnitures: boolean;
  hasOtherItems: boolean;
  hasTaco: boolean;
}

/**
 * Progress step for visual feedback
 */
export interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}
