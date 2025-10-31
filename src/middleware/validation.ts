/**
 * Request validation middleware
 * @module middleware/validation
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { TacoSize, OrderType } from '../types';

/**
 * Validate request body against Joi schema
 */
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.reduce((acc, detail) => {
        acc[detail.path.join('.')] = detail.message;
        return acc;
      }, {} as Record<string, string>);

      next(new ValidationError('Validation failed', details));
      return;
    }

    req.body = value;
    next();
  };
}

/**
 * Validation schemas
 */
export const schemas = {
  addTaco: Joi.object({
    size: Joi.string()
      .valid(...Object.values(TacoSize))
      .required(),
    meats: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      )
      .min(1)
      .required(),
    sauces: Joi.array().items(Joi.string()).max(3).required(),
    garnitures: Joi.array().items(Joi.string()).required(),
    note: Joi.string().optional().allow(''),
  }),

  updateTacoQuantity: Joi.object({
    action: Joi.string().valid('increase', 'decrease').required(),
  }),

  addExtra: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(1).required(),
    free_sauce: Joi.object({
      id: Joi.string().required(),
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
    }).optional(),
    free_sauces: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          price: Joi.number().min(0).required(),
        })
      )
      .optional(),
  }),

  addDrink: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(1).required(),
  }),

  addDessert: Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    price: Joi.number().min(0).required(),
    quantity: Joi.number().integer().min(1).required(),
  }),

  createOrder: Joi.object({
    customer: Joi.object({
      name: Joi.string().min(2).required(),
      phone: Joi.string()
        .pattern(/^\+?[1-9]\d{1,14}$/)
        .required(),
    }).required(),
    delivery: Joi.object({
      type: Joi.string()
        .valid(OrderType.DELIVERY, OrderType.TAKEAWAY)
        .required(),
      address: Joi.string().when('type', {
        is: OrderType.DELIVERY,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      requestedFor: Joi.string()
        .pattern(/^\d{2}:\d{2}$/)
        .required(),
    }).required(),
  }),
};

export default { validate, schemas };
