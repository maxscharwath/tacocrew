/**
 * User service
 * @module services/user
 */

import { injectable } from 'tsyringe';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { UserDeliveryProfileRepository } from '../../infrastructure/repositories/user-delivery-profile.repository';
import {
  canAcceptOrders,
  createGroupOrderFromDb,
  type GroupOrderId,
} from '../../schemas/group-order.schema';
import type { OrderId } from '../../schemas/order.schema';
import type { User, UserId } from '../../schemas/user.schema';
import {
  type UserDeliveryProfile,
  type UserDeliveryProfileId,
} from '../../schemas/user-delivery-profile.schema';
import { NotFoundError } from '../../shared/utils/errors.utils';
import { inject } from '../../shared/utils/inject.utils';
import { GetPreviousOrdersUseCase, type PreviousOrder } from './get-previous-orders.service';
import { GetUserOrdersHistoryUseCase } from './get-user-orders-history.service';

type DeliveryProfileInput = {
  label?: string | null;
  contactName: string;
  phone: string;
  deliveryType: 'livraison' | 'emporter';
  address: {
    road: string;
    houseNumber?: string;
    postcode: string;
    city: string;
    state?: string;
    country?: string;
  };
};

type DeliveryProfileRecord = Omit<UserDeliveryProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const normalizeProfileInput = (profile: DeliveryProfileInput): DeliveryProfileRecord => ({
  label: profile.label ?? null,
  contactName: profile.contactName,
  phone: profile.phone,
  deliveryType: profile.deliveryType,
  address: {
    road: profile.address.road,
    houseNumber: profile.address.houseNumber,
    postcode: profile.address.postcode,
    city: profile.address.city,
    state: profile.address.state,
    country: profile.address.country,
  },
});

/**
 * User service
 */
@injectable()
export class UserService {
  private readonly userRepository = inject(UserRepository);
  private readonly userDeliveryProfileRepository = inject(UserDeliveryProfileRepository);
  private readonly prisma = inject(PrismaService);
  private readonly getUserOrdersHistoryUseCase = inject(GetUserOrdersHistoryUseCase);
  private readonly getPreviousOrdersUseCase = inject(GetPreviousOrdersUseCase);

  async getUserById(userId: UserId): Promise<User> {
    const dbUser = await this.userRepository.findById(userId);
    if (!dbUser) {
      throw new Error(`User not found: ${userId}`);
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      slackId: dbUser.slackId ?? undefined,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    } as User;
  }

  async getUserByEmail(email: string): Promise<User> {
    const dbUser = await this.userRepository.findByEmail(email);
    if (!dbUser) {
      throw new Error(`User not found: ${email}`);
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      slackId: dbUser.slackId ?? undefined,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    } as User;
  }

  getUserOrderHistory(userId: UserId): Promise<
    Array<{
      id: OrderId;
      orderId: OrderId;
      status: string;
      price: number | null;
      orderType: string;
      requestedFor: string;
      createdAt: Date;
    }>
  > {
    return this.getUserOrdersHistoryUseCase.execute(userId);
  }

  async getUserGroupOrders(_userId: UserId): Promise<
    Array<{
      id: GroupOrderId;
      name: string | null;
      shareCode: string | null;
      status: string;
      canAcceptOrders: boolean;
      startDate: Date;
      endDate: Date;
      createdAt: Date;
      leader: {
        id: UserId;
        name: string | null;
      };
    }>
  > {
    // Get all group orders (not just where user is leader)
    const dbGroupOrders = await this.prisma.client.groupOrder.findMany({
      select: {
        id: true,
        name: true,
        shareCode: true,
        leaderId: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
        leader: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return dbGroupOrders.map((go) => {
      const groupOrder = createGroupOrderFromDb(go);
      const leader = go.leader ?? { id: go.leaderId, name: null };
      return {
        id: go.id as GroupOrderId,
        name: go.name,
        shareCode: go.shareCode,
        status: go.status,
        canAcceptOrders: canAcceptOrders(groupOrder),
        startDate: go.startDate,
        endDate: go.endDate,
        createdAt: go.createdAt,
        leader: {
          id: leader.id as UserId,
          name: leader.name,
        },
      };
    });
  }

  getPreviousOrders(userId: UserId): Promise<PreviousOrder[]> {
    return this.getPreviousOrdersUseCase.execute(userId);
  }

  getDeliveryProfiles(userId: UserId): Promise<UserDeliveryProfile[]> {
    return this.userDeliveryProfileRepository.listByUser(userId);
  }

  createDeliveryProfile(userId: UserId, profile: DeliveryProfileInput) {
    return this.userDeliveryProfileRepository.create(userId, normalizeProfileInput(profile));
  }

  async updateDeliveryProfile(
    userId: UserId,
    profileId: UserDeliveryProfileId,
    profile: DeliveryProfileInput
  ) {
    const existing = await this.userDeliveryProfileRepository.findById(profileId);
    if (existing?.userId !== userId) {
      throw new NotFoundError({ resource: 'UserDeliveryProfile', id: profileId });
    }
    return this.userDeliveryProfileRepository.update(
      profileId,
      userId,
      normalizeProfileInput(profile)
    );
  }

  async deleteDeliveryProfile(userId: UserId, profileId: UserDeliveryProfileId) {
    const existing = await this.userDeliveryProfileRepository.findById(profileId);
    if (existing?.userId !== userId) {
      throw new NotFoundError({ resource: 'UserDeliveryProfile', id: profileId });
    }
    await this.userDeliveryProfileRepository.delete(profileId, userId);
  }
}
