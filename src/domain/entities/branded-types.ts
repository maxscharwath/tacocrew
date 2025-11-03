import { z } from 'zod';

export type Brand<T, B extends string> = T & { readonly __brand: B };
export type Id<B extends string> = Brand<string, `${B}Id`>;

export function zId<T extends Id<string>>() {
  return z.uuid().transform((v) => v as T);
}
