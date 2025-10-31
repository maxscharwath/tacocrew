/**
 * Slack Bot Integration
 * Uses Slack UI components (modals, buttons, interactive blocks) instead of commands
 */

import { App } from '@slack/bolt';
import { getGroupOrderService } from '@/services/group-order.service';
import { logger } from '@/utils/logger';
import { getConfig } from '@/utils/config';
import { GroupOrderUser, TacoConfig, TacoSize } from '@/types';

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
   * Setup handlers for interactive components
   */
  private setupHandlers(): void {
    if (!this.app) return;

    // Main entry point - single slash command to open menu
    this.app.command('/tacos', async ({ command, ack, respond }) => {
      await ack();

      await respond({
        text: '🌮 Tacos Ordering',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🌮 Tacos Ordering System*\n\nStart a group order or view active orders.',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '🚀 Start Group Order',
                },
                style: 'primary',
                action_id: 'start_group_order',
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '📋 View Active Orders',
                },
                action_id: 'list_group_orders',
              },
            ],
          },
        ],
      });
    });

    // Message shortcut for quick access
    this.app.message('Start Tacos Order', async ({ message, say, ack }) => {
      await ack();
      // This can be triggered by mentioning the bot
    });

    // Button: Start Group Order
    this.app.action('start_group_order', async ({ ack, body, client }) => {
      await ack();
      const triggerId = (body as any).trigger_id;
      await this.openCreateGroupOrderModal(client, triggerId, body.user.id, body.user.name || 'Unknown');
    });

    // Button: List Active Orders
    this.app.action('list_group_orders', async ({ ack, body, client }) => {
      await ack();
      const channelId = (body as any).channel?.id || body.user.id;
      await this.showActiveOrders(client, channelId);
    });

    // Modal: Submit Create Group Order
    this.app.view('create_group_order_modal', async ({ ack, body, view, client }) => {
      await ack();

      try {
        const values = view.state.values;
        const expiresInMinutes = parseInt(
          values.expires_minutes?.expires_input?.value || '30',
          10
        );
        const orderName = values.order_name?.name_input?.value || undefined;

        const user: GroupOrderUser = {
          id: body.user.id,
          name: body.user.name || 'Unknown',
        };

        const groupOrderService = getGroupOrderService();
        const order = groupOrderService.createGroupOrder({
          createdBy: user,
          expiresInMinutes,
          name: orderName,
        });

        // Post the group order message with interactive buttons
        await client.chat.postMessage({
          channel: body.user.id,
          text: '🌮 Group Order Created!',
          blocks: this.buildGroupOrderBlocks(order, user.id),
        });
      } catch (error) {
        logger.error('Error creating group order', error);
        await client.views.open({
          trigger_id: body.trigger_id,
          view: {
            type: 'modal',
            title: {
              type: 'plain_text',
              text: 'Error',
            },
            close: {
              type: 'plain_text',
              text: 'Close',
            },
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '❌ Failed to create group order. Please try again.',
                },
              },
            ],
          },
        });
      }
    });

    // Button: Add Item to Group Order
    this.app.action('add_item_to_order', async ({ ack, body, client }) => {
      await ack();
      const orderId = (body as any).actions[0].value;
      const triggerId = (body as any).trigger_id;
      const channelId = (body as any).channel?.id || body.user.id;
      const messageTs = (body as any).message?.ts || '';
      await this.openAddItemModal(
        client,
        triggerId,
        body.user.id,
        body.user.name || 'Unknown',
        orderId,
        channelId,
        messageTs
      );
    });

    // Button: View Group Order
    this.app.action('view_group_order', async ({ ack, body, client }) => {
      await ack();
      const orderId = (body as any).actions[0].value;
      const triggerId = (body as any).trigger_id;
      await this.showGroupOrderModal(client, triggerId, orderId);
    });

    // Button: Close Group Order
    this.app.action('close_group_order', async ({ ack, body, client }) => {
      await ack();
      const orderId = (body as any).actions[0].value;
      const userId = body.user.id;

      try {
        const groupOrderService = getGroupOrderService();
        groupOrderService.closeGroupOrder(orderId, userId);

        await client.chat.postEphemeral({
          channel: body.channel?.id || '',
          user: userId,
          text: '✅ Group order closed successfully',
        });

        await client.chat.update({
          channel: body.channel?.id || '',
          ts: (body as any).message.ts,
          text: '🌮 Group Order (Closed)',
          blocks: this.buildGroupOrderBlocks(groupOrderService.getGroupOrder(orderId), userId),
        });
      } catch (error) {
        logger.error('Error closing group order', error);
      }
    });

    // Modal: Submit Add Item
    this.app.view('add_item_modal', async ({ ack, body, view, client }) => {
      await ack();

      try {
        const values = view.state.values;
        const orderId = (view.private_metadata as any)?.orderId;
        const userId = body.user.id;
        const userName = body.user.name || 'Unknown';
        const metadata = JSON.parse(view.private_metadata as string || '{}');
        const channelId = metadata.channelId || userId;
        const messageTs = metadata.messageTs || '';

        const tacoSize = values.taco_size?.size_select?.selected_option?.value as TacoSize;
        const quantity = parseInt(values.quantity?.quantity_input?.value || '1', 10);

        // Build taco config from form values
        const taco: TacoConfig = {
          size: tacoSize,
          meats: this.getSelectedItems(values.meats?.meats_select),
          sauces: this.getSelectedItems(values.sauces?.sauces_select),
          garnitures: this.getSelectedItems(values.garnitures?.garnitures_select),
          note: values.note?.note_input?.value || undefined,
        };

        const groupOrderService = getGroupOrderService();
        groupOrderService.addItem({
          orderId,
          userId,
          userName,
          taco,
          quantity,
        });

        const order = groupOrderService.getGroupOrder(orderId);

        // Update the group order message if we have the message timestamp
        if (messageTs) {
          await client.chat.update({
            channel: channelId,
            ts: messageTs,
            text: '🌮 Group Order',
            blocks: this.buildGroupOrderBlocks(order, userId),
          });
        }

        await client.chat.postEphemeral({
          channel: channelId,
          user: userId,
          text: '✅ Item added successfully!',
        });
      } catch (error) {
        logger.error('Error adding item', error);
        await client.views.open({
          trigger_id: body.trigger_id,
          view: {
            type: 'modal',
            title: {
              type: 'plain_text',
              text: 'Error',
            },
            close: {
              type: 'plain_text',
              text: 'Close',
            },
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '❌ Failed to add item. Please try again.',
                },
              },
            ],
          },
        });
      }
    });

    // Error handler
    this.app.error((error) => {
      logger.error('Slack bot error', error);
    });
  }

  /**
   * Open create group order modal
   */
  private async openCreateGroupOrderModal(
    client: any,
    triggerId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'create_group_order_modal',
        title: {
          type: 'plain_text',
          text: 'Start Group Order',
        },
        submit: {
          type: 'plain_text',
          text: 'Create',
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'order_name',
            element: {
              type: 'plain_text_input',
              action_id: 'name_input',
              placeholder: {
                type: 'plain_text',
                text: 'Optional: Lunch Order',
              },
            },
            label: {
              type: 'plain_text',
              text: 'Order Name (Optional)',
            },
            optional: true,
          },
          {
            type: 'input',
            block_id: 'expires_minutes',
            element: {
              type: 'plain_text_input',
              action_id: 'expires_input',
              placeholder: {
                type: 'plain_text',
                text: '30',
              },
              initial_value: '30',
            },
            label: {
              type: 'plain_text',
              text: 'Expires in (minutes)',
            },
            hint: {
              type: 'plain_text',
              text: 'How long should this order stay open?',
            },
          },
        ],
      },
    });
  }

  /**
   * Open add item modal
   */
  private async openAddItemModal(
    client: any,
    triggerId: string,
    userId: string,
    userName: string,
    orderId: string,
    channelId?: string,
    messageTs?: string
  ): Promise<void> {
    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'add_item_modal',
        private_metadata: JSON.stringify({ orderId, channelId, messageTs }),
        title: {
          type: 'plain_text',
          text: 'Add Taco to Order',
        },
        submit: {
          type: 'plain_text',
          text: 'Add',
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'taco_size',
            element: {
              type: 'static_select',
              action_id: 'size_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select size',
              },
              options: [
                {
                  text: { type: 'plain_text', text: 'L (1 meat)' },
                  value: 'tacos_L',
                },
                {
                  text: { type: 'plain_text', text: 'BOWL (2 meats)' },
                  value: 'tacos_BOWL',
                },
                {
                  text: { type: 'plain_text', text: 'XL (3 meats)' },
                  value: 'tacos_XL',
                },
                {
                  text: { type: 'plain_text', text: 'XXL (4 meats)' },
                  value: 'tacos_XXL',
                },
                {
                  text: { type: 'plain_text', text: 'GIGA (5 meats)' },
                  value: 'tacos_GIGA',
                },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Taco Size',
            },
          },
          {
            type: 'input',
            block_id: 'quantity',
            element: {
              type: 'plain_text_input',
              action_id: 'quantity_input',
              placeholder: {
                type: 'plain_text',
                text: '1',
              },
              initial_value: '1',
            },
            label: {
              type: 'plain_text',
              text: 'Quantity',
            },
          },
          {
            type: 'input',
            block_id: 'meats',
            element: {
              type: 'multi_static_select',
              action_id: 'meats_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select meats',
              },
              options: [
                { text: { type: 'plain_text', text: 'Viande Hachée' }, value: 'viande_hachee' },
                { text: { type: 'plain_text', text: 'Escalope de Poulet' }, value: 'escalope_de_poulet' },
                { text: { type: 'plain_text', text: 'Nuggets' }, value: 'nuggets' },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Meats',
            },
          },
          {
            type: 'input',
            block_id: 'sauces',
            element: {
              type: 'multi_static_select',
              action_id: 'sauces_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select sauces (max 3)',
              },
              options: [
                { text: { type: 'plain_text', text: 'Harissa' }, value: 'harissa' },
                { text: { type: 'plain_text', text: 'Algérienne' }, value: 'algérienne' },
                { text: { type: 'plain_text', text: 'Blanche' }, value: 'blanche' },
                { text: { type: 'plain_text', text: 'Ketchup' }, value: 'ketchup' },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Sauces',
            },
          },
          {
            type: 'input',
            block_id: 'garnitures',
            element: {
              type: 'multi_static_select',
              action_id: 'garnitures_select',
              placeholder: {
                type: 'plain_text',
                text: 'Select garnitures',
              },
              options: [
                { text: { type: 'plain_text', text: 'Salade' }, value: 'salade' },
                { text: { type: 'plain_text', text: 'Tomates' }, value: 'tomates' },
                { text: { type: 'plain_text', text: 'Oignons' }, value: 'oignons' },
              ],
            },
            label: {
              type: 'plain_text',
              text: 'Garnitures',
            },
          },
          {
            type: 'input',
            block_id: 'note',
            element: {
              type: 'plain_text_input',
              action_id: 'note_input',
              placeholder: {
                type: 'plain_text',
                text: 'Optional note',
              },
              multiline: true,
            },
            label: {
              type: 'plain_text',
              text: 'Note (Optional)',
            },
            optional: true,
          },
        ],
      },
    });
  }

  /**
   * Show active orders list
   */
  private async showActiveOrders(client: any, channelId: string): Promise<void> {
    const groupOrderService = getGroupOrderService();
    const orders = groupOrderService.getAllActiveGroupOrders();

    if (orders.length === 0) {
      await client.chat.postMessage({
        channel: channelId,
        text: 'No active group orders',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '📋 *No active group orders*\n\nStart a new group order to begin!',
            },
          },
        ],
      });
      return;
    }

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📋 Active Group Orders',
        },
      },
      {
        type: 'divider',
      },
    ];

    orders.forEach((order) => {
      const expiresAt = new Date(order.expiresAt);
      const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${order.name || 'Group Order'}*\n*Created by:* ${order.createdBy.name}\n*Items:* ${order.summary.totalItems} | *Price:* CHF ${order.summary.totalPrice.toFixed(2)}\n*Time remaining:* ${timeRemaining}m`,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View',
          },
          action_id: 'view_group_order',
          value: order.id,
        },
      });
      blocks.push({
        type: 'divider',
      });
    });

    await client.chat.postMessage({
      channel: channelId,
      text: 'Active Group Orders',
      blocks,
    });
  }

  /**
   * Show group order in modal
   */
  private async showGroupOrderModal(
    client: any,
    triggerId: string,
    orderId: string
  ): Promise<void> {
    const groupOrderService = getGroupOrderService();
    const order = groupOrderService.getGroupOrder(orderId);
    const expiresAt = new Date(order.expiresAt);
    const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);

    const itemsText =
      order.items.length > 0
        ? order.items
            .map(
              (item, idx) =>
                `${idx + 1}. *${item.userName}*: ${item.taco.size} (x${item.quantity}) - CHF ${(item.price * item.quantity).toFixed(2)}`
            )
            .join('\n')
        : 'No items yet';

    await client.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Group Order Details',
        },
        close: {
          type: 'plain_text',
          text: 'Close',
        },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${order.name || 'Group Order'}*\n*Created by:* ${order.createdBy.name}\n*Status:* ${order.status}\n*Time remaining:* ${timeRemaining <= 0 ? 'Expired' : `${timeRemaining} minutes`}\n*Total items:* ${order.summary.totalItems}\n*Total price:* CHF ${order.summary.totalPrice.toFixed(2)}\n*Participants:* ${order.summary.participantCount}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Items:*\n${itemsText}`,
            },
          },
        ],
      },
    });
  }

  /**
   * Build group order message blocks
   */
  private buildGroupOrderBlocks(order: any, userId: string): any[] {
    const expiresAt = new Date(order.expiresAt);
    const timeRemaining = Math.floor((expiresAt.getTime() - Date.now()) / 1000 / 60);
    const isExpired = timeRemaining <= 0;
    const isCreator = order.createdBy.id === userId;

    const itemsText =
      order.items.length > 0
        ? order.items
            .map(
              (item, idx) =>
                `${idx + 1}. *${item.userName}*: ${item.taco.size} (x${item.quantity}) - CHF ${(item.price * item.quantity).toFixed(2)}`
            )
            .join('\n')
        : 'No items yet';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🌮 ${order.name || 'Group Order'}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Created by:* ${order.createdBy.name}\n*Status:* ${order.status}\n*Time remaining:* ${isExpired ? 'Expired' : `${timeRemaining} minutes`}\n*Total items:* ${order.summary.totalItems}\n*Total price:* CHF ${order.summary.totalPrice.toFixed(2)}\n*Participants:* ${order.summary.participantCount}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Items:*\n${itemsText}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '➕ Add Item',
            },
            style: 'primary',
            action_id: 'add_item_to_order',
            value: order.id,
            ...(order.status !== 'active' ? { disabled: true } : {}),
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👁️ View Details',
            },
            action_id: 'view_group_order',
            value: order.id,
          },
          ...(isCreator && order.status === 'active'
            ? [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '🔒 Close Order',
                  },
                  style: 'danger',
                  action_id: 'close_group_order',
                  value: order.id,
                  confirm: {
                    title: {
                      type: 'plain_text',
                      text: 'Close Order?',
                    },
                    text: {
                      type: 'mrkdwn',
                      text: 'Are you sure you want to close this order? No more items can be added.',
                    },
                    confirm: {
                      type: 'plain_text',
                      text: 'Close',
                    },
                    deny: {
                      type: 'plain_text',
                      text: 'Cancel',
                    },
                  },
                },
              ]
            : []),
        ],
      },
    ];

    return blocks;
  }

  /**
   * Get selected items from multi-select
   */
  private getSelectedItems(selectElement: any): any[] {
    if (!selectElement?.selected_options) return [];

    return selectElement.selected_options.map((option: any) => ({
      slug: option.value,
      name: option.text.text,
    }));
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
