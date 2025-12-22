/**
 * Create user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import type { CreateUserOrderRequestDto } from '@/api/schemas/user-order.schemas';
import { GroupOrderRepository } from '@/infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '@/infrastructure/repositories/user-order.repository';
import { DessertId } from '@/schemas/dessert.schema';
import { DrinkId } from '@/schemas/drink.schema';
import { ExtraId } from '@/schemas/extra.schema';
import { canGroupOrderBeModified, type GroupOrderId } from '@/schemas/group-order.schema';
import { GarnitureId, MeatId, SauceId, TacoId } from '@/schemas/taco.schema';
import type { UserId } from '@/schemas/user.schema';
import type { UserOrder } from '@/schemas/user-order.schema';
import { BadgeEvaluationService } from '@/services/badge/badge-evaluation.service';
import { StatsTrackingService } from '@/services/badge/stats-tracking.service';
import { ResourceService } from '@/services/resource/resource.service';
import { UserService } from '@/services/user/user.service';
import { type StockAvailability, StockCategory, UserOrderItems } from '@/shared/types/types';
import { NotFoundError, ValidationError } from '@/shared/utils/errors.utils';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';
import {
  extractTacoIdsHex,
  generateTacoID,
  generateTacoIdHex,
} from '@/shared/utils/order-taco-id.utils';
import {
  sortUserOrderIngredients,
  validateItemAvailability,
} from '@/shared/utils/order-validation.utils';
import { deterministicUUID } from '@/shared/utils/uuid.utils';

/**
 * Create or update user order use case
 */
@injectable()
export class CreateUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly userService = inject(UserService);
  private readonly statsTrackingService = inject(StatsTrackingService);
  private readonly badgeEvaluationService = inject(BadgeEvaluationService);

  async execute(
    groupOrderId: GroupOrderId,
    userId: UserId,
    request: CreateUserOrderRequestDto
  ): Promise<UserOrder> {
    // Ensure user exists (will throw if not found)
    try {
      await this.userService.getUserById(userId);
    } catch (error) {
      logger.error('User not found when creating order', { userId, groupOrderId, error });
      throw new NotFoundError({
        resource: 'User',
        id: userId,
        message: 'User not found. Please ensure you are properly authenticated.',
      });
    }

    // Get and validate group order
    const groupOrder = await this.groupOrderRepository.findById(groupOrderId);
    if (!groupOrder) {
      throw new NotFoundError({ resource: 'GroupOrder', id: groupOrderId });
    }

    if (!canGroupOrderBeModified(groupOrder)) {
      throw new ValidationError({
        message: `Cannot modify user order. Group order status: ${groupOrder.status}`,
      });
    }

    // Get stock to enrich items with full details
    const stock = await this.resourceService.getStock();

    // Enrich simplified request with full item details from stock
    const itemsWithFullDetails = this.enrichItemsWithStockData(request.items, stock);

    // Validate and assign deterministic IDs
    const itemsWithIds = this.assignDeterministicIds(itemsWithFullDetails);

    // Sort ingredients alphabetically for consistent ordering
    const itemsWithSortedIngredients = sortUserOrderIngredients(itemsWithIds);

    // Validate availability
    validateItemAvailability(itemsWithSortedIngredients, stock);

    // Generate tacoIdHex for each taco (store in items JSON)
    const itemsWithTacoIds: UserOrderItems = {
      ...itemsWithSortedIngredients,
      tacos: itemsWithSortedIngredients.tacos.map((taco) => ({
        ...taco,
        tacoIdHex: generateTacoIdHex(taco),
      })),
    };

    // Extract all taco IDs in hex format for efficient querying
    const tacoIdsHex = extractTacoIdsHex(itemsWithTacoIds);

    // Save user order (always create new)
    const userOrder = await this.userOrderRepository.create({
      groupOrderId,
      userId,
      items: itemsWithTacoIds,
      tacoIdsHex: tacoIdsHex.length > 0 ? tacoIdsHex : null,
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

    // Track stats and evaluate badges (non-blocking)
    this.trackOrderAndEvaluateBadges(userId, itemsWithTacoIds).catch((error) => {
      logger.error('Failed to track order for badges', { userId, error });
    });

    return userOrder;
  }

  /**
   * Track order stats and evaluate badges
   */
  private async trackOrderAndEvaluateBadges(userId: UserId, items: UserOrderItems): Promise<void> {
    // Calculate total price
    const totalCentimes = this.calculateTotalCentimes(items);

    // Build taco data for stats tracking
    const tacoData = items.tacos.map((taco) => ({
      isMystery: taco.meats.length === 0, // Mystery tacos have no specific meats
      priceCentimes: taco.price * taco.quantity,
      meats: taco.meats.map((m) => m.code),
      sauces: taco.sauces.map((s) => s.code),
      garnitures: taco.garnitures.map((g) => g.code),
    }));

    // Track stats
    await this.statsTrackingService.trackOrderCreated(userId, {
      tacos: tacoData,
      totalCentimes,
    });

    // Check for mystery taco badges
    const hasMysteryTaco = tacoData.some((t) => t.isMystery);

    // Evaluate badges after order
    await this.badgeEvaluationService.evaluateAfterEvent(userId, {
      type: 'orderCreated',
      userId,
      timestamp: new Date(),
      data: {
        tacoCount: items.tacos.reduce((sum, t) => sum + t.quantity, 0),
        totalCentimes,
      },
    });

    // Also evaluate mystery taco event if applicable
    if (hasMysteryTaco) {
      await this.badgeEvaluationService.evaluateAfterEvent(userId, {
        type: 'mysteryTacoOrdered',
        userId,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Calculate total price in centimes
   */
  private calculateTotalCentimes(items: UserOrderItems): number {
    const tacoTotal = items.tacos.reduce((sum, t) => sum + t.price * t.quantity, 0);
    const extraTotal = items.extras.reduce((sum, e) => sum + e.price * e.quantity, 0);
    const drinkTotal = items.drinks.reduce((sum, d) => sum + d.price * d.quantity, 0);
    const dessertTotal = items.desserts.reduce((sum, d) => sum + d.price * d.quantity, 0);
    return tacoTotal + extraTotal + drinkTotal + dessertTotal;
  }

  /**
   * Enrich simplified request items with full details from stock
   */
  private enrichItemsWithStockData(
    simpleItems: CreateUserOrderRequestDto['items'],
    stock: StockAvailability
  ): UserOrderItems {
    return {
      tacos: simpleItems.tacos.map((simpleTaco: (typeof simpleItems.tacos)[number]) => {
        const meats = simpleTaco.meats.map((simpleMeat: (typeof simpleTaco.meats)[number]) => {
          const meat = stock[StockCategory.Meats].find((m) => m.id === simpleMeat.id);
          if (!meat) {
            throw new ValidationError({ message: `Meat not found: ${simpleMeat.id}` });
          }
          return {
            id: MeatId.parse(meat.id),
            code: meat.code,
            name: meat.name,
            quantity: simpleMeat.quantity,
          };
        });

        const sauces = simpleTaco.sauces.map((simpleSauce: (typeof simpleTaco.sauces)[number]) => {
          const sauce = stock[StockCategory.Sauces].find((s) => s.id === simpleSauce.id);
          if (!sauce) {
            throw new ValidationError({ message: `Sauce not found: ${simpleSauce.id}` });
          }
          return {
            id: SauceId.parse(sauce.id),
            code: sauce.code,
            name: sauce.name,
          };
        });

        const garnitures = simpleTaco.garnitures.map(
          (simpleGarniture: (typeof simpleTaco.garnitures)[number]) => {
            const garniture = stock[StockCategory.Garnishes].find(
              (g) => g.id === simpleGarniture.id
            );
            if (!garniture) {
              throw new ValidationError({ message: `Garniture not found: ${simpleGarniture.id}` });
            }
            return {
              id: GarnitureId.parse(garniture.id),
              code: garniture.code,
              name: garniture.name,
            };
          }
        );

        // Calculate taco price (base size price + meat prices)
        const tacoSizeItem = stock.tacos.find((t) => t.code === simpleTaco.size);
        const baseSizePrice = tacoSizeItem?.price.value ?? 0;
        const meatPrice = meats.reduce((sum: number, meat: (typeof meats)[number]) => {
          const meatItem = stock[StockCategory.Meats].find((m) => m.id === meat.id);
          return sum + (meatItem?.price?.value ?? 0) * meat.quantity;
        }, 0);
        const price = baseSizePrice + meatPrice;

        const taco = {
          id: TacoId.parse(
            deterministicUUID(`${simpleTaco.size}-${Date.now()}`, StockCategory.Meats)
          ),
          size: simpleTaco.size,
          meats,
          sauces,
          garnitures,
          note: simpleTaco.note,
          quantity: simpleTaco.quantity ?? 1,
          price,
        };
        return {
          ...taco,
          tacoID: generateTacoID(taco),
        };
      }),
      extras: simpleItems.extras.map((simpleExtra: (typeof simpleItems.extras)[number]) => {
        const extra = stock[StockCategory.Extras].find((e) => e.id === simpleExtra.id);
        if (!extra) {
          throw new ValidationError({ message: `Extra not found: ${simpleExtra.id}` });
        }
        return {
          id: ExtraId.parse(extra.id),
          code: extra.code,
          name: extra.name,
          price: extra.price?.value ?? 0,
          quantity: simpleExtra.quantity ?? 1,
        };
      }),
      drinks: simpleItems.drinks.map((simpleDrink: (typeof simpleItems.drinks)[number]) => {
        const drink = stock[StockCategory.Drinks].find((d) => d.id === simpleDrink.id);
        if (!drink) {
          throw new ValidationError({ message: `Drink not found: ${simpleDrink.id}` });
        }
        return {
          id: DrinkId.parse(drink.id),
          code: drink.code,
          name: drink.name,
          price: drink.price?.value ?? 0,
          quantity: simpleDrink.quantity ?? 1,
        };
      }),
      desserts: simpleItems.desserts.map((simpleDessert: (typeof simpleItems.desserts)[number]) => {
        const dessert = stock[StockCategory.Desserts].find((d) => d.id === simpleDessert.id);
        if (!dessert) {
          throw new ValidationError({ message: `Dessert not found: ${simpleDessert.id}` });
        }
        return {
          id: DessertId.parse(dessert.id),
          code: dessert.code,
          name: dessert.name,
          price: dessert.price?.value ?? 0,
          quantity: simpleDessert.quantity ?? 1,
        };
      }),
    };
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
          id: MeatId.parse(deterministicUUID(meat.code, StockCategory.Meats)),
        })),
        sauces: taco.sauces.map((sauce) => ({
          ...sauce,
          id: SauceId.parse(deterministicUUID(sauce.code, StockCategory.Sauces)),
        })),
        garnitures: taco.garnitures.map((garniture) => ({
          ...garniture,
          id: GarnitureId.parse(deterministicUUID(garniture.code, StockCategory.Garnishes)),
        })),
      })),
      extras: items.extras.map((extra) => ({
        ...extra,
        id: ExtraId.parse(deterministicUUID(extra.code, StockCategory.Extras)),
      })),
      drinks: items.drinks.map((drink) => ({
        ...drink,
        id: DrinkId.parse(deterministicUUID(drink.code, StockCategory.Drinks)),
      })),
      desserts: items.desserts.map((dessert) => ({
        ...dessert,
        id: DessertId.parse(deterministicUUID(dessert.code, StockCategory.Desserts)),
      })),
    };
  }
}
