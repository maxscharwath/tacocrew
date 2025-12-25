import { z } from 'zod';
import { OrganizationError } from '@/components/errors/OrganizationError';
import { HydrateFallback } from '@/components/hydrate-fallback';
import {
  DashboardSkeleton,
  OrderCreateSkeleton,
  OrderDetailSkeleton,
  OrdersSkeleton,
  ProfileSkeleton,
  StockSkeleton,
} from '@/components/skeletons';
import { defineRoutes } from '@/lib/routes/core';
import { AboutRoute } from '@/routes/about';
import { DashboardRoute, dashboardLoader } from '@/routes/dashboard';
import { authenticationLoader, LoginRoute } from '@/routes/login';
import { orderCreateAction, orderCreateLoader } from '@/routes/orders.create';
import { orderDetailAction, orderDetailLoader } from '@/routes/orders.detail';
import { OrdersRoute, ordersAction, ordersLoader } from '@/routes/orders.list';
import { orderSubmitLoader } from '@/routes/orders.submit';
import { organizationJoinLoader } from '@/routes/organizations.join';
import { profileLoader } from '@/routes/profile';
import { accountLoader } from '@/routes/profile.account';
import { badgesLoader } from '@/routes/profile.badges';
import { profileDeliveryLoader } from '@/routes/profile.delivery';
import { profileOrganizationsLoader } from '@/routes/profile.organizations';
import { profileOrganizationsDetailLoader } from '@/routes/profile.organizations.detail';
import {
  ProfileOrganizationsIndexRoute,
  profileOrganizationsIndexLoader,
} from '@/routes/profile.organizations.index';
import { ProfileOrganizationsNewRoute } from '@/routes/profile.organizations.new';
import { releasesLoader } from '@/routes/releases';
import { RootErrorBoundary, RootLayout } from '@/routes/root';
import { rootAction, rootLoader } from '@/routes/root.loader';
import { StockRoute, stockLoader } from '@/routes/stock';

const orderParams = z.object({ orderId: z.string().min(1) });
const organizationParams = z.object({ id: z.uuid() });
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
  organizationJoin: {
    path: '/organizations/:id/join',
    params: organizationParams,
    element: {
      type: 'lazy',
      importFn: () =>
        import('@/routes/organizations.join').then((module) => ({
          default: module.OrganizationJoinRoute,
        })),
      fallback: HydrateFallback,
    },
    loader: organizationJoinLoader,
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
          importFn: () =>
            import('@/routes/orders.submit').then((module) => ({
              default: module.OrderSubmitRoute,
            })),
          fallback: OrderDetailSkeleton,
        },
        loader: orderSubmitLoader,
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
          importFn: () =>
            import('@/routes/profile.account').then((module) => ({
              default: module.AccountRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: accountLoader,
        hydrateFallback: ProfileSkeleton,
      },
      profileBadges: {
        path: 'profile/badges',
        element: {
          importFn: () =>
            import('@/routes/profile.badges').then((module) => ({
              default: module.ProfileBadgesRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: badgesLoader,
        hydrateFallback: ProfileSkeleton,
      },
      profileOrganizations: {
        path: 'profile/organizations',
        element: {
          importFn: () =>
            import('@/routes/profile.organizations').then((module) => ({
              default: module.ProfileOrganizationsRoute,
            })),
          fallback: ProfileSkeleton,
        },
        loader: profileOrganizationsLoader,
        hydrateFallback: ProfileSkeleton,
        children: {
          index: {
            index: true,
            element: ProfileOrganizationsIndexRoute,
            loader: profileOrganizationsIndexLoader,
            hydrateFallback: ProfileSkeleton,
          },
          new: {
            path: 'new',
            element: ProfileOrganizationsNewRoute,
            hydrateFallback: ProfileSkeleton,
          },
          detail: {
            path: ':id',
            params: organizationParams,
            element: {
              type: 'lazy',
              importFn: () =>
                import('@/routes/profile.organizations.detail').then((module) => ({
                  default: module.ProfileOrganizationsDetailRoute,
                })),
              fallback: ProfileSkeleton,
            },
            loader: profileOrganizationsDetailLoader,
            errorElement: OrganizationError,
            hydrateFallback: ProfileSkeleton,
          },
        },
      },
      about: {
        path: 'about',
        element: AboutRoute,
        hydrateFallback: HydrateFallback,
      },
      releases: {
        path: 'releases',
        element: {
          importFn: () =>
            import('@/routes/releases').then((module) => ({
              default: module.ReleasesRoute,
            })),
          fallback: HydrateFallback,
        },
        loader: releasesLoader,
        hydrateFallback: HydrateFallback,
      },
    },
  },
} as const);
