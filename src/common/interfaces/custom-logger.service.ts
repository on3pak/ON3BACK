import { Injectable, LoggerService } from '@nestjs/common';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

const dailyRotateTransport = DailyRotateFile as any;

@Injectable()
export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logDir = this.configService.get<string>('logging.dir') || 'logs';
    const logLevel = this.configService.get<string>('logging.level') || 'info';

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0 && meta.stack) {
          metaStr = `\n${meta.stack}`;
        } else if (Object.keys(meta).length > 0) {
          metaStr = `\n${JSON.stringify(meta, null, 2)}`;
        }
        return `${timestamp} [${context || 'App'}] ${level.toUpperCase()}: ${message}${metaStr}`;
      })
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        return `${timestamp} [${context || 'App'}] ${level}: ${message}`;
      })
    );

    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
        new dailyRotateTransport({
          dirname: path.join(process.cwd(), logDir),
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
        }),
        new dailyRotateTransport({
          dirname: path.join(process.cwd(), logDir),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }
}