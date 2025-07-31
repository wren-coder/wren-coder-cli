/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach, vi, expect } from 'vitest';
import { getLogger, setLogLevel, logger } from './logging.js';

describe('logging', () => {
  beforeEach(() => {
    // Reset console methods
    vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'info').mockImplementation(() => { });
    vi.spyOn(console, 'debug').mockImplementation(() => { });

    // Reset log level to default
    setLogLevel('info');
  });

  it('should create a logger instance', () => {
    const log = getLogger();
    expect(log).toBeDefined();
    expect(typeof log.error).toBe('function');
    expect(typeof log.warn).toBe('function');
    expect(typeof log.info).toBe('function');
    expect(typeof log.debug).toBe('function');
  });

  it('should export a default logger instance', () => {
    expect(logger).toBeDefined();
  });

  it('should log error messages by default', () => {
    logger.error('Test error message');
    expect(logger.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
  });

  it('should log warn messages by default', () => {
    logger.warn('Test warn message');
    expect(logger.warn).toHaveBeenCalledWith('[WARN]', 'Test warn message');
  });

  it('should log info messages by default', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('[INFO]', 'Test info message');
  });

  it('should not log debug messages by default', () => {
    logger.debug('Test debug message');
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('should log debug messages when level is set to debug', () => {
    setLogLevel('debug');
    logger.debug('Test debug message');
    expect(logger.debug).toHaveBeenCalledWith('[DEBUG]', 'Test debug message');
  });

  it('should not log debug messages when level is set back to info', () => {
    setLogLevel('debug');
    setLogLevel('info');
    logger.debug('Test debug message');
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('should not log info messages when level is set to warn', () => {
    setLogLevel('warn');
    logger.info('Test info message');
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('should still log error messages when level is set to warn', () => {
    setLogLevel('warn');
    logger.error('Test error message');
    expect(logger.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
  });
});