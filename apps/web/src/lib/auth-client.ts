import { createAuthClient } from 'better-auth/client';
import { passkeyClient } from 'better-auth/client/plugins';
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
