/**
 * Taco builder factory - selects builder based on kind
 * @module services/user-order/builders
 */

import { TacoKind } from '@/schemas/taco.schema';
import { MysteryTacoBuilder } from './mystery-taco-builder';
import { RegularTacoBuilder } from './regular-taco-builder';
import type { TacoBuilder } from './taco-builder.interface';

export class TacoBuilderFactory {
  private static readonly builders: Record<TacoKind, TacoBuilder> = {
    [TacoKind.REGULAR]: new RegularTacoBuilder(),
    [TacoKind.MYSTERY]: new MysteryTacoBuilder(),
  };

  static getBuilder(kind: TacoKind): TacoBuilder {
    return this.builders[kind];
  }
}

