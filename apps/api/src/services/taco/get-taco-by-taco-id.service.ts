import { injectable } from 'tsyringe';
import { z } from 'zod';
import { TacoSchema, UserOrderItemsSchema } from '../../api/schemas/user-order.schemas';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { Taco } from '../../schemas/taco.schema';
import { NotFoundError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import {
  generateTacoID,
  generateTacoIdHex,
  tacoIDToHex,
} from '../../shared/utils/order-taco-id.utils';

const TacoWithTacoIdHexSchema = TacoSchema.extend({
  tacoIdHex: z.string().min(1).optional(),
});

@injectable()
export class GetTacoByTacoIDUseCase {
  private readonly prisma = inject(PrismaService);

  /**
   * Find a taco by its tacoID (base58-encoded identifier)
   * The tacoID is user-friendly and Bitcoin-style encoded
   */
  async execute(tacoID: string): Promise<Taco> {
    logger.debug('Searching for taco', { tacoID });

    // Convert base58 tacoID to hex tacoId for database lookup
    // Note: Database stores hex tacoIds, but we search by tacoID (base58)
    let searchTacoIdHex: string | null = null;
    try {
      searchTacoIdHex = tacoIDToHex(tacoID);
      logger.debug('Converted tacoID to hex tacoId', { tacoID, searchTacoIdHex });
    } catch {
      // If tacoID is invalid base58, try searching as hex directly (backward compatibility)
      searchTacoIdHex = tacoID;
      logger.debug('Using tacoID as hex tacoId directly', { tacoID, searchTacoIdHex });
    }

    // Fetch all orders and search through them
    // Note: We could optimize this by using the database column that contains hex taco IDs,
    // but Prisma doesn't support JSON array queries well for SQLite, so we scan all orders
    const ordersToSearch = await this.prisma.client.userOrder.findMany({
      select: {
        items: true,
        tacoIdsHex: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filter orders that might contain this tacoId using the database column
    // This is a quick pre-filter before parsing JSON
    const potentiallyMatchingOrders = ordersToSearch.filter((order) => {
      if (!order.tacoIdsHex) return true; // Include if no tacoIds (backward compatibility)

      try {
        const tacoIds = order.tacoIdsHex as unknown;
        if (Array.isArray(tacoIds)) {
          return tacoIds.includes(searchTacoIdHex);
        }
        return true; // If format is unexpected, include it to be safe
      } catch {
        return true; // If parsing fails, include it to be safe
      }
    });

    logger.debug('Searching orders', {
      totalOrders: ordersToSearch.length,
      potentiallyMatchingOrders: potentiallyMatchingOrders.length,
    });

    let checkedTacos = 0;
    for (const order of potentiallyMatchingOrders) {
      const items = UserOrderItemsSchema.safeParse(order.items);
      if (!items.success) {
        logger.debug('Failed to parse order items', { error: items.error });
        continue;
      }

      for (const taco of items.data.tacos) {
        checkedTacos++;
        const tacoWithHex = TacoWithTacoIdHexSchema.safeParse(taco);
        if (!tacoWithHex.success) {
          logger.debug('Failed to parse taco with tacoIdHex schema', {
            error: tacoWithHex.error,
            tacoKeys: Object.keys(taco),
          });
          continue;
        }

        // First, try direct tacoID comparison (fastest)
        if (tacoWithHex.data.tacoID === tacoID) {
          logger.debug('Found taco by direct tacoID match', { tacoID });
          const { tacoIdHex: _, ...tacoWithoutInternalFields } = tacoWithHex.data;
          return tacoWithoutInternalFields;
        }

        // Generate tacoID from taco data and compare (in case stored tacoID doesn't match)
        const generatedTacoID = generateTacoID(taco);
        if (generatedTacoID === tacoID) {
          logger.debug('Found taco by generated tacoID match', {
            tacoID,
            storedTacoID: tacoWithHex.data.tacoID,
          });
          const { tacoIdHex: _, ...tacoWithoutInternalFields } = tacoWithHex.data;
          return {
            ...tacoWithoutInternalFields,
            tacoID: generatedTacoID,
          };
        }

        // Then, try tacoIdHex comparison
        const tacoIdHex = tacoWithHex.data.tacoIdHex || generateTacoIdHex(taco);
        if (tacoIdHex === searchTacoIdHex) {
          logger.debug('Found taco by tacoIdHex match', {
            tacoID,
            storedTacoID: tacoWithHex.data.tacoID,
            tacoIdHex: tacoIdHex,
          });
          // Return taco with tacoID (use stored tacoID if available, otherwise generate it)
          const { tacoIdHex: _, ...tacoWithoutInternalFields } = tacoWithHex.data;
          return {
            ...tacoWithoutInternalFields,
            tacoID: tacoWithoutInternalFields.tacoID || generateTacoID(taco),
          };
        }
      }
    }

    logger.warn('Taco not found', {
      tacoID,
      searchTacoIdHex,
      checkedTacos,
      ordersSearched: ordersToSearch.length,
    });
    throw new NotFoundError({ resource: 'Taco', tacoID });
  }
}
