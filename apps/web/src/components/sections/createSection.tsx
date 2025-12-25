import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { SectionWrapper } from './SectionWrapper';

/**
 * High-level API for creating section components with automatic state handling.
 *
 * @example
 * ```tsx
 * const OrderHeroSection = createSection({
 *   query: (orderId: string) => useGroupOrderWithOrders(orderId),
 *   skeleton: <OrderHeroSkeleton />,
 *   render: (data, props) => <OrderHero data={data} {...props} />,
 * });
 *
 * // Usage:
 * <OrderHeroSection orderId="123" canAddOrders={true} />
 * ```
 */

export interface CreateSectionConfig<TData, TProps> {
  query: (props: TProps) => UseQueryResult<TData, unknown>;
  skeleton: ReactNode;
  render: (data: TData, props: TProps) => ReactNode;
  errorFallback?: (error: unknown, props: TProps) => ReactNode;
}

export function createSection<TData, TProps extends Record<string, unknown>>({
  query,
  skeleton,
  render,
  errorFallback,
}: CreateSectionConfig<TData, TProps>) {
  return function SectionComponent(props: TProps) {
    const queryResult = query(props);

    return (
      <SectionWrapper
        query={queryResult}
        skeleton={skeleton}
        errorFallback={errorFallback ? (error) => errorFallback(error, props) : undefined}
      >
        {(data) => render(data, props)}
      </SectionWrapper>
    );
  };
}
