/**
 * Slack Bot Integration
 * Handles Slack bot commands and interactions for tacos ordering
 */

import { App } from '@slack/bolt';
import { getTacosApiService } from '@/services/tacos-api.service';
import { getGroupOrderService } from '@/services/group-order.service';
import { logger } from '@/utils/logger';
import { getConfig } from '@/utils/config';
import { GroupOrderUser, TacoConfig } from '@/types';

/**
 * Slack Bot Service
 */
export class SlackBotService {
  private app: App | null = null;
  private readonly config = getConfig();

  /**
   * Initialize Slack bot
   */
  async initialize(): Promise<void> {
    if (!this.config.slack) {
      logger.warn('Slack configuration not found, skipping Slack bot initialization');
      return;
    }

    this.app = new App({
      token: this.config.slack.botToken,
      signingSecret: this.config.slack.signingSecret,
      socketMode: !!this.config.slack.appToken,
      appToken: this.config.slack.appToken,
    });

    this.setupHandlers();
    await this.app.start();

    logger.info(`⚡️ Slack Bot is running!`);
  }

  /**
   * Setup command and event handlers
   */
  private setupHandlers(): void {
    if (!this.app) return;

    // Handle /tacos command
    this.app.command('/tacos', async ({ command, ack, respond }) => {
      await ack();

      try {
        const service = getTacosApiService();
        const stock = await service.getStockAvailability();

        await respond({
          text: '🌮 Tacos Ordering System',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*🌮 Tacos Ordering System*\n\nUse the following commands:\n• `/tacos-menu` - View menu\n• `/tacos-cart` - View cart\n• `/tacos-order` - Place order',
              },
            },
          ],
        });
      } catch (error) {
        logger.error('Slack command error', error);
        await respond({
          text: 'Sorry, an error occurred. Please try again later.',
        });
      }
    });

    // Handle /tacos-menu command
    this.app.command('/tacos-menu', async ({ command, ack, respond }) => {
      await ack();

      try {
        const service = getTacosApiService();
        const stock = await service.getStockAvailability();

        const blocks = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📋 Available Menu*\n\n*Taco Sizes:*\n• L - 1 meat, 3 sauces max\n• BOWL - 2 meats, 3 sauces max\n• XL - 3 meats, 3 sauces max\n• XXL - 4 meats, 3 sauces max\n• GIGA - 5 meats, 3 sauces max',
            },
          },
        ];

        await respond({
          text: 'Menu',
          blocks,
        });
      } catch (error) {
        logger.error('Slack menu command error', error);
        await respond({
          text: 'Sorry, unable to fetch menu. Please try again later.',
        });
      }
    });

    // Handle /tacos-cart command
    this.app.command('/tacos-cart', async ({ command, ack, respond }) => {
      await ack();

      try {
        const service = getTacosApiService();
        const cart = await service.getCart();
        const summary = await service.getCartSummary();

        const totalItems = cart.tacos.length + cart.extras.length + cart.drinks.length + cart.desserts.length;
        const totalPrice =
          summary.tacos.totalPrice +
          summary.extras.totalPrice +
          summary.boissons.totalPrice +
          summary.desserts.totalPrice;

        const blocks = [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🛒 Your Cart*\n\n*Items:* ${totalItems}\n*Total Price:* CHF ${totalPrice.toFixed(2)}\n\n*Tacos:* ${cart.tacos.length}\n*Extras:* ${cart.extras.length}\n*Drinks:* ${cart.drinks.length}\n*Desserts:* ${cart.desserts.length}`,
            },
          },
        ];

        await respond({
          text: 'Cart',
          blocks,
        });
      } catch (error) {
        logger.error('Slack cart command error', error);
        await respond({
          text: 'Sorry, unable to fetch cart. Please try again later.',
        });
      }
    });

    // Handle /tacos-order command
    this.app.command('/tacos-order', async ({ command, ack, respond }) => {
      await ack();

      await respond({
        text: 'To place an order, please use the web interface or provide your details:',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📝 Place Order*\n\nPlease provide:\n• Name\n• Phone number\n• Delivery type (livraison/emporter)\n• Address (if delivery)',
            },
          },
        ],
      });
    });

    // Handle /tacos-group-start command
    this.app.command('/tacos-group-start', async ({ command, ack, respond }) => {
      await ack();

      try {
        const groupOrderService = getGroupOrderService();
        const expiresInMinutes = parseInt(command.text.trim()) || 30; // Default 30 minutes

        const user: GroupOrderUser = {
          id: command.user_id,
          name: command.user_name || 'Unknown',
        };

        const order = groupOrderService.createGroupOrder({
          createdBy: user,
          expiresInMinutes,
          name: command.text.trim() ? `Group Order by ${user.name}` : undefined,
        });

        const expiresAt = new Date(order.expiresAt);
        const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);

        await respond({
          text: '🌮 Group Order Started!',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*🌮 Group Order Started!*\n\n*Order ID:* \`${order.id}\`\n*Created by:* ${user.name}\n*Expires in:* ${timeRemaining} minutes\n*Status:* Active\n\nShare this order ID with others to add items!`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Commands:*\n• Use \`/tacos-group-add <order-id>\` to add items\n• Use \`/tacos-group-view <order-id>\` to view order\n• Use \`/tacos-group-close <order-id>\` to close order`,
              },
            },
          ],
        });
      } catch (error) {
        logger.error('Slack group order start error', error);
        await respond({
          text: 'Sorry, unable to create group order. Please try again later.',
        });
      }
    });

    // Handle /tacos-group-view command
    this.app.command('/tacos-group-view', async ({ command, ack, respond }) => {
      await ack();

      try {
        const groupOrderService = getGroupOrderService();
        const orderId = command.text.trim();

        if (!orderId) {
          await respond({
            text: 'Please provide an order ID: `/tacos-group-view <order-id>`',
          });
          return;
        }

        const order = groupOrderService.getGroupOrder(orderId);
        const expiresAt = new Date(order.expiresAt);
        const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);
        const isExpired = timeRemaining <= 0;

        const itemsText = order.items.length > 0
          ? order.items
              .map(
                (item, idx) =>
                  `${idx + 1}. *${item.userName}*: ${item.taco.size} (x${item.quantity}) - CHF ${(item.price * item.quantity).toFixed(2)}`
              )
              .join('\n')
          : 'No items yet';

        await respond({
          text: '📋 Group Order Details',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📋 Group Order Details*\n\n*Order ID:* \`${order.id}\`\n*Created by:* ${order.createdBy.name}\n*Status:* ${order.status}\n*Time remaining:* ${isExpired ? 'Expired' : `${timeRemaining} minutes`}\n*Total items:* ${order.summary.totalItems}\n*Total price:* CHF ${order.summary.totalPrice.toFixed(2)}\n*Participants:* ${order.summary.participantCount}`,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Items:*\n${itemsText}`,
              },
            },
          ],
        });
      } catch (error) {
        logger.error('Slack group order view error', error);
        await respond({
          text: 'Sorry, unable to fetch group order. Please check the order ID.',
        });
      }
    });

    // Handle /tacos-group-list command
    this.app.command('/tacos-group-list', async ({ command, ack, respond }) => {
      await ack();

      try {
        const groupOrderService = getGroupOrderService();
        const orders = groupOrderService.getAllActiveGroupOrders();

        if (orders.length === 0) {
          await respond({
            text: 'No active group orders found.',
          });
          return;
        }

        const ordersText = orders
          .map((order) => {
            const expiresAt = new Date(order.expiresAt);
            const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);
            return `• \`${order.id}\` - ${order.createdBy.name} (${order.summary.totalItems} items, ${timeRemaining}m remaining)`;
          })
          .join('\n');

        await respond({
          text: '📋 Active Group Orders',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📋 Active Group Orders*\n\n${ordersText}`,
              },
            },
          ],
        });
      } catch (error) {
        logger.error('Slack group order list error', error);
        await respond({
          text: 'Sorry, unable to fetch group orders. Please try again later.',
        });
      }
    });

    // Error handler
    this.app.error((error) => {
      logger.error('Slack bot error', error);
    });
  }

  /**
   * Stop Slack bot
   */
  async stop(): Promise<void> {
    if (this.app) {
      await this.app.stop();
      logger.info('Slack bot stopped');
    }
  }
}

/**
 * Singleton instance
 */
let slackBotInstance: SlackBotService | null = null;

/**
 * Get Slack bot service instance
 */
export function getSlackBotService(): SlackBotService {
  if (!slackBotInstance) {
    slackBotInstance = new SlackBotService();
  }
  return slackBotInstance;
}
