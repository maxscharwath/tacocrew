import { z } from 'zod';

const rawOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  maxQuantity: z.number().int().nonnegative().optional(),
  defaultQuantity: z.number().int().nonnegative().optional(),
  extraPrice: z.union([z.number(), z.string(), z.null()]).optional(),
  isActive: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
});

const rawOptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  minSelection: z.number().int().nonnegative(),
  maxSelection: z.number().int().nonnegative(),
  maxItemQuantity: z.number().int().nonnegative().optional(),
  includedCount: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
  items: z.array(rawOptionSchema),
});

const rawOptionTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  groups: z.array(rawOptionGroupSchema),
});

const rawVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  sku: z.string().nullish(),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  prices: z.array(z.unknown()).optional(),
});

const rawProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  image: z.string().nullish(),
  imageScale: z.number().nullish(),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  outOfStock: z.boolean().optional(),
  variants: z.array(rawVariantSchema).optional(),
  optionTemplate: rawOptionTemplateSchema.nullish(),
  optionTemplates: z.array(rawOptionTemplateSchema).optional(),
});

const rawCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  image: z.string().nullish(),
  isActive: z.boolean().optional(),
  timeStart: z.string().nullish(),
  timeEnd: z.string().nullish(),
  daysActive: z.string().nullish(),
  products: z.array(rawProductSchema),
});

export const menuItemsRawSchema = z.array(rawCategorySchema);

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

export const optionSchema = z.object({
  id: z.string(),
  name: z.string(),
  extraPrice: z.number(),
  available: z.boolean(),
  maxQuantity: z.number().int().nonnegative().optional(),
  defaultQuantity: z.number().int().nonnegative().optional(),
});

export const optionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  minSelection: z.number().int().nonnegative(),
  maxSelection: z.number().int().nonnegative(),
  options: z.array(optionSchema),
});

export const variantSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  available: z.boolean(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullish(),
  price: z.number(),
  imageUrl: z.string().nullish(),
  available: z.boolean(),
  categoryId: z.string().nullish(),
  categoryName: z.string().nullish(),
  optionGroups: z.array(optionGroupSchema),
  variants: z.array(variantSchema),
});

export const menuItemsSchema = z.object({
  products: z.array(productSchema),
});

export const combinationSlotSchema = z.object({
  id: z.string(),
  name: z.string(),
  productIds: z.array(z.string()),
});

export const combinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  slots: z.array(combinationSlotSchema),
});

export const combinationListSchema = z.array(combinationSchema);

type RawCategory = z.infer<typeof rawCategorySchema>;
type RawProduct = z.infer<typeof rawProductSchema>;
type RawOptionTemplate = z.infer<typeof rawOptionTemplateSchema>;

type NormalizedProduct = z.infer<typeof productSchema>;
type NormalizedOptionGroup = z.infer<typeof optionGroupSchema>;

const normalizeOptionGroup = (
  group: RawOptionTemplate['groups'][number]
): NormalizedOptionGroup => ({
  id: group.id,
  name: group.name,
  minSelection: group.minSelection,
  maxSelection: group.maxSelection,
  options: group.items.map((item) => ({
    id: item.id,
    name: item.name,
    extraPrice: toNumber(item.extraPrice),
    available: !(item.outOfStock ?? false) && (item.isActive ?? true),
    ...(item.maxQuantity !== undefined && { maxQuantity: item.maxQuantity }),
    ...(item.defaultQuantity !== undefined && { defaultQuantity: item.defaultQuantity }),
  })),
});

const normalizeProduct = (product: RawProduct, category: RawCategory): NormalizedProduct => {
  const templates = product.optionTemplates ?? (product.optionTemplate ? [product.optionTemplate] : []);
  const optionGroups = templates.flatMap((template) =>
    template.groups.filter((g) => g.isActive ?? true).map(normalizeOptionGroup)
  );

  const variants = (product.variants ?? []).map((variant) => ({
    id: variant.id,
    name: variant.name,
    price: toNumber(variant.price),
    available: true,
  }));

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    price: toNumber(product.price),
    imageUrl: product.image ?? null,
    available: !(product.outOfStock ?? false),
    categoryId: category.id,
    categoryName: category.name,
    optionGroups,
    variants,
  };
};

export const normalizeMenuItems = (raw: z.infer<typeof menuItemsRawSchema>): z.infer<typeof menuItemsSchema> => ({
  products: raw.flatMap((category) => category.products.map((p) => normalizeProduct(p, category))),
});
