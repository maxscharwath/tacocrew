import { getProfile } from '@/lib/api/user';
import {
  getIntentFromFormData,
  processRootActionIntent,
} from '@/lib/handlers/root-action-handlers';
import { createActionHandler } from '@/lib/utils/action-handler';
import { createRootLoader } from '@/lib/utils/root-loader-utils';

export type RootLoaderData = {
  profile: Awaited<ReturnType<typeof getProfile>> | null;
};

/**
 * Root loader validates authentication by fetching the profile.
 * If profile fetch fails with 401, user is redirected to login.
 */
export const rootLoader = createRootLoader();

export const rootAction = createActionHandler({
  handlers: {
    POST: async ({ formData }) => {
      const intent = getIntentFromFormData(formData);
      return await processRootActionIntent(intent);
    },
  },
  getFormName: async (_method, request) => {
    const formData = await request.clone().formData();
    return getIntentFromFormData(formData);
  },
  onSuccess: () => {
    // Should not reach here for logout (throws redirect)
    return new Response(null, { status: 204 });
  },
});
