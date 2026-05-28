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

    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.colorize({ all: true }),
      winston.format.printf((info: any) => {
        const {
          timestamp,
          level,
          message,
          context,
          correlationId,
          method,
          route,
          statusCode,
          duration,
          ...meta
        } = info;

        let output = `\x1b[90m${timestamp}\x1b[0m `;

        const levelColors: Record<string, string> = {
          info: '\x1b[36mINFO\x1b[0m',
          warn: '\x1b[33mWARN\x1b[0m',
          error: '\x1b[31mERROR\x1b[0m',
          debug: '\x1b[35mDEBUG\x1b[0m',
          verbose: '\x1b[90mVERB\x1b[0m',
        };
        output += `${levelColors[level] || level.toUpperCase().padEnd(5)} `;

        if (context) {
          output += `\x1b[36m[${context}]\x1b[0m `;
        }

        output += message;

        if (correlationId) {
          output += ` \x1b[90mcid:${correlationId}\x1b[0m`;
        }

        if (method && route) {
          const statusStr = statusCode ? String(statusCode) : '';
          const firstDigit = statusStr[0] || '';
          const statusColors: Record<string, string> = {
            '2': '\x1b[32m',
            '3': '\x1b[33m',
            '4': '\x1b[31m',
            '5': '\x1b[31m',
          };
          output += ` \x1b[90m${method} ${route}${statusColors[firstDigit]}${statusStr}\x1b[0m`;
        }

        if (duration) {
          const durNum = Number(duration);
          const durationColor = durNum > 1000 ? '\x1b[31m' : durNum > 500 ? '\x1b[33m' : '\x1b[90m';
          output += ` ${durationColor}${duration}ms\x1b[0m`;
        }

        const cleanMeta: any = { ...meta };
        delete cleanMeta.context;
        delete cleanMeta.correlationId;
        delete cleanMeta.method;
        delete cleanMeta.route;
        delete cleanMeta.statusCode;
        delete cleanMeta.duration;
        const metaKeys = Object.keys(cleanMeta);
        if (metaKeys.length > 0) {
          output += ` \x1b[90m${JSON.stringify(cleanMeta)}\x1b[0m`;
        }

        return output;
      }),
    );

    this.logger = winston.createLogger({
      level: logLevel,
      format: fileFormat,
      defaultMeta: { service: 'nestjs-backend' },
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
        new dailyRotateTransport({
          dirname: path.join(process.cwd(), logDir),
          filename: 'combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '7d',
          level: 'silly',
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
