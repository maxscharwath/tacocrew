import { type LoaderFunctionArgs, redirect } from 'react-router';
import { OrdersApi } from '../lib/api';
import { ApiError } from '../lib/api/http';
import { authClient } from '../lib/auth-client';
import { routes } from '../lib/routes';

export async function joinCodeLoader({ params }: LoaderFunctionArgs) {
  const code = params.code;
  if (!code) {
    throw new Response('Invalid code', { status: 400 });
  }

  try {
    // Look up group order by share code
    const groupOrder = await OrdersApi.getGroupOrderByShareCode(code);
    const session = await authClient.getSession();
    const isAuthenticated = !!session?.data?.user;

    // Redirect directly to create page if authenticated and order can accept orders
    // Otherwise redirect to order detail page
    if (isAuthenticated && groupOrder.canAcceptOrders) {
      return redirect(routes.root.orderCreate({ orderId: groupOrder.id }));
    }

    return redirect(routes.root.orderDetail({ orderId: groupOrder.id }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Response('Order not found', { status: 404 });
    }
    throw error;
  }
}

export function JoinCodeRoute() {
  // This route only redirects, so we should never render this
  return null;
}
