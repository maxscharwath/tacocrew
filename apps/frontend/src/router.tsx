import { createBrowserRouter } from 'react-router';
import { DashboardRoute, dashboardLoader } from './routes/dashboard';
import { LoginRoute, loginAction, loginLoader } from './routes/login';
import { OrderCreateRoute, orderCreateAction, orderCreateLoader } from './routes/orders.create';
import { OrderDetailRoute, orderDetailAction, orderDetailLoader } from './routes/orders.detail';
import { OrdersRoute, ordersAction, ordersLoader } from './routes/orders.list';
import { OrderSubmitRoute, orderSubmitAction, orderSubmitLoader } from './routes/orders.submit';
import { ProfileRoute, profileLoader } from './routes/profile';
import { RootErrorBoundary, RootLayout } from './routes/root';
import { rootAction, rootLoader } from './routes/root.loader';
import { StockRoute, stockLoader } from './routes/stock';

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      loader: loginLoader,
      action: loginAction,
      element: <LoginRoute />,
      errorElement: <RootErrorBoundary />,
    },
    {
      path: '/',
      loader: rootLoader,
      action: rootAction,
      element: <RootLayout />,
      errorElement: <RootErrorBoundary />,
      children: [
        {
          index: true,
          loader: dashboardLoader,
          element: <DashboardRoute />,
        },
        {
          path: 'orders',
          loader: ordersLoader,
          action: ordersAction,
          element: <OrdersRoute />,
        },
        {
          path: 'orders/:orderId',
          loader: orderDetailLoader,
          action: orderDetailAction,
          element: <OrderDetailRoute />,
        },
        {
          path: 'orders/:orderId/create',
          loader: orderCreateLoader,
          action: orderCreateAction,
          element: <OrderCreateRoute />,
        },
        {
          path: 'orders/:orderId/submit',
          loader: orderSubmitLoader,
          action: orderSubmitAction,
          element: <OrderSubmitRoute />,
        },
        {
          path: 'stock',
          loader: stockLoader,
          element: <StockRoute />,
        },
        {
          path: 'profile',
          loader: profileLoader,
          element: <ProfileRoute />,
        },
      ],
    },
  ],
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
    },
  }
);
