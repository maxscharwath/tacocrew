/**
 * Validation message keys for specific field validations
 * Use these in your schemas for consistent, translatable error messages
 */
export const validationKeys = {
  // Common
  required: 'validation.required',
  invalid: 'validation.invalid',

  // Auth
  email: 'validation.email',
  emailInvalid: 'validation.email',
  // NOSONAR - These are i18n keys, not actual passwords
  password: 'validation.password', // NOSONAR
  passwordMin: 'validation.passwordMin', // NOSONAR
  passwordMax: 'validation.passwordMax', // NOSONAR
  nameMin: 'validation.nameMin',
  nameMax: 'validation.nameMax',

  // Organization
  orgNameRequired: 'validation.orgNameRequired',
  orgNameEmpty: 'validation.orgNameEmpty',
  orgNameMax: 'validation.orgNameMax',
  avatarSize: 'validation.avatarSize',
  avatarFormat: 'validation.avatarFormat',

  // Delivery
  streetRequired: 'validation.streetRequired',
  streetMax: 'validation.streetMax',
  houseNumberMax: 'validation.houseNumberMax',
  postcodeRequired: 'validation.postcodeRequired',
  postcodeInvalid: 'validation.postcodeInvalid',
  cityRequired: 'validation.cityRequired',
  cityMax: 'validation.cityMax',
  phoneRequired: 'validation.phoneRequired',
  phoneInvalid: 'validation.phoneInvalid',
  profileLabelRequired: 'validation.profileLabelRequired',
  profileLabelMax: 'validation.profileLabelMax',
  contactNameRequired: 'validation.contactNameRequired',
  contactNameMax: 'validation.contactNameMax',

  // Order
  orderNameRequired: 'validation.orderNameRequired',
  orderNameMax: 'validation.orderNameMax',
  startDateRequired: 'validation.startDateRequired',
  endDateRequired: 'validation.endDateRequired',
  endDateAfterStart: 'validation.endDateAfterStart',
  quantityMin: 'validation.quantityMin',
  meatRequired: 'validation.meatRequired',
  sauceRequired: 'validation.sauceRequired',
  tacoOrItems: 'validation.tacoOrItems',
  noteMax: 'validation.noteMax',
  customerNameRequired: 'validation.customerNameRequired',
  requestedTimeRequired: 'validation.requestedTimeRequired',
} as const;
