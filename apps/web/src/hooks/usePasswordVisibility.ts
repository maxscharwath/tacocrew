/**
 * Password visibility toggle hook
 * Manages show/hide password state
 */

import { useState } from 'react';

interface UsePasswordVisibilityState {
  showPassword: boolean;
  togglePasswordVisibility: () => void;
}

/**
 * Manage password field visibility
 */
export function usePasswordVisibility(): UsePasswordVisibilityState {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return {
    showPassword,
    togglePasswordVisibility,
  };
}
