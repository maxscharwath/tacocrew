/**
 * Branded types for type safety
 * Prevents accidentally passing wrong IDs to functions
 */

declare const OrderIdBrand: unique symbol;
declare const OrderItemIdBrand: unique symbol;
declare const TacoIdBrand: unique symbol;

export type OrderId = string & { readonly [OrderIdBrand]: true };
export type OrderItemId = string & { readonly [OrderItemIdBrand]: true };
export type TacoId = string & { readonly [TacoIdBrand]: true };

export const OrderId = (id: string): OrderId => id as OrderId;
export const OrderItemId = (id: string): OrderItemId => id as OrderItemId;
export const TacoId = (id: string): TacoId => id as TacoId;
