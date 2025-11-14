// routes/app.tsx
import { HydrateFallback } from '@/components/hydrate-fallback';
import {
  DashboardSkeleton,
  OrderCreateSkeleton,
  OrderDetailSkeleton,
  OrdersSkeleton,
  ProfileSkeleton,
  StockSkeleton,
} from '@/components/skeletons';
import { dashboardLoader, DashboardRoute } from '@/routes/dashboard';
import { authenticationLoader, LoginRoute } from '@/routes/login';
import { orderCreateAction, orderCreateLoader, OrderCreateRoute } from '@/routes/orders.create';
import { orderDetailAction, orderDetailLoader } from '@/routes/orders.detail';
import { ordersAction, ordersLoader, OrdersRoute } from '@/routes/orders.list';
import { orderSubmitAction, orderSubmitLoader, OrderSubmitRoute } from '@/routes/orders.submit';
import { profileLoader, ProfileRoute } from '@/routes/profile';
import { accountLoader, AccountRoute } from '@/routes/profile.account';
import { profileDeliveryLoader, ProfileDeliveryRoute } from '@/routes/profile.delivery';
import { RootErrorBoundary, RootLayout } from '@/routes/root';
import { rootAction, rootLoader } from '@/routes/root.loader';
import { stockLoader, StockRoute } from '@/routes/stock';
import React, { lazy } from 'react';
import { z } from 'zod';
import { defineRoutes } from './routes/core';

// Lazy load the order detail route to prevent hydration issues
const LazyOrderDetailRoute = lazy(() =>
  import('@/routes/orders.detail').then((module) => ({
    default: module.OrderDetailRoute,
  }))
);

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
    element: React.createElement(LoginRoute),
    errorElement: React.createElement(RootErrorBoundary),
    hydrateFallback: React.createElement(HydrateFallback),
  },
  signup: {
    path: '/signup',
    search: loginSearch,
    loader: authenticationLoader,
    element: React.createElement(LoginRoute),
    errorElement: React.createElement(RootErrorBoundary),
    hydrateFallback: React.createElement(HydrateFallback),
  },
  root: {
    path: '/',
    loader: rootLoader,
    action: rootAction,
    element: React.createElement(RootLayout),
    errorElement: React.createElement(RootErrorBoundary),
    hydrateFallback: React.createElement(HydrateFallback),
    children: {
      dashboard: {
        index: true,
        element: React.createElement(DashboardRoute),
        loader: dashboardLoader,
        hydrateFallback: React.createElement(DashboardSkeleton),
      },
      orders: {
        path: 'orders',
        element: React.createElement(OrdersRoute),
        loader: ordersLoader,
        action: ordersAction,
        hydrateFallback: React.createElement(OrdersSkeleton),
      },
      orderDetail: {
        path: 'orders/:orderId',
        params: orderParams,
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(OrderDetailSkeleton) },
          React.createElement(LazyOrderDetailRoute)
        ),
        loader: orderDetailLoader,
        action: orderDetailAction,
        errorElement: React.createElement(RootErrorBoundary),
        hydrateFallback: React.createElement(OrderDetailSkeleton),
      },
      orderCreate: {
        path: 'orders/:orderId/create',
        params: orderParams,
        search: orderCreateSearch,
        element: React.createElement(OrderCreateRoute),
        loader: orderCreateLoader,
        action: orderCreateAction,
        hydrateFallback: React.createElement(OrderCreateSkeleton),
      },
      orderSubmit: {
        path: 'orders/:orderId/submit',
        params: orderParams,
        element: React.createElement(OrderSubmitRoute),
        loader: orderSubmitLoader,
        action: orderSubmitAction,
        hydrateFallback: React.createElement(OrderDetailSkeleton),
      },
      stock: {
        path: 'stock',
        element: React.createElement(StockRoute),
        loader: stockLoader,
        hydrateFallback: React.createElement(StockSkeleton),
      },
      profile: {
        path: 'profile',
        element: React.createElement(ProfileRoute),
        loader: profileLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
      profileDelivery: {
        path: 'profile/delivery',
        element: React.createElement(ProfileDeliveryRoute),
        loader: profileDeliveryLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
      profileAccount: {
        path: 'profile/account',
        element: React.createElement(AccountRoute),
        loader: accountLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
    },
  },
} as const);
