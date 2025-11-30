// routes/app.tsx

import React, { lazy } from 'react';
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

// Lazy load heavy routes to reduce initial bundle size
const LazyOrderDetailRoute = lazy(() =>
  import('@/routes/orders.detail').then((module) => ({
    default: module.OrderDetailRoute,
  }))
);

const LazyOrderCreateRoute = lazy(() =>
  import('@/routes/orders.create').then((module) => ({
    default: module.OrderCreateRoute,
  }))
);

const LazyOrderSubmitRoute = lazy(() =>
  import('@/routes/orders.submit').then((module) => ({
    default: module.OrderSubmitRoute,
  }))
);

const LazyProfileRoute = lazy(() =>
  import('@/routes/profile').then((module) => ({
    default: module.ProfileRoute,
  }))
);

const LazyAccountRoute = lazy(() =>
  import('@/routes/profile.account').then((module) => ({
    default: module.AccountRoute,
  }))
);

const LazyProfileDeliveryRoute = lazy(() =>
  import('@/routes/profile.delivery').then((module) => ({
    default: module.ProfileDeliveryRoute,
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
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(OrderCreateSkeleton) },
          React.createElement(LazyOrderCreateRoute)
        ),
        loader: orderCreateLoader,
        action: orderCreateAction,
        hydrateFallback: React.createElement(OrderCreateSkeleton),
      },
      orderSubmit: {
        path: 'orders/:orderId/submit',
        params: orderParams,
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(OrderDetailSkeleton) },
          React.createElement(LazyOrderSubmitRoute)
        ),
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
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(ProfileSkeleton) },
          React.createElement(LazyProfileRoute)
        ),
        loader: profileLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
      profileDelivery: {
        path: 'profile/delivery',
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(ProfileSkeleton) },
          React.createElement(LazyProfileDeliveryRoute)
        ),
        loader: profileDeliveryLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
      profileAccount: {
        path: 'profile/account',
        element: React.createElement(
          React.Suspense,
          { fallback: React.createElement(ProfileSkeleton) },
          React.createElement(LazyAccountRoute)
        ),
        loader: accountLoader,
        hydrateFallback: React.createElement(ProfileSkeleton),
      },
    },
  },
} as const);
