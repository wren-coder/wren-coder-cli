/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getAllModelConfigs,
  getModelConfig,
  isModelSupported,
  getTokenLimit,
  clearModelConfigCache,
  getDefaultModelsConfigPath,
  BUILT_IN_MODEL_CONFIGS,
  DEFAULT_TOKEN_LIMIT,
} from './models.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const mockFs = vi.mocked(fs);

describe('models', () => {
  beforeEach(() => {
    clearModelConfigCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearModelConfigCache();
  });

  describe('BUILT_IN_MODEL_CONFIGS', () => {
    it('should contain expected models', () => {
      const modelNames = BUILT_IN_MODEL_CONFIGS.map(config => config.name);
      expect(modelNames).toContain('deepseek-chat');
      expect(modelNames).toContain('deepseek-reasoner');
      expect(modelNames).toContain('gemini-1.5-pro');
      expect(modelNames).toContain('gemini-2.0-flash');
      expect(modelNames).toContain('gemini-embedding-001');
    });

    it('should have unique model names', () => {
      const names = BUILT_IN_MODEL_CONFIGS.map(config => config.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid token limits', () => {
      BUILT_IN_MODEL_CONFIGS.forEach(config => {
        expect(config.tokenLimit).toBeGreaterThan(0);
        expect(typeof config.tokenLimit).toBe('number');
      });
    });
  });

  describe('getAllModelConfigs without custom config', () => {
    it('should return built-in configurations', () => {
      const configs = getAllModelConfigs();
      expect(configs).toHaveLength(BUILT_IN_MODEL_CONFIGS.length);
      expect(configs).toEqual(BUILT_IN_MODEL_CONFIGS);
    });

    it('should return a copy of configurations', () => {
      const configs = getAllModelConfigs();
      expect(configs).not.toBe(BUILT_IN_MODEL_CONFIGS);
    });

    it('should cache configurations', () => {
      const configs1 = getAllModelConfigs();
      const configs2 = getAllModelConfigs();
      expect(configs1).toEqual(configs2);
    });
  });

  describe('getAllModelConfigs with custom config', () => {
    it('should load and merge custom configurations', () => {
      const customConfig = {
        models: [
          {
            name: 'custom-model',
            tokenLimit: 500_000,
            description: 'Custom test model',
            provider: 'custom'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const configs = getAllModelConfigs('/path/to/custom/models.json');
      
      expect(mockFs.existsSync).toHaveBeenCalledWith('/path/to/custom/models.json');
      expect(mockFs.readFileSync).toHaveBeenCalledWith('/path/to/custom/models.json', 'utf-8');
      
      const customModel = configs.find(c => c.name === 'custom-model');
      expect(customModel).toEqual({
        name: 'custom-model',
        tokenLimit: 500_000,
        description: 'Custom test model',
        provider: 'custom'
      });
      
      // Should also include built-in models
      expect(configs.find(c => c.name === 'deepseek-chat')).toBeDefined();
    });

    it('should override built-in configurations with custom ones', () => {
      const customConfig = {
        models: [
          {
            name: 'deepseek-chat',
            tokenLimit: 256_000,
            description: 'Custom DeepSeek Chat with higher limit',
            provider: 'deepseek-custom'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const configs = getAllModelConfigs('/path/to/custom/models.json');
      const deepseekConfig = configs.find(c => c.name === 'deepseek-chat');
      
      expect(deepseekConfig).toEqual({
        name: 'deepseek-chat',
        tokenLimit: 256_000,
        description: 'Custom DeepSeek Chat with higher limit',
        provider: 'deepseek-custom'
      });
    });

    it('should handle non-existent custom config file', () => {
      mockFs.existsSync.mockReturnValue(false);

      const configs = getAllModelConfigs('/path/to/nonexistent/models.json');
      
      expect(configs).toEqual(BUILT_IN_MODEL_CONFIGS);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in custom config file', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const configs = getAllModelConfigs('/path/to/invalid/models.json');
      
      expect(configs).toEqual(BUILT_IN_MODEL_CONFIGS);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load custom model configs'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    it('should validate custom model configurations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const customConfig = {
        models: [
          {
            name: 'valid-model',
            tokenLimit: 100_000,
            description: 'Valid model'
          },
          {
            // Missing name
            tokenLimit: 100_000,
            description: 'Invalid model without name'
          },
          {
            name: 'invalid-token-limit',
            tokenLimit: -1, // Invalid token limit
            description: 'Invalid token limit'
          },
          {
            name: 'string-token-limit',
            tokenLimit: 'not-a-number', // Invalid type
            description: 'Invalid token limit type'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const configs = getAllModelConfigs('/path/to/custom/models.json');
      
      // Should only include the valid custom model and built-in models
      const customModels = configs.filter(c => !BUILT_IN_MODEL_CONFIGS.some(b => b.name === c.name));
      expect(customModels).toHaveLength(1);
      expect(customModels[0].name).toBe('valid-model');
      
      expect(consoleSpy).toHaveBeenCalledTimes(3); // 3 invalid models
      
      consoleSpy.mockRestore();
    });
  });

  describe('getModelConfig', () => {
    it('should return built-in model config', () => {
      const config = getModelConfig('deepseek-chat');
      const expected = BUILT_IN_MODEL_CONFIGS.find(c => c.name === 'deepseek-chat');
      expect(config).toEqual(expected);
    });

    it('should return undefined for unknown model', () => {
      const config = getModelConfig('unknown-model');
      expect(config).toBeUndefined();
    });

    it('should return custom model config when provided', () => {
      const customConfig = {
        models: [
          {
            name: 'custom-model',
            tokenLimit: 200_000,
            description: 'Custom model'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const config = getModelConfig('custom-model', '/path/to/custom/models.json');
      expect(config).toEqual({
        name: 'custom-model',
        tokenLimit: 200_000,
        description: 'Custom model'
      });
    });
  });

  describe('isModelSupported', () => {
    it('should return true for built-in models', () => {
      expect(isModelSupported('deepseek-chat')).toBe(true);
      expect(isModelSupported('gemini-1.5-pro')).toBe(true);
    });

    it('should return false for unknown models', () => {
      expect(isModelSupported('unknown-model')).toBe(false);
    });

    it('should support custom models when config provided', () => {
      const customConfig = {
        models: [
          {
            name: 'custom-model',
            tokenLimit: 200_000
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      expect(isModelSupported('custom-model', '/path/to/custom/models.json')).toBe(true);
    });
  });

  describe('getTokenLimit', () => {
    it('should return correct token limit for built-in models', () => {
      expect(getTokenLimit('deepseek-chat')).toBe(128_000);
      expect(getTokenLimit('gemini-1.5-pro')).toBe(2_097_152);
    });

    it('should return default token limit for unknown models', () => {
      expect(getTokenLimit('unknown-model')).toBe(DEFAULT_TOKEN_LIMIT);
    });

    it('should return custom token limit when provided', () => {
      const customConfig = {
        models: [
          {
            name: 'deepseek-chat',
            tokenLimit: 256_000 // Override built-in limit
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      expect(getTokenLimit('deepseek-chat', '/path/to/custom/models.json')).toBe(256_000);
    });
  });

  describe('getDefaultModelsConfigPath', () => {
    it('should return correct path', () => {
      const projectDir = '/path/to/project';
      const expectedPath = path.join(projectDir, '.wren', 'models.json');
      expect(getDefaultModelsConfigPath(projectDir)).toBe(expectedPath);
    });
  });

  describe('clearModelConfigCache', () => {
    it('should clear the cache', () => {
      // Load configs to populate cache
      getAllModelConfigs();
      
      // Clear cache
      clearModelConfigCache();
      
      // Loading again should work (no errors)
      const configs = getAllModelConfigs();
      expect(configs).toEqual(BUILT_IN_MODEL_CONFIGS);
    });
  });
});