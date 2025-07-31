/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface Logger {
  error(...args: any[]): void;
  warn(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
}

class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      logger.error('[ERROR]', ...args);
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      logger.warn('[WARN]', ...args);
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      logger.info('[INFO]', ...args);
    }
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      logger.debug('[DEBUG]', ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= currentLevelIndex;
  }
}

let currentLogger: Logger | null = null;
let currentLogLevel: LogLevel = 'info';

export function getLogger(): Logger {
  if (!currentLogger) {
    currentLogger = new ConsoleLogger(currentLogLevel);
  }
  return currentLogger;
}

export function setLogLevel(level: LogLevel) {
  currentLogLevel = level;
  if (currentLogger) {
    (currentLogger as ConsoleLogger).setLevel(level);
  }
}

export const logger = getLogger();