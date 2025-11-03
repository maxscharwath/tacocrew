/**
 * Create user order use case
 * @module application/use-cases/user-orders
 */

import { injectable } from 'tsyringe';
import { CreateUserOrderRequestDto } from '@/application/dtos/user-order.dto';
import { DessertIdSchema } from '@/domain/schemas/dessert.schema';
import { DrinkIdSchema } from '@/domain/schemas/drink.schema';
import { ExtraIdSchema } from '@/domain/schemas/extra.schema';
import { canGroupOrderBeModified, type GroupOrderId } from '@/domain/schemas/group-order.schema';
import type { UserId } from '@/domain/schemas/user.schema';
import type { UserOrder } from '@/domain/schemas/user-order.schema';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { ResourceService } from '@/services/resource.service';
import { StockCategory, UserOrderItems, UserOrderStatus } from '@/types';
import { NotFoundError, ValidationError } from '@/utils/errors';
import { inject } from '@/utils/inject';
import { logger } from '@/utils/logger';
import { deterministicUUID } from '@/utils/uuid-utils';

/**
 * Create or update user order use case
 */
@injectable()
export class CreateUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);

  async execute(
    groupOrderId: GroupOrderId,
    userId: UserId,
    request: CreateUserOrderRequestDto
  ): Promise<UserOrder> {
    // Get and validate group order
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError(`Group order not found: ${groupOrderId}`);
    }

    if (!canGroupOrderBeModified(groupOrder)) {
      throw new ValidationError(
        `Cannot modify user order. Group order status: ${groupOrder.status}`
      );
    }

    // Validate and assign deterministic IDs
    const itemsWithIds = this.assignDeterministicIds(request.items);

    // Validate availability
    await this.validateItemAvailability(itemsWithIds);

    // Save user order
    const userOrder = await this.userOrderRepository.upsert({
      groupOrderId,
      userId,
      items: itemsWithIds,
      status: UserOrderStatus.DRAFT,
    });

    logger.info('User order created/updated', {
      groupOrderId,
      userId,
      itemCounts: {
        tacos: itemsWithIds.tacos.length,
        extras: itemsWithIds.extras.length,
        drinks: itemsWithIds.drinks.length,
        desserts: itemsWithIds.desserts.length,
      },
    });

    return userOrder;
  }

  /**
   * Assign deterministic IDs to items
   */
  private assignDeterministicIds(items: UserOrderItems): UserOrderItems {
    return {
      tacos: items.tacos.map((taco) => ({
        ...taco,
        meats: taco.meats.map((meat) => ({
          ...meat,
          id: deterministicUUID(meat.code, StockCategory.Meats),
        })),
        sauces: taco.sauces.map((sauce) => ({
          ...sauce,
          id: deterministicUUID(sauce.code, StockCategory.Sauces),
        })),
        garnitures: taco.garnitures.map((garniture) => ({
          ...garniture,
          id: deterministicUUID(garniture.code, StockCategory.Garnishes),
        })),
      })),
      extras: items.extras.map((extra) => ({
        ...extra,
        id: ExtraIdSchema.parse(deterministicUUID(extra.code, StockCategory.Extras)),
      })),
      drinks: items.drinks.map((drink) => ({
        ...drink,
        id: DrinkIdSchema.parse(deterministicUUID(drink.code, StockCategory.Drinks)),
      })),
      desserts: items.desserts.map((dessert) => ({
        ...dessert,
        id: DessertIdSchema.parse(deterministicUUID(dessert.code, StockCategory.Desserts)),
      })),
    };
  }

  /**
   * Validate item availability against delivery backend
   */
  private async validateItemAvailability(items: UserOrderItems): Promise<void> {
    const stock = await this.resourceService.getStock();
    const outOfStock: string[] = [];
    const notFound: string[] = [];

    // Validate tacos
    for (const taco of items.tacos) {
      for (const meat of taco.meats) {
        const stockItem = stock.meats.find((item) => item.id === meat.id);
        if (!stockItem) {
          notFound.push(`Meat: ${meat.code} (${meat.name || meat.code})`);
        } else if (!stockItem.in_stock) {
          outOfStock.push(`Meat: ${meat.code} (${meat.name || meat.code})`);
        }
      }

      for (const sauce of taco.sauces) {
        const stockItem = stock.sauces.find((item) => item.id === sauce.id);
        if (!stockItem) {
          notFound.push(`Sauce: ${sauce.code || sauce.name} (${sauce.name || sauce.code})`);
        } else if (!stockItem.in_stock) {
          outOfStock.push(`Sauce: ${sauce.code || sauce.name} (${sauce.name || sauce.code})`);
        }
      }

      for (const garniture of taco.garnitures) {
        const stockItem = stock.garnishes.find((item) => item.id === garniture.id);
        if (!stockItem) {
          notFound.push(`Garniture: ${garniture.code || garniture.name} (${garniture.name || garniture.code})`);
        } else if (!stockItem.in_stock) {
          outOfStock.push(`Garniture: ${garniture.code || garniture.name} (${garniture.name || garniture.code})`);
        }
      }
    }

    // Validate other items
    for (const extra of items.extras) {
      const stockItem = stock.extras.find((item) => item.id === extra.id);
      if (!stockItem) {
        notFound.push(`Extra: ${extra.code} (${extra.name || extra.code})`);
      } else if (!stockItem.in_stock) {
        outOfStock.push(`Extra: ${extra.code} (${extra.name || extra.code})`);
      }
    }

    for (const drink of items.drinks) {
      const stockItem = stock.drinks.find((item) => item.id === drink.id);
      if (!stockItem) {
        notFound.push(`Drink: ${drink.code} (${drink.name || drink.code})`);
      } else if (!stockItem.in_stock) {
        outOfStock.push(`Drink: ${drink.code} (${drink.name || drink.code})`);
      }
    }

    for (const dessert of items.desserts) {
      const stockItem = stock.desserts.find((item) => item.id === dessert.id);
      if (!stockItem) {
        notFound.push(`Dessert: ${dessert.code} (${dessert.name || dessert.code})`);
      } else if (!stockItem.in_stock) {
        outOfStock.push(`Dessert: ${dessert.code} (${dessert.name || dessert.code})`);
      }
    }

    if (notFound.length > 0 || outOfStock.length > 0) {
      const message = notFound.length > 0
        ? `Some items are no longer available: ${notFound.join(', ')}${outOfStock.length > 0 ? `; Some items are out of stock: ${outOfStock.join(', ')}` : ''}`
        : `Some items are out of stock: ${outOfStock.join(', ')}`;
      
      throw new ValidationError(message, {
        notFoundItems: notFound,
        outOfStockItems: outOfStock,
      });
    }
  }
}
