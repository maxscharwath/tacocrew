/**
 * Service to reveal mystery taco ingredients for leaders
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import { TacoKind } from '@/schemas/taco.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { ResourceService } from '@/services/resource/resource.service';
import { convertMysteryTacoToRegular } from '@/shared/utils/mystery-taco-converter.utils';
import { inject } from '@/shared/utils/inject.utils';

@injectable()
export class RevealMysteryTacosService {
  private readonly resourceService = inject(ResourceService);

  /**
   * Reveal mystery taco ingredients for a user order
   * Converts mystery tacos to regular tacos with ingredients generated deterministically
   */
  async revealMysteryTacos(userOrder: UserOrder): Promise<UserOrder> {
    const stock = await this.resourceService.getStock();
    
    const revealedTacos = userOrder.items.tacos.map((taco) => {
      if (taco.kind === TacoKind.MYSTERY) {
        return convertMysteryTacoToRegular(taco, stock);
      }
      return taco;
    });

    return {
      ...userOrder,
      items: {
        ...userOrder.items,
        tacos: revealedTacos,
      },
    };
  }
}

