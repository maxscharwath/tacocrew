import { z } from 'zod';

export const restaurantSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  address: z.string().nullish(),
  phone: z.string().nullish(),
  city: z.string().nullish(),
  postalCode: z.string().nullish(),
  countryCode: z.string().nullish(),
});

export const restaurantListSchema = z.array(restaurantSchema);

export type RestaurantSchema = z.infer<typeof restaurantSchema>;
