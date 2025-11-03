/**
 * Logging utility using Winston
 * @module utils/logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '@/shared/config/app.config';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

/**
 * Custom log format for development
 */
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const timestampStr = typeof timestamp === 'string' ? timestamp : String(timestamp);
  const messageStr = typeof message === 'string' ? message : String(message);
  let msg = `${timestampStr} [${level}]: ${messageStr}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

/**
 * Daily rotating file transport - one log file per day
 */
const dailyRotateFileTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
});

/**
 * Logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.isDevelopment ? combine(colorize(), devFormat) : json()
  ),
  transports: [
    new winston.transports.Console(),
    dailyRotateFileTransport,
  ],
  exitOnError: false,
});

/**
 * Stream for morgan HTTP logging
 */
export const httpLoggerStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};
