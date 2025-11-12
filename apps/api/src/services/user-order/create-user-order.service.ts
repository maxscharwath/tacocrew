/**
 * Create user order use case
 * @module services/user-order
 */

import { injectable } from 'tsyringe';
import type { CreateUserOrderRequestDto } from '../../api/schemas/user-order.schemas';
import { GroupOrderRepository } from '../../infrastructure/repositories/group-order.repository';
import { UserOrderRepository } from '../../infrastructure/repositories/user-order.repository';
import { DessertIdSchema } from '../../schemas/dessert.schema';
import { DrinkIdSchema } from '../../schemas/drink.schema';
import { ExtraIdSchema } from '../../schemas/extra.schema';
import { canGroupOrderBeModified, type GroupOrderId } from '../../schemas/group-order.schema';
import {
  GarnitureIdSchema,
  MeatIdSchema,
  SauceIdSchema,
  TacoIdSchema,
} from '../../schemas/taco.schema';
import type { UserId } from '../../schemas/user.schema';
import type { UserOrder } from '../../schemas/user-order.schema';
import { type StockAvailability, StockCategory, UserOrderItems } from '../../shared/types/types';
import { NotFoundError, ValidationError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import {
  extractTacoIdsHex,
  generateTacoID,
  generateTacoIdHex,
} from '../../shared/utils/order-taco-id.utils';
import { validateItemAvailability } from '../../shared/utils/order-validation.utils';
import { deterministicUUID } from '../../shared/utils/uuid.utils';
import { ResourceService } from '../resource/resource.service';
import { UserService } from '../user/user.service';

/**
 * Create or update user order use case
 */
@injectable()
export class CreateUserOrderUseCase {
  private readonly groupOrderRepository = inject(GroupOrderRepository);
  private readonly userOrderRepository = inject(UserOrderRepository);
  private readonly resourceService = inject(ResourceService);
  private readonly userService = inject(UserService);

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

    // Validate availability
    validateItemAvailability(itemsWithIds, stock);

    // Generate tacoIdHex for each taco (store in items JSON)
    const itemsWithTacoIds: UserOrderItems = {
      ...itemsWithIds,
      tacos: itemsWithIds.tacos.map((taco) => ({
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

    return userOrder;
  }

  /**
   * Enrich simplified request items with full details from stock
   */
  private enrichItemsWithStockData(
    simpleItems: CreateUserOrderRequestDto['items'],
    stock: StockAvailability
  ): UserOrderItems {
    return {
      tacos: simpleItems.tacos.map((simpleTaco) => {
        const meats = simpleTaco.meats.map((simpleMeat) => {
          const meat = stock[StockCategory.Meats].find((m) => m.id === simpleMeat.id);
          if (!meat) {
            throw new ValidationError({ message: `Meat not found: ${simpleMeat.id}` });
          }
          return {
            id: MeatIdSchema.parse(meat.id),
            code: meat.code,
            name: meat.name,
            quantity: simpleMeat.quantity,
          };
        });

        const sauces = simpleTaco.sauces.map((simpleSauce) => {
          const sauce = stock[StockCategory.Sauces].find((s) => s.id === simpleSauce.id);
          if (!sauce) {
            throw new ValidationError({ message: `Sauce not found: ${simpleSauce.id}` });
          }
          return {
            id: SauceIdSchema.parse(sauce.id),
            code: sauce.code,
            name: sauce.name,
          };
        });

        const garnitures = simpleTaco.garnitures.map((simpleGarniture) => {
          const garniture = stock[StockCategory.Garnishes].find((g) => g.id === simpleGarniture.id);
          if (!garniture) {
            throw new ValidationError({ message: `Garniture not found: ${simpleGarniture.id}` });
          }
          return {
            id: GarnitureIdSchema.parse(garniture.id),
            code: garniture.code,
            name: garniture.name,
          };
        });

        // Calculate taco price (base price + meat prices)
        // For now, use sum of meat prices as taco price
        const price = meats.reduce((sum, meat) => {
          const meatItem = stock[StockCategory.Meats].find((m) => m.id === meat.id);
          return sum + (meatItem?.price ?? 0) * meat.quantity;
        }, 0);

        const taco = {
          id: TacoIdSchema.parse(
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
      extras: simpleItems.extras.map((simpleExtra) => {
        const extra = stock[StockCategory.Extras].find((e) => e.id === simpleExtra.id);
        if (!extra) {
          throw new ValidationError({ message: `Extra not found: ${simpleExtra.id}` });
        }
        return {
          id: ExtraIdSchema.parse(extra.id),
          code: extra.code,
          name: extra.name,
          price: extra.price,
          quantity: simpleExtra.quantity ?? 1,
        };
      }),
      drinks: simpleItems.drinks.map((simpleDrink) => {
        const drink = stock[StockCategory.Drinks].find((d) => d.id === simpleDrink.id);
        if (!drink) {
          throw new ValidationError({ message: `Drink not found: ${simpleDrink.id}` });
        }
        return {
          id: DrinkIdSchema.parse(drink.id),
          code: drink.code,
          name: drink.name,
          price: drink.price,
          quantity: simpleDrink.quantity ?? 1,
        };
      }),
      desserts: simpleItems.desserts.map((simpleDessert) => {
        const dessert = stock[StockCategory.Desserts].find((d) => d.id === simpleDessert.id);
        if (!dessert) {
          throw new ValidationError({ message: `Dessert not found: ${simpleDessert.id}` });
        }
        return {
          id: DessertIdSchema.parse(dessert.id),
          code: dessert.code,
          name: dessert.name,
          price: dessert.price,
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
          id: MeatIdSchema.parse(deterministicUUID(meat.code, StockCategory.Meats)),
        })),
        sauces: taco.sauces.map((sauce) => ({
          ...sauce,
          id: SauceIdSchema.parse(deterministicUUID(sauce.code, StockCategory.Sauces)),
        })),
        garnitures: taco.garnitures.map((garniture) => ({
          ...garniture,
          id: GarnitureIdSchema.parse(deterministicUUID(garniture.code, StockCategory.Garnishes)),
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
}
