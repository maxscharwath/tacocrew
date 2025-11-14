// routes/app.tsx
import React from 'react';
import { z } from 'zod';
import { HydrateFallback } from '../components/hydrate-fallback';
import { DashboardRoute, dashboardLoader } from '../routes/dashboard';
import { LoginRoute, signinLoader, signupLoader } from '../routes/login';
import { OrderCreateRoute, orderCreateAction, orderCreateLoader } from '../routes/orders.create';
import { OrderDetailRoute, orderDetailAction, orderDetailLoader } from '../routes/orders.detail';
import { OrdersRoute, ordersAction, ordersLoader } from '../routes/orders.list';
import { OrderSubmitRoute, orderSubmitAction, orderSubmitLoader } from '../routes/orders.submit';
import { ProfileRoute, profileLoader } from '../routes/profile';
import { AccountRoute, accountLoader } from '../routes/profile.account';
import { ProfileDeliveryRoute, profileDeliveryLoader } from '../routes/profile.delivery';
import { RootErrorBoundary, RootLayout } from '../routes/root';
import { rootAction, rootLoader } from '../routes/root.loader';
import { StockRoute, stockLoader } from '../routes/stock';
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
    loader: signinLoader,
    element: React.createElement(LoginRoute),
    errorElement: React.createElement(RootErrorBoundary),
  },
  signup: {
    path: '/signup',
    search: loginSearch,
    loader: signupLoader,
    element: React.createElement(LoginRoute),
    errorElement: React.createElement(RootErrorBoundary),
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
      },
      orders: {
        path: 'orders',
        element: React.createElement(OrdersRoute),
        loader: ordersLoader,
        action: ordersAction,
      },
      orderDetail: {
        path: 'orders/:orderId',
        params: orderParams,
        element: React.createElement(OrderDetailRoute),
        loader: orderDetailLoader,
        action: orderDetailAction,
      },
      orderCreate: {
        path: 'orders/:orderId/create',
        params: orderParams,
        search: orderCreateSearch,
        element: React.createElement(OrderCreateRoute),
        loader: orderCreateLoader,
        action: orderCreateAction,
      },
      orderSubmit: {
        path: 'orders/:orderId/submit',
        params: orderParams,
        element: React.createElement(OrderSubmitRoute),
        loader: orderSubmitLoader,
        action: orderSubmitAction,
      },
      stock: {
        path: 'stock',
        element: React.createElement(StockRoute),
        loader: stockLoader,
      },
      profile: {
        path: 'profile',
        element: React.createElement(ProfileRoute),
        loader: profileLoader,
      },
      profileDelivery: {
        path: 'profile/delivery',
        element: React.createElement(ProfileDeliveryRoute),
        loader: profileDeliveryLoader,
      },
      profileAccount: {
        path: 'profile/account',
        element: React.createElement(AccountRoute),
        loader: accountLoader,
      },
    },
  },
} as const);
