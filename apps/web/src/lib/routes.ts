import { z } from 'zod';
import { HydrateFallback } from '@/components/hydrate-fallback';
import {
  DashboardSkeleton,
  OrderCreateSkeleton,
  OrderDetailSkeleton,
  OrdersSkeleton,
  ProfileSkeleton,
  StockSkeleton,
} from '@/components/skeletons';
import { DashboardRoute, dashboardLoader } from '@/routes/dashboard';
import { authenticationLoader, LoginRoute } from '@/routes/login';
import { orderCreateAction, orderCreateLoader } from '@/routes/orders.create';
import { orderDetailAction, orderDetailLoader } from '@/routes/orders.detail';
import { OrdersRoute, ordersAction, ordersLoader } from '@/routes/orders.list';
import { orderSubmitAction, orderSubmitLoader } from '@/routes/orders.submit';
import { profileLoader } from '@/routes/profile';
import { accountLoader } from '@/routes/profile.account';
import { profileDeliveryLoader } from '@/routes/profile.delivery';
import { RootErrorBoundary, RootLayout } from '@/routes/root';
import { rootAction, rootLoader } from '@/routes/root.loader';
import { StockRoute, stockLoader } from '@/routes/stock';
import { defineRoutes } from './routes/core';

const orderParams = z.object({ orderId: z.string().min(1) });
const loginSearch = z.object({ redirect: z.string().optional() });
const orderCreateSearch = z.object({
  orderId: z.string().optional(),
  duplicate: z.string().optional(),
});

export const { routes, routerConfig } = defineRoutes({
  signin: {
    path: '/signin',
    search: loginSearch,
    loader: authenticationLoader,
    element: LoginRoute,
    errorElement: RootErrorBoundary,
    hydrateFallback: HydrateFallback,
  },
  signup: {
    path: '/signup',
    search: loginSearch,
    loader: authenticationLoader,
    element: LoginRoute,
    errorElement: RootErrorBoundary,
    hydrateFallback: HydrateFallback,
  },
  root: {
    path: '/',
    loader: rootLoader,
    action: rootAction,
    element: RootLayout,
    errorElement: RootErrorBoundary,
    hydrateFallback: HydrateFallback,
    children: {
      dashboard: {
        index: true,
        element: DashboardRoute,
        loader: dashboardLoader,
        hydrateFallback: DashboardSkeleton,
      },
      orders: {
        path: 'orders',
        element: OrdersRoute,
        loader: ordersLoader,
        action: ordersAction,
        hydrateFallback: OrdersSkeleton,
      },
      orderDetail: {
        path: 'orders/:orderId',
        params: orderParams,
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/orders.detail').then((module) => ({
              default: module.OrderDetailRoute,
            })),
          fallback: OrderDetailSkeleton,
        },
        loader: orderDetailLoader,
        action: orderDetailAction,
        errorElement: RootErrorBoundary,
        hydrateFallback: OrderDetailSkeleton,
      },
      orderCreate: {
        path: 'orders/:orderId/create',
        params: orderParams,
        search: orderCreateSearch,
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/orders.create').then((module) => ({
              default: module.OrderCreateRoute,
            })),
          fallback: OrderCreateSkeleton,
        },
        loader: orderCreateLoader,
        action: orderCreateAction,
        hydrateFallback: OrderCreateSkeleton,
      },
      orderSubmit: {
        path: 'orders/:orderId/submit',
        params: orderParams,
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/orders.submit').then((module) => ({
              default: module.OrderSubmitRoute,
            })),
          fallback: OrderDetailSkeleton,
        },
        loader: orderSubmitLoader,
        action: orderSubmitAction,
        hydrateFallback: OrderDetailSkeleton,
      },
      stock: {
        path: 'stock',
        element: StockRoute,
        loader: stockLoader,
        hydrateFallback: StockSkeleton,
      },
      profile: {
        path: 'profile',
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/profile').then((module) => ({
              default: module.ProfileRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: profileLoader,
        hydrateFallback: ProfileSkeleton,
      },
      profileDelivery: {
        path: 'profile/delivery',
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/profile.delivery').then((module) => ({
              default: module.ProfileDeliveryRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: profileDeliveryLoader,
        hydrateFallback: ProfileSkeleton,
      },
      profileAccount: {
        path: 'profile/account',
        element: {
          type: 'lazy',
          importFn: () =>
            import('@/routes/profile.account').then((module) => ({
              default: module.AccountRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: accountLoader,
        hydrateFallback: ProfileSkeleton,
      },
    },
  },
} as const);
