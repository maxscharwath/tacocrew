/**
 * Tests for CommandeOrderEventService.recordIfChanged idempotency.
 */

import '@/test-setup';
import 'reflect-metadata';
import { beforeEach, describe, expect, test as it, mock } from 'bun:test';
import { container } from 'tsyringe';
import { CommandeOrderEventRepository } from '@/infrastructure/repositories/commande-order-event.repository';
import type { CommandeOrderEvent } from '@/schemas/commande-order-event.schema';
import { CommandeOrderEventService } from '@/services/order/commande-order-event.service';

const COMMANDE_ORDER_ID = 'cmd-order-1';
const GROUP_ORDER_ID = '10000000-1000-4000-8000-100000000200' as never;

function buildEvent(overrides: Partial<CommandeOrderEvent>): CommandeOrderEvent {
  return {
    id: 'event-1' as CommandeOrderEvent['id'],
    commandeOrderId: COMMANDE_ORDER_ID,
    groupOrderId: GROUP_ORDER_ID,
    status: 'pending',
    source: 'activePreorders',
    observedAt: new Date('2026-05-01T10:00:00Z'),
    payload: null,
    createdAt: new Date('2026-05-01T10:00:00Z'),
    ...overrides,
  };
}

describe('CommandeOrderEventService.recordIfChanged', () => {
  const repoMock = {
    findLatestByCommandeOrderId: mock(
      async (_id: string): Promise<CommandeOrderEvent | null> => null
    ),
    create: mock(async (_input: Parameters<CommandeOrderEventRepository['create']>[0]) =>
      buildEvent({})
    ),
  };

  beforeEach(() => {
    container.clearInstances();
    repoMock.findLatestByCommandeOrderId.mockClear();
    repoMock.create.mockClear();
    container.registerInstance(
      CommandeOrderEventRepository,
      repoMock as unknown as CommandeOrderEventRepository
    );
  });

  it('inserts the first observation', async () => {
    repoMock.findLatestByCommandeOrderId.mockResolvedValueOnce(null);
    const service = container.resolve(CommandeOrderEventService);

    const outcome = await service.recordIfChanged({
      commandeOrderId: COMMANDE_ORDER_ID,
      groupOrderId: GROUP_ORDER_ID,
      status: 'pending',
      source: 'activePreorders',
      payload: { hello: 'world' },
    });

    expect(outcome).toBe('created');
    expect(repoMock.create).toHaveBeenCalledTimes(1);
    expect(repoMock.create.mock.calls[0]?.[0]).toMatchObject({
      commandeOrderId: COMMANDE_ORDER_ID,
      status: 'pending',
      source: 'activePreorders',
      payload: { hello: 'world' },
    });
  });

  it('no-ops when status is unchanged', async () => {
    repoMock.findLatestByCommandeOrderId.mockResolvedValueOnce(buildEvent({ status: 'preparing' }));
    const service = container.resolve(CommandeOrderEventService);

    const outcome = await service.recordIfChanged({
      commandeOrderId: COMMANDE_ORDER_ID,
      groupOrderId: GROUP_ORDER_ID,
      status: 'preparing',
      source: 'activePreorders',
    });

    expect(outcome).toBe('unchanged');
    expect(repoMock.create).not.toHaveBeenCalled();
  });

  it('inserts on transition to a different status', async () => {
    repoMock.findLatestByCommandeOrderId.mockResolvedValueOnce(buildEvent({ status: 'pending' }));
    const service = container.resolve(CommandeOrderEventService);

    const outcome = await service.recordIfChanged({
      commandeOrderId: COMMANDE_ORDER_ID,
      groupOrderId: GROUP_ORDER_ID,
      status: 'confirmed',
      source: 'activePreorders',
    });

    expect(outcome).toBe('created');
    expect(repoMock.create).toHaveBeenCalledTimes(1);
    expect(repoMock.create.mock.calls[0]?.[0]?.status).toBe('confirmed');
  });

  it('records terminal cancelled status', async () => {
    repoMock.findLatestByCommandeOrderId.mockResolvedValueOnce(buildEvent({ status: 'preparing' }));
    const service = container.resolve(CommandeOrderEventService);

    const outcome = await service.recordIfChanged({
      commandeOrderId: COMMANDE_ORDER_ID,
      groupOrderId: GROUP_ORDER_ID,
      status: 'cancelled',
      source: 'confirmation',
    });

    expect(outcome).toBe('created');
    expect(repoMock.create.mock.calls[0]?.[0]?.source).toBe('confirmation');
  });

  it('propagates repository errors so callers can decide how to handle them', async () => {
    repoMock.findLatestByCommandeOrderId.mockResolvedValueOnce(null);
    repoMock.create.mockRejectedValueOnce(new Error('db down'));
    const service = container.resolve(CommandeOrderEventService);

    await expect(
      service.recordIfChanged({
        commandeOrderId: COMMANDE_ORDER_ID,
        groupOrderId: GROUP_ORDER_ID,
        status: 'pending',
        source: 'activePreorders',
      })
    ).rejects.toThrow('db down');
  });
});
