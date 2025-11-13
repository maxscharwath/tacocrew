// routes/core.ts
import React, { lazy } from 'react';
import {
  type ActionFunctionArgs,
  generatePath,
  type LoaderFunctionArgs,
  type RouteObject,
  redirect,
} from 'react-router';
import { z } from 'zod';

type ZodLike = z.ZodTypeAny;

export interface RouteDef<
  TParamsSchema extends ZodLike | undefined = undefined,
  TSearchSchema extends ZodLike | undefined = undefined,
  TChildren extends Record<string, AnyRouteDef> | undefined = undefined,
> {
  path?: string;
  index?: boolean;
  params?: TParamsSchema;
  search?: TSearchSchema;
  loader?: (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  action?: (args: ActionFunctionArgs) => unknown | Promise<unknown>;
  element?: React.ReactNode;
  errorElement?: React.ReactNode;
  hydrateFallback?: React.ReactNode;
  children?: TChildren;
}
export type AnyRouteDef = RouteDef<
  ZodLike | undefined,
  ZodLike | undefined,
  Record<string, AnyRouteDef> | undefined
>;

type ParamsOf<R extends AnyRouteDef> = R extends RouteDef<
  infer P extends ZodLike | undefined,
  infer _S extends ZodLike | undefined,
  infer _C
>
  ? P extends ZodLike
    ? z.infer<P>
    : Record<string, never>
  : Record<string, never>;

type SearchOf<R extends AnyRouteDef> = R extends RouteDef<
  infer _P extends ZodLike | undefined,
  infer S extends ZodLike | undefined,
  infer _C
>
  ? S extends ZodLike
    ? z.infer<S>
    : never
  : never;

type ArgsOf<R extends AnyRouteDef> = R extends RouteDef<
  infer P extends ZodLike | undefined,
  infer S extends ZodLike | undefined,
  infer _C
>
  ? P extends ZodLike
    ? S extends ZodLike
      ? ParamsOf<R> & { search?: SearchOf<R> }
      : ParamsOf<R>
    : S extends ZodLike
      ? { search?: SearchOf<R> }
      : void
  : void;

type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K;
}[keyof T];

type BuilderFn<R extends AnyRouteDef> = [ArgsOf<R>] extends [void]
  ? () => string
  : RequiredKeys<ArgsOf<R>> extends never
    ? {
        (): string;
        (args: ArgsOf<R>): string;
      }
    : (args: ArgsOf<R>) => string;

type RedirectFn<R extends AnyRouteDef> = [ArgsOf<R>] extends [void]
  ? () => Response
  : RequiredKeys<ArgsOf<R>> extends never
    ? {
        (): Response;
        (args: ArgsOf<R>): Response;
      }
    : (args: ArgsOf<R>) => Response;

type ChildRouteDefs<R extends AnyRouteDef> = Extract<R['children'], Record<string, AnyRouteDef>>;

type BuilderChildren<R extends AnyRouteDef> = ChildRouteDefs<R> extends Record<string, AnyRouteDef>
  ? { [K in keyof ChildRouteDefs<R>]: BuilderNode<ChildRouteDefs<R>[K]> }
  : Record<string, never>;

type FullUrlFn<R extends AnyRouteDef> = [ArgsOf<R>] extends [void]
  ? () => string
  : RequiredKeys<ArgsOf<R>> extends never
    ? {
        (): string;
        (args: ArgsOf<R>): string;
      }
    : (args: ArgsOf<R>) => string;

export type BuilderNode<R extends AnyRouteDef> = BuilderFn<R> & {
  redirectTo: RedirectFn<R>;
  url: FullUrlFn<R>;
} & BuilderChildren<R>;

export type Builders<T extends Record<string, AnyRouteDef>> = { [K in keyof T]: BuilderNode<T[K]> };

export type DefsConstraint = Record<string, AnyRouteDef>;

type BuilderChildDefs<C> = C extends Record<string, AnyRouteDef> ? BuilderDefs<C> : undefined;

type BuilderDefs<T extends DefsConstraint> = {
  [K in keyof T]: RouteDef<T[K]['params'], T[K]['search'], BuilderChildDefs<T[K]['children']>>;
};

const stripToBuilderDefs = <T extends DefsConstraint>(defs: T): BuilderDefs<T> => {
  const result = {} as BuilderDefs<T>;
  for (const [key, def] of Object.entries(defs) as [keyof T, T[keyof T]][]) {
    const builderDef: AnyRouteDef = {};
    if (def.path != null) builderDef.path = def.path;
    if (def.index != null) builderDef.index = def.index;
    if (def.params) builderDef.params = def.params;
    if (def.search) builderDef.search = def.search;
    if (def.children) {
      builderDef.children = stripToBuilderDefs(def.children as DefsConstraint) as Record<
        string,
        AnyRouteDef
      >;
    }
    result[key] = builderDef as BuilderDefs<T>[keyof T];
  }
  return result;
};

export type AsyncLoader = (args: LoaderFunctionArgs) => Promise<unknown>;
export type AsyncAction = (args: ActionFunctionArgs) => Promise<unknown>;

export type LazyRouteHandles = {
  element?: React.ReactElement;
  loader?: AsyncLoader;
  action?: AsyncAction;
};

export type LazyRouteOptions<Module> = {
  component?: (module: Module) => React.ComponentType<unknown>;
  loader?: (module: Module) => (args: LoaderFunctionArgs) => unknown | Promise<unknown>;
  action?: (module: Module) => (args: ActionFunctionArgs) => unknown | Promise<unknown>;
  fallback?: React.ReactNode;
};

export function createLazyRoute<Module>(
  importer: () => Promise<Module>,
  { component, loader, action, fallback = null }: LazyRouteOptions<Module>
): LazyRouteHandles {
  let modPromise: Promise<Module> | undefined;
  const loadModule = () => (modPromise ??= importer());

  const resolvedLoader: AsyncLoader | undefined = loader
    ? async (args: LoaderFunctionArgs) => {
        const mod = await loadModule();
        return loader(mod)(args);
      }
    : undefined;

  const resolvedAction: AsyncAction | undefined = action
    ? async (args: ActionFunctionArgs) => {
        const mod = await loadModule();
        return action(mod)(args);
      }
    : undefined;

  let element: React.ReactElement | undefined;
  if (component) {
    const LazyComponent = lazy(async () => {
      const mod = await loadModule();
      return { default: component(mod) };
    });
    element = React.createElement(React.Suspense, { fallback }, React.createElement(LazyComponent));
  }

  return {
    ...(element ? { element } : {}),
    ...(resolvedLoader ? { loader: resolvedLoader } : {}),
    ...(resolvedAction ? { action: resolvedAction } : {}),
  };
}

const qs = (obj: Record<string, unknown>) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const it of v) {
        usp.append(k, String(it));
      }
    } else {
      usp.set(k, String(v));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
};

const join = (base: string, seg?: string, index?: boolean) => {
  if (index) return base || '/';
  if (!seg) return base || '/';
  if (seg.startsWith('/')) return seg;
  if (!base) return seg.startsWith('/') ? seg : `/${seg}`;
  return base.endsWith('/') ? `${base}${seg}` : `${base}/${seg}`;
};

const buildOne = <R extends AnyRouteDef>(def: R, basePath: string): BuilderNode<R> => {
  const fullPath = join(basePath, def.path, def.index);

  const builderFn = ((raw?: unknown) => {
    const args = (raw ?? {}) as Record<string, unknown>;
    let validatedParams: Record<string, unknown> = {};
    let validatedSearch: Record<string, unknown> | undefined;

    if (def.params) {
      const r = def.params.safeParse(args);
      if (!r.success) throw r.error;
      validatedParams = r.data as Record<string, unknown>;
    }

    if (def.search) {
      const s = (args as { search?: unknown }).search ?? {};
      const r = def.search.safeParse(s);
      if (!r.success) throw r.error;
      validatedSearch = r.data as Record<string, unknown>;
    }

    const pathname = def.index ? fullPath : generatePath(fullPath, validatedParams);
    return `${pathname}${validatedSearch ? qs(validatedSearch) : ''}`;
  }) as BuilderFn<R>;

  const redirectTo = ((a?: unknown) => redirect(builderFn(a as ArgsOf<R>))) as RedirectFn<R>;

  const url = ((a?: unknown) => {
    const path = builderFn(a as ArgsOf<R>);
    // Use globalThis.location.origin in browser, or provide a way to configure base URL
    if (typeof globalThis.location !== 'undefined') {
      return `${globalThis.location.origin}${path}`;
    }
    // Fallback for SSR or when location is not available
    // Could be configured via environment variable or config
    return path;
  }) as FullUrlFn<R>;

  const children: Record<string, BuilderNode<AnyRouteDef>> = {};
  if (def.children) {
    for (const [k, child] of Object.entries(def.children)) {
      children[k] = buildOne(child as AnyRouteDef, fullPath);
    }
  }

  return Object.assign(builderFn, { redirectTo, url }, children) as BuilderNode<R>;
};

export function createRouteBuilders<const T extends Record<string, AnyRouteDef>>(
  defs: T
): Builders<T> {
  const out = {} as Builders<T>;
  for (const [k, def] of Object.entries(defs)) {
    (out as Record<string, BuilderNode<AnyRouteDef>>)[k] = buildOne(def as AnyRouteDef, '');
  }
  return out as Builders<T>;
}

const toRouteObject = (def: AnyRouteDef): RouteObject => {
  const node: RouteObject = {
    index: def.index,
    path: def.index ? undefined : def.path,
    loader: def.loader,
    action: def.action,
    element: def.element,
    errorElement: def.errorElement,
    hydrateFallback: def.hydrateFallback,
  };
  if (def.children) node.children = Object.values(def.children).map(toRouteObject);
  return node;
};

export function buildRouteObjects<const T extends Record<string, AnyRouteDef>>(defs: T) {
  return Object.values(defs).map(toRouteObject);
}

export type DefinedRoutesResult<T extends DefsConstraint> = {
  defs: T;
  routes: Builders<T>;
  routerConfig: RouteObject[];
};

export function defineRoutes<const T extends DefsConstraint>(defs: T): DefinedRoutesResult<T> {
  let cachedRoutes: Builders<T> | undefined;
  let cachedRouterConfig: RouteObject[] | undefined;
  const builderDefs = stripToBuilderDefs(defs);

  return {
    defs,
    get routes() {
      return (cachedRoutes ??= createRouteBuilders(builderDefs as unknown as T));
    },
    get routerConfig() {
      return (cachedRouterConfig ??= buildRouteObjects(defs));
    },
  } satisfies DefinedRoutesResult<T>;
}
