/**
 * Slack Bot Application
 * @module slack-bot
 */

import { App } from '@slack/bolt';
import config from './config';
import { logger } from './utils/logger';
import { apiClient } from './api/client';
import { slackController } from './controllers/slack.controller';

/**
 * Initialize and start Slack bot
 */
async function startSlackBot(): Promise<void> {
  if (!config.slack.enabled) {
    logger.warn('Slack bot is disabled in configuration');
    return;
  }

  logger.info('Initializing Slack bot');

  // Validate Slack configuration
  if (!config.slack.botToken || !config.slack.signingSecret || !config.slack.appToken) {
    throw new Error('Missing required Slack configuration (tokens/secrets)');
  }

  // Initialize API client
  await apiClient.initialize();

  // Create Slack app
  const app = new App({
    token: config.slack.botToken,
    signingSecret: config.slack.signingSecret,
    appToken: config.slack.appToken,
    socketMode: true,
    port: config.slack.port,
  });

  // Register commands
  app.command('/order-taco', slackController.handleOrderTaco.bind(slackController));
  app.command('/view-cart', slackController.handleViewCart.bind(slackController));
  app.command('/checkout', slackController.handleCheckout.bind(slackController));
  app.command('/order-status', slackController.handleOrderStatus.bind(slackController));
  app.command('/stock', slackController.handleStock.bind(slackController));

  // Register home tab
  app.event('app_home_opened', async ({ event, client }) => {
    try {
      await client.views.publish({
        user_id: event.user,
        view: {
          type: 'home',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🌮 Welcome to Tacos Ordering Bot!',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Use these commands to order tacos:',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Available Commands:*\n\n' +
                  '• `/order-taco [SIZE]` - Add a taco to cart\n' +
                  '• `/view-cart` - View your current cart\n' +
                  '• `/checkout [name] [phone] [type] [time] [address]` - Place order\n' +
                  '• `/order-status [orderId]` - Check order status\n' +
                  '• `/stock` - Check product availability',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Taco Sizes:*\n' +
                  '• L - Small (1 meat)\n' +
                  '• BOWL - Bowl style (2 meats)\n' +
                  '• XL - Large (3 meats)\n' +
                  '• XXL - Extra Large (4 meats)\n' +
                  '• GIGA - Giant (5 meats)',
              },
            },
          ],
        },
      });
    } catch (error) {
      logger.error('Error publishing home view', { error });
    }
  });

  // Start the app
  await app.start();

  logger.info('⚡️ Slack bot is running!', {
    port: config.slack.port,
  });
}

// Start the bot
if (require.main === module) {
  startSlackBot().catch((error: Error) => {
    logger.error('Failed to start Slack bot', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

export default startSlackBot;
