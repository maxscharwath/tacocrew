import { passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { ENV } from './env';

export const authClient = createAuthClient({
  baseURL: ENV.apiBaseUrl,
  fetchOptions: {
    credentials: 'include', // Always include cookies for cross-origin requests
  },
  plugins: [
    passkeyClient(), // Enable passkey authentication
  ],
});

// Export the useSession hook for components
export const { useSession } = authClient;
