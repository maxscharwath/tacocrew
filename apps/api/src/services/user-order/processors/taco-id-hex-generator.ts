/**
 * Taco ID hex generator - adds tacoIdHex to regular tacos
 * @module services/user-order/processors
 */

import { TacoKind } from '@/schemas/taco.schema';
import type { UserOrderItems } from '@/shared/types/types';
import { generateTacoIdHex } from '@/shared/utils/order-taco-id.utils';

export class TacoIdHexGenerator {
  static generate(items: UserOrderItems): UserOrderItems {
    return {
      ...items,
      tacos: items.tacos.map((taco) =>
        taco.kind === TacoKind.MYSTERY ? taco : { ...taco, tacoIdHex: generateTacoIdHex(taco) }
      ),
    };
  }
}

