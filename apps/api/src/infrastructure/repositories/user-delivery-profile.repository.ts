import { injectable } from 'tsyringe';
import type { UserId } from '../../schemas/user.schema';
import {
  createUserDeliveryProfileFromDb,
  type UserDeliveryProfile,
  type UserDeliveryProfileId,
} from '../../schemas/user-delivery-profile.schema';
import { inject } from '../../shared/utils/inject.utils';
import { logger } from '../../shared/utils/logger.utils';
import { PrismaService } from '../database/prisma.service';

@injectable()
export class UserDeliveryProfileRepository {
  private readonly prisma = inject(PrismaService);

  async listByUser(userId: UserId): Promise<UserDeliveryProfile[]> {
    const profiles = await this.prisma.client.userDeliveryProfile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    return profiles.map(createUserDeliveryProfileFromDb);
  }

  async findById(id: UserDeliveryProfileId): Promise<UserDeliveryProfile | null> {
    const profile = await this.prisma.client.userDeliveryProfile.findUnique({ where: { id } });
    return profile ? createUserDeliveryProfileFromDb(profile) : null;
  }

  async create(
    userId: UserId,
    profile: Omit<UserDeliveryProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<UserDeliveryProfile> {
    const created = await this.prisma.client.userDeliveryProfile.create({
      data: {
        userId,
        label: profile.label ?? null,
        contactName: profile.contactName,
        phone: profile.phone,
        deliveryType: profile.deliveryType,
        road: profile.address.road,
        houseNumber: profile.address.houseNumber ?? null,
        postcode: profile.address.postcode,
        city: profile.address.city,
        state: profile.address.state ?? null,
        country: profile.address.country ?? null,
      },
    });

    logger.info('Delivery profile created', { id: created.id, userId });
    return createUserDeliveryProfileFromDb(created);
  }

  async update(
    id: UserDeliveryProfileId,
    userId: UserId,
    profile: Omit<UserDeliveryProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<UserDeliveryProfile> {
    const updated = await this.prisma.client.userDeliveryProfile.update({
      where: { id_userId: { id, userId } },
      data: {
        label: profile.label ?? null,
        contactName: profile.contactName,
        phone: profile.phone,
        deliveryType: profile.deliveryType,
        road: profile.address.road,
        houseNumber: profile.address.houseNumber ?? null,
        postcode: profile.address.postcode,
        city: profile.address.city,
        state: profile.address.state ?? null,
        country: profile.address.country ?? null,
        updatedAt: new Date(),
      },
    });

    logger.info('Delivery profile updated', { id, userId });
    return createUserDeliveryProfileFromDb(updated);
  }

  async delete(id: UserDeliveryProfileId, userId: UserId): Promise<void> {
    await this.prisma.client.userDeliveryProfile.delete({ where: { id_userId: { id, userId } } });
    logger.info('Delivery profile deleted', { id, userId });
  }
}
