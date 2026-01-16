/**
 * Order form UI state management
 * Handles UI-specific state like loading, errors, validation messages
 * Separate from actual form data
 */

import { useState } from 'react';
import type { StockResponse } from '@/lib/api';
import type { OrderFormData } from '@/types/form-data';
import type { ProgressStep, ValidationMessage, ValidationResult } from '@/types/form-validation';
import type { TacoSizeItem } from '@/types/orders';

export interface OrderFormUIState {
  validationResult: ValidationResult;
  progressSteps: ProgressStep[];
  isSubmitting: boolean;
  submitError: string | null;
  isDuplicating: boolean;
  prefillMode: 'edit' | 'duplicate' | null;
}

/**
 * Hook for managing order form UI state
 */
export function useOrderFormUI(
  formData: OrderFormData | null,
  _stock: StockResponse | null,
  selectedTacoSize: TacoSizeItem | null
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculate validation
  const validationResult = calculateValidation(formData, selectedTacoSize);

  // Calculate progress steps
  const progressSteps = calculateProgressSteps(formData, selectedTacoSize);

  return {
    validationResult,
    progressSteps,
    isSubmitting,
    setIsSubmitting,
    submitError,
    setSubmitError,
  };
}

/**
 * Calculate validation state
 */
function calculateValidation(
  formData: OrderFormData | null,
  selectedTacoSize: TacoSizeItem | null
): ValidationResult {
  const messages: ValidationMessage[] = [];

  if (!formData) {
    return { isValid: false, messages };
  }

  const hasTaco = formData.taco !== null;
  const hasOtherItems =
    formData.extras.length > 0 || formData.drinks.length > 0 || formData.desserts.length > 0;

  if (!hasTaco && !hasOtherItems) {
    messages.push({
      field: 'general',
      messageKey: 'orders.create.validation.missingSelection',
      severity: 'error',
    });
  }

  if (formData.taco) {
    if (!selectedTacoSize?.allowGarnitures && formData.taco.garnitures.length > 0) {
      messages.push({
        field: 'garnitures',
        messageKey: 'orders.create.validation.garnishNotAvailable',
        severity: 'error',
      });
    }

    if (formData.taco.meats.length === 0 && formData.taco.kind === 'regular') {
      messages.push({
        field: 'meats',
        messageKey: 'orders.create.validation.selectMeats',
        severity: 'warning',
      });
    }

    if (formData.taco.sauces.length === 0 && formData.taco.kind === 'regular') {
      messages.push({
        field: 'sauces',
        messageKey: 'orders.create.validation.selectSauces',
        severity: 'warning',
      });
    }
  }

  return {
    isValid: messages.every((m) => m.severity !== 'error'),
    messages,
  };
}

/**
 * Calculate progress steps for visual feedback
 */
function calculateProgressSteps(
  formData: OrderFormData | null,
  selectedTacoSize: TacoSizeItem | null
): ProgressStep[] {
  if (!formData) {
    return [];
  }

  const steps: ProgressStep[] = [];

  // Size step
  steps.push({
    id: 'size',
    label: 'Size',
    completed: formData.taco !== null,
    current: formData.taco === null,
  });

  if (formData.taco) {
    const totalMeatQuantity = formData.taco.meats.reduce((sum, m) => sum + m.quantity, 0);

    // Meats step
    steps.push({
      id: 'meats',
      label: 'Meats',
      completed: totalMeatQuantity > 0,
      current: totalMeatQuantity === 0,
    });

    // Sauces step
    steps.push({
      id: 'sauces',
      label: 'Sauces',
      completed: formData.taco.sauces.length > 0,
      current: formData.taco.sauces.length === 0,
    });

    // Garnitures step (if allowed)
    if (selectedTacoSize?.allowGarnitures) {
      steps.push({
        id: 'garnitures',
        label: 'Garnitures',
        completed: formData.taco.garnitures.length > 0,
        current: formData.taco.garnitures.length === 0,
      });
    }
  }

  // Extras step
  steps.push({
    id: 'extras',
    label: 'Extras',
    completed: formData.extras.length > 0,
    current: false,
  });

  return steps;
}

/**
 * Get validation messages for a specific field
 */
export function getFieldValidationMessages(
  validationResult: ValidationResult,
  field: string
): ValidationMessage[] {
  return validationResult.messages.filter((m) => m.field === field);
}

/**
 * Check if form has any validation errors
 */
export function hasValidationErrors(validationResult: ValidationResult): boolean {
  return validationResult.messages.some((m) => m.severity === 'error');
}
