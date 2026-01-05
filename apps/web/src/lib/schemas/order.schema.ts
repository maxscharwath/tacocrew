import { z } from 'zod';
import { validationKeys } from '../zod-i18n';

/**
 * Schema for meat selection with quantity
 */
export const meatSelectionSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1, validationKeys.quantityMin),
});

/**
 * Schema for creating a user order (taco + sides)
 */
export const createUserOrderSchema = z
  .object({
    tacoSize: z.string().optional(),
    meats: z.array(meatSelectionSchema).default([]),
    sauces: z.array(z.string()).default([]),
    garnitures: z.array(z.string()).default([]),
    extras: z.array(z.string()).default([]),
    drinks: z.array(z.string()).default([]),
    desserts: z.array(z.string()).default([]),
    note: z.string().max(500, validationKeys.noteMax).optional(),
  })
  .superRefine((data, ctx) => {
    // Meats and sauces will be added automatically if not selected (handled on submit)
    // Must have either a taco size OR other items
    const hasTaco = data.tacoSize !== undefined;
    const hasOtherItems =
      data.extras.length > 0 || data.drinks.length > 0 || data.desserts.length > 0;

    if (!hasTaco && !hasOtherItems) {
      ctx.addIssue({
        code: 'custom',
        message: validationKeys.tacoOrItems,
        path: ['tacoSize'],
      });
    }
  });

/**
 * Schema for creating a group order
 */
export const createGroupOrderSchema = z
  .object({
    name: z
      .string()
      .min(1, validationKeys.orderNameRequired)
      .max(100, validationKeys.orderNameMax)
      .optional(),
    startDate: z.string().min(1, validationKeys.startDateRequired),
    endDate: z.string().min(1, validationKeys.endDateRequired),
    organizationId: z.string().min(1, validationKeys.orderNameRequired),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: validationKeys.endDateAfterStart,
      path: ['endDate'],
    }
  );

/**
 * Schema for editing a group order
 */
export const editGroupOrderSchema = z
  .object({
    name: z.string().min(1, validationKeys.orderNameRequired).max(100, validationKeys.orderNameMax),
    startDate: z.string().min(1, validationKeys.startDateRequired),
    endDate: z.string().min(1, validationKeys.endDateRequired),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: validationKeys.endDateAfterStart,
      path: ['endDate'],
    }
  );

export type MeatSelection = z.infer<typeof meatSelectionSchema>;
export type CreateUserOrderFormData = z.infer<typeof createUserOrderSchema>;
export type CreateGroupOrderFormData = z.infer<typeof createGroupOrderSchema>;
export type EditGroupOrderFormData = z.infer<typeof editGroupOrderSchema>;
