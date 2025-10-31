/**
 * Slack bot controller for handling Slack commands
 * @module controllers/slack
 */

import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { logger } from '../utils/logger';
import { cartService, orderService, resourceService } from '../services';
import {
  TacoSize,
  OrderType,
  AddTacoRequest,
} from '../types';

/**
 * Slack Controller
 */
export class SlackController {
  /**
   * Handle /order-taco command
   */
  async handleOrderTaco({
    command,
    ack,
    respond,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    await ack();

    try {
      logger.info('Processing /order-taco command', {
        userId: command.user_id,
        text: command.text,
      });

      // Parse command text
      const args = command.text.trim().split(' ');
      const size = args[0]?.toUpperCase() as keyof typeof TacoSize;

      if (!size || !TacoSize[size]) {
        await respond({
          text: '❌ Invalid taco size. Use: L, BOWL, L_MIXTE, XL, XXL, or GIGA',
          response_type: 'ephemeral',
        });
        return;
      }

      // Create a sample taco order
      const tacoRequest: AddTacoRequest = {
        size: TacoSize[size],
        meats: [{ id: 'viande_hachee', quantity: 1 }],
        sauces: ['harissa'],
        garnitures: ['salade'],
      };

      await cartService.addTaco(tacoRequest);

      await respond({
        text: `✅ Taco ${size} added to cart!`,
        response_type: 'ephemeral',
      });
    } catch (error) {
      logger.error('Error handling /order-taco command', { error });
      await respond({
        text: '❌ Failed to add taco to cart. Please try again.',
        response_type: 'ephemeral',
      });
    }
  }

  /**
   * Handle /view-cart command
   */
  async handleViewCart({
    command,
    ack,
    respond,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    await ack();

    try {
      logger.info('Processing /view-cart command', { userId: command.user_id });

      const cart = await cartService.getCart();

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🛒 Your Cart',
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Tacos:* ${cart.summary.tacos.totalQuantity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Price:* CHF ${cart.summary.tacos.totalPrice.toFixed(2)}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Extras:* ${cart.summary.extras.totalQuantity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Price:* CHF ${cart.summary.extras.totalPrice.toFixed(2)}`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Drinks:* ${cart.summary.boissons.totalQuantity}`,
            },
            {
              type: 'mrkdwn',
              text: `*Price:* CHF ${cart.summary.boissons.totalPrice.toFixed(2)}`,
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Total:* CHF ${cart.summary.total.price.toFixed(2)} (${cart.summary.total.quantity} items)`,
          },
        },
      ];

      await respond({
        blocks,
        response_type: 'ephemeral',
      });
    } catch (error) {
      logger.error('Error handling /view-cart command', { error });
      await respond({
        text: '❌ Failed to fetch cart. Please try again.',
        response_type: 'ephemeral',
      });
    }
  }

  /**
   * Handle /checkout command
   */
  async handleCheckout({
    command,
    ack,
    respond,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    await ack();

    try {
      logger.info('Processing /checkout command', { userId: command.user_id });

      // Parse command: /checkout John Doe +41791234567 livraison 15:00 Rue Example 123
      const args = command.text.trim().split(' ');

      if (args.length < 4) {
        await respond({
          text: '❌ Usage: /checkout [name] [phone] [livraison|emporter] [time] [address (if delivery)]',
          response_type: 'ephemeral',
        });
        return;
      }

      const name = args[0] || '';
      const phone = args[1] || '';
      const type = args[2] as 'livraison' | 'emporter';
      const requestedFor = args[3] || '';
      const address = type === 'livraison' ? args.slice(4).join(' ') : undefined;

      const order = await orderService.createOrder({
        customer: { name, phone },
        delivery: {
          type: type === 'livraison' ? OrderType.DELIVERY : OrderType.TAKEAWAY,
          address,
          requestedFor,
        },
      });

      await respond({
        text: `✅ Order placed successfully!\n\n*Order ID:* ${order.orderId}\n*Status:* ${order.OrderData.status}\n*Total:* CHF ${order.OrderData.price.toFixed(2)}\n*Time:* ${order.OrderData.requestedFor}`,
        response_type: 'ephemeral',
      });
    } catch (error) {
      logger.error('Error handling /checkout command', { error });
      await respond({
        text: '❌ Failed to place order. Please try again.',
        response_type: 'ephemeral',
      });
    }
  }

  /**
   * Handle /order-status command
   */
  async handleOrderStatus({
    command,
    ack,
    respond,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    await ack();

    try {
      const orderId = command.text.trim();

      if (!orderId) {
        await respond({
          text: '❌ Please provide an order ID: /order-status [orderId]',
          response_type: 'ephemeral',
        });
        return;
      }

      logger.info('Processing /order-status command', {
        userId: command.user_id,
        orderId,
      });

      const status = await orderService.getOrderStatus(orderId);

      await respond({
        text: `📦 Order Status\n\n*Order ID:* ${status.orderId}\n*Status:* ${status.status}`,
        response_type: 'ephemeral',
      });
    } catch (error) {
      logger.error('Error handling /order-status command', { error });
      await respond({
        text: '❌ Failed to fetch order status. Please check the order ID.',
        response_type: 'ephemeral',
      });
    }
  }

  /**
   * Handle /stock command
   */
  async handleStock({
    command,
    ack,
    respond,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    await ack();

    try {
      logger.info('Processing /stock command', { userId: command.user_id });

      const stock = await resourceService.getStock();

      // Get out of stock items
      const outOfStock: string[] = [];
      for (const [category, items] of Object.entries(stock)) {
        for (const [itemId, info] of Object.entries(items)) {
          if (!info.in_stock) {
            outOfStock.push(`${category}: ${itemId}`);
          }
        }
      }

      const text =
        outOfStock.length > 0
          ? `⚠️ Out of Stock Items:\n\n${outOfStock.map((item) => `• ${item}`).join('\n')}`
          : '✅ All items are in stock!';

      await respond({
        text,
        response_type: 'ephemeral',
      });
    } catch (error) {
      logger.error('Error handling /stock command', { error });
      await respond({
        text: '❌ Failed to fetch stock information. Please try again.',
        response_type: 'ephemeral',
      });
    }
  }
}

export const slackController = new SlackController();
export default slackController;
