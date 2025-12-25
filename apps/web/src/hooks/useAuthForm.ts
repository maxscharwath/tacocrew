/**
 * Authentication form management hook
 * Initializes and manages auth form configuration
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { LoginFormData, SignupFormData } from '@/lib/schemas';
import { getDefaultFormValues, getFormSchema } from '@/lib/utils/auth-helpers';

interface UseAuthFormState {
  form: ReturnType<typeof useForm<SignupFormData | LoginFormData>>;
  isSignUp: boolean;
}

/**
 * Initialize and manage authentication form with dynamic schema
 */
export function useAuthForm(isSignUp: boolean): UseAuthFormState {
  const schema = getFormSchema(isSignUp);
  const defaultValues = getDefaultFormValues(isSignUp);

  const form = useForm<SignupFormData | LoginFormData>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  return {
    form,
    isSignUp,
  };
}
