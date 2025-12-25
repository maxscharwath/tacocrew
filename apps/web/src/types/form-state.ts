/**
 * Form state mode and state types
 * Represents current state/mode of the form
 */

import type { OrderItemId } from '@/lib/types/branded';
import type { OrderFormData } from './form-data';
import type { FormError } from './form-error';

export type OrderFormMode = 'empty' | 'editing' | 'loading' | 'submitted' | 'error';

export type OrderFormState =
  | {
      mode: 'empty';
      data: OrderFormData;
      editingOrderId: null;
    }
  | {
      mode: 'editing';
      data: OrderFormData;
      editingOrderId: OrderItemId;
      originalData: OrderFormData;
    }
  | {
      mode: 'loading';
      data: OrderFormData;
      editingOrderId: OrderItemId | null;
    }
  | {
      mode: 'submitted';
      data: OrderFormData;
      editingOrderId: OrderItemId | null;
    }
  | {
      mode: 'error';
      data: OrderFormData;
      editingOrderId: OrderItemId | null;
      error: FormError;
    };

/**
 * Type guards for form state
 */
export function isFormInMode<T extends OrderFormMode>(
  state: OrderFormState,
  mode: T
): state is Extract<OrderFormState, { mode: T }> {
  return state.mode === mode;
}

/**
 * Check if form can be edited
 */
export function isFormEditable(state: OrderFormState): boolean {
  return state.mode === 'empty' || state.mode === 'editing' || state.mode === 'error';
}

/**
 * Check if form can be submitted
 */
export function canSubmitForm(state: OrderFormState): boolean {
  const editable = isFormEditable(state);
  const hasTaco = state.data.taco !== null;
  const hasExtras =
    state.data.extras.length > 0 || state.data.drinks.length > 0 || state.data.desserts.length > 0;

  return editable && (hasTaco || hasExtras);
}
