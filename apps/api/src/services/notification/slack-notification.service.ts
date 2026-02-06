/**
 * Slack notification service - sends messages to Slack via incoming webhooks
 * @module services/notification/slack-notification
 */

import { injectable } from 'tsyringe';
import { OrganizationRepository } from '@/infrastructure/repositories/organization.repository';
import { UserRepository } from '@/infrastructure/repositories/user.repository';
import { t } from '@/lib/i18n';
import type { OrganizationId } from '@/schemas/organization.schema';
import type { UserId } from '@/schemas/user.schema';
import { config } from '@/shared/config/app.config';
import { inject } from '@/shared/utils/inject.utils';
import { logger } from '@/shared/utils/logger.utils';

interface SlackBlock {
  readonly type: string;
  readonly text?: {
    readonly type: string;
    readonly text: string;
  };
  readonly elements?: ReadonlyArray<Record<string, unknown>>;
}

interface SlackPayload {
  readonly blocks: readonly SlackBlock[];
}

@injectable()
export class SlackNotificationService {
  private readonly organizationRepository = inject(OrganizationRepository);
  private readonly userRepository = inject(UserRepository);

  /**
   * Send a Slack message when a group order is created (opened)
   */
  async sendGroupOrderCreated(
    groupOrderId: string,
    orderName: string,
    leaderId: UserId,
    organizationId: OrganizationId,
    endDate?: Date
  ): Promise<void> {
    const webhookUrl = await this.organizationRepository.getSlackWebhookUrl(organizationId);
    if (!webhookUrl) return;

    const leader = await this.userRepository.findById(leaderId);
    const leaderName = leader?.name || 'Someone';
    const lng = leader?.language || 'en';
    const orderUrl = this.buildOrderUrl(groupOrderId);

    const title = t('slack.groupOrderCreated.title', {
      lng,
      orderName: orderName || 'Tacos',
    }) as string;
    const body = t('slack.groupOrderCreated.body', { lng, leaderName }) as string;
    const cta = t('slack.groupOrderCreated.cta', { lng }) as string;

    let messageText = `<!here>\n*${title}*\n${body}`;
    if (endDate) {
      const formattedDate = this.formatDateTime(endDate, lng);
      const deadline = t('slack.groupOrderCreated.deadline', {
        lng,
        endDate: formattedDate,
      }) as string;
      messageText += `\n⏰ ${deadline}`;
    }

    const payload: SlackPayload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: messageText,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: cta, emoji: true },
              url: orderUrl,
              style: 'primary',
            },
          ],
        },
      ],
    };

    await this.sendSlackMessage(webhookUrl, payload);
  }

  /**
   * Send a Slack message when a group order is submitted (placed)
   */
  async sendGroupOrderSubmitted(
    groupOrderId: string,
    orderName: string,
    leaderId: UserId,
    organizationId: OrganizationId
  ): Promise<void> {
    const webhookUrl = await this.organizationRepository.getSlackWebhookUrl(organizationId);
    if (!webhookUrl) return;

    const leader = await this.userRepository.findById(leaderId);
    const leaderName = leader?.name || 'Someone';
    const leaderPhone = leader?.phone;
    const lng = leader?.language || 'en';
    const orderUrl = this.buildOrderUrl(groupOrderId);

    const title = t('slack.groupOrderSubmitted.title', {
      lng,
      orderName: orderName || 'Tacos',
    }) as string;
    const body = t('slack.groupOrderSubmitted.body', { lng, leaderName }) as string;
    const cta = t('slack.groupOrderSubmitted.cta', { lng }) as string;

    let messageText = `*${title}*\n${body}`;
    if (leaderPhone) {
      const twintLine = t('slack.groupOrderSubmitted.twint', { lng, phone: leaderPhone }) as string;
      messageText += `\n${twintLine}`;
    }

    const payload: SlackPayload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: messageText,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: cta, emoji: true },
              url: orderUrl,
              style: 'primary',
            },
          ],
        },
      ],
    };

    await this.sendSlackMessage(webhookUrl, payload);
  }

  /**
   * Send a custom Slack message via the organization's webhook
   */
  async sendCustomMessage(organizationId: OrganizationId, message: string): Promise<void> {
    const webhookUrl = await this.organizationRepository.getSlackWebhookUrl(organizationId);
    if (!webhookUrl) {
      throw new Error('No Slack webhook URL configured for this organization');
    }

    const payload: SlackPayload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
      ],
    };

    await this.sendSlackMessage(webhookUrl, payload);
  }

  /**
   * Send a test Slack message to verify webhook configuration
   */
  async sendTestMessage(
    webhookUrl: string,
    organizationName: string,
    userId: UserId
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    const lng = user?.language || 'en';
    const title = t('slack.test.title', { lng }) as string;
    const body = t('slack.test.body', { lng, organizationName }) as string;

    const payload: SlackPayload = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${title}*\n${body}`,
          },
        },
      ],
    };

    await this.sendSlackMessage(webhookUrl, payload);
  }

  private formatDateTime(date: Date, lng: string): string {
    const localeMap: Record<string, string> = { en: 'en-GB', fr: 'fr-CH', de: 'de-CH' };
    return date.toLocaleString(localeMap[lng] || 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private buildOrderUrl(groupOrderId: string): string {
    const corsOrigin = config.webApi.corsOrigin.replace(/\/$/, '');
    // Slack requires absolute URLs for button elements
    // Fall back to FRONTEND_URL when CORS_ORIGIN is wildcard
    const baseUrl =
      corsOrigin === '*'
        ? (process.env['FRONTEND_URL'] || 'http://localhost:5173').replace(/\/$/, '')
        : corsOrigin;
    return `${baseUrl}/orders/${groupOrderId}`;
  }

  private async sendSlackMessage(webhookUrl: string, payload: SlackPayload): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error('Slack webhook request failed', {
        status: response.status,
        body: text,
      });
      throw new Error(`Slack webhook failed: ${response.status} ${text}`);
    }

    logger.debug('Slack message sent successfully');
  }
}
