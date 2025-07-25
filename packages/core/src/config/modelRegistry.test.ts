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
  modelRegistry,
  DEFAULT_TOKEN_LIMIT,
} from './modelRegistry.js';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

// Mock fetch for models.dev API
global.fetch = vi.fn();

const mockFs = vi.mocked(fs);
const mockFetch = vi.mocked(fetch);

describe('Model Configuration System', () => {
  beforeEach(() => {
    clearModelConfigCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearModelConfigCache();
  });

  describe('Built-in Models', () => {
    it('should contain expected models from all providers', () => {
      const allModels = modelRegistry.getBuiltInModels();
      const modelNames = allModels.map(config => config.name);

      // DeepSeek models
      expect(modelNames).toContain('deepseek-chat');
      expect(modelNames).toContain('deepseek-reasoner');
      expect(modelNames).toContain('deepseek-coder');

      // Google models
      expect(modelNames).toContain('gemini-1.5-pro');
      expect(modelNames).toContain('gemini-2.5-flash');
      expect(modelNames).toContain('gemini-embedding-001');

      // OpenAI models
      expect(modelNames).toContain('gpt-4o');
      expect(modelNames).toContain('gpt-4o-mini');
      expect(modelNames).toContain('text-embedding-3-large');

      // Anthropic models
      expect(modelNames).toContain('claude-3-5-sonnet-20241022');
      expect(modelNames).toContain('claude-3-5-haiku-20241022');

      // Meta models
      expect(modelNames).toContain('llama-3.3-70b-instruct');
      expect(modelNames).toContain('llama-3.2-11b-vision-instruct');

      // Mistral models
      expect(modelNames).toContain('mistral-large-2411');
      expect(modelNames).toContain('pixtral-12b-2409');

      // Cohere models
      expect(modelNames).toContain('command-r-plus-08-2024');
      expect(modelNames).toContain('embed-english-v3.0');
    });

    it('should have unique model names', () => {
      const allModels = modelRegistry.getBuiltInModels();
      const names = allModels.map(config => config.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have valid token limits', () => {
      const allModels = modelRegistry.getBuiltInModels();
      allModels.forEach(config => {
        expect(config.tokenLimit).toBeGreaterThan(0);
        expect(typeof config.tokenLimit).toBe('number');
      });
    });

    it('should have valid provider names', () => {
      const allModels = modelRegistry.getBuiltInModels();
      const expectedProviders = ['deepseek', 'google', 'openai', 'anthropic', 'meta', 'mistral', 'cohere'];

      allModels.forEach(config => {
        expect(config.provider).toBeTruthy();
        expect(expectedProviders).toContain(config.provider);
      });
    });

    it('should have proper capabilities structure', () => {
      const allModels = modelRegistry.getBuiltInModels();

      allModels.forEach(config => {
        if (config.capabilities) {
          // Check that all capability keys are valid
          const validCapabilities = ['reasoning', 'imageGeneration', 'embedding', 'vision', 'functionCalling', 'streaming'];
          Object.keys(config.capabilities).forEach(cap => {
            expect(validCapabilities).toContain(cap);
          });

          // Check that all capability values are boolean
          Object.values(config.capabilities).forEach(value => {
            expect(typeof value).toBe('boolean');
          });
        }
      });
    });
  });

  describe('Model Registry', () => {
    it('should get model by name', () => {
      const model = modelRegistry.getModel('deepseek-chat');
      expect(model).toBeDefined();
      expect(model?.name).toBe('deepseek-chat');
      expect(model?.provider).toBe('deepseek');
    });

    it('should return undefined for unknown model', () => {
      const model = modelRegistry.getModel('unknown-model');
      expect(model).toBeUndefined();
    });

    it('should get models by provider', () => {
      const googleModels = modelRegistry.getModelsByProvider('google');
      expect(googleModels.length).toBeGreaterThan(0);
      googleModels.forEach(model => {
        expect(model.provider).toBe('google');
      });
    });

    it('should get models by capability', () => {
      const visionModels = modelRegistry.getModelsByCapability('vision');
      expect(visionModels.length).toBeGreaterThan(0);
      visionModels.forEach(model => {
        expect(model.capabilities?.vision).toBe(true);
      });

      const embeddingModels = modelRegistry.getModelsByCapability('embedding');
      expect(embeddingModels.length).toBeGreaterThan(0);
      embeddingModels.forEach(model => {
        expect(model.capabilities?.embedding).toBe(true);
      });
    });

    it('should search models by query', () => {
      const gptModels = modelRegistry.searchModels('gpt');
      expect(gptModels.length).toBeGreaterThan(0);
      gptModels.forEach(model => {
        expect(
          model.name.toLowerCase().includes('gpt') ||
          model.description?.toLowerCase().includes('gpt') ||
          model.provider.toLowerCase().includes('gpt')
        ).toBe(true);
      });
    });

    it('should get available providers', () => {
      const providers = modelRegistry.getProviders();
      expect(providers).toContain('deepseek');
      expect(providers).toContain('google');
      expect(providers).toContain('openai');
      expect(providers).toContain('anthropic');
      expect(providers).toContain('meta');
      expect(providers).toContain('mistral');
      expect(providers).toContain('cohere');
    });
  });

  describe('Custom Model Loading', () => {
    it('should load and merge custom configurations', () => {
      const customConfig = {
        models: [
          {
            name: 'custom-model',
            tokenLimit: 500_000,
            description: 'Custom test model',
            provider: 'custom',
            capabilities: {
              reasoning: true
            }
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
        provider: 'custom',
        capabilities: {
          reasoning: true
        }
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
      const builtInModels = modelRegistry.getBuiltInModels();

      expect(configs.length).toBe(builtInModels.length);
      expect(mockFs.readFileSync).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON in custom config file', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const configs = getAllModelConfigs('/path/to/invalid/models.json');
      const builtInModels = modelRegistry.getBuiltInModels();

      expect(configs.length).toBe(builtInModels.length);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load custom model configs'),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should validate custom model configurations', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

      const customConfig = {
        models: [
          {
            name: 'valid-model',
            tokenLimit: 100_000,
            description: 'Valid model',
            provider: 'custom'
          },
          {
            // Missing name
            tokenLimit: 100_000,
            description: 'Invalid model without name',
            provider: 'custom'
          },
          {
            name: 'invalid-token-limit',
            tokenLimit: -1, // Invalid token limit
            description: 'Invalid token limit',
            provider: 'custom'
          },
          {
            name: 'string-token-limit',
            tokenLimit: 'not-a-number' as any, // Invalid type
            description: 'Invalid token limit type',
            provider: 'custom'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const configs = getAllModelConfigs('/path/to/custom/models.json');
      const builtInModels = modelRegistry.getBuiltInModels();

      // Should only include the valid custom model and built-in models
      const customModels = configs.filter(c => !builtInModels.some(b => b.name === c.name));
      expect(customModels).toHaveLength(1);
      expect(customModels[0].name).toBe('valid-model');

      expect(consoleSpy).toHaveBeenCalledTimes(3); // 3 invalid models

      consoleSpy.mockRestore();
    });
  });

  describe('Legacy API Compatibility', () => {
    it('should support getModelConfig function', () => {
      const config = getModelConfig('deepseek-chat');
      expect(config).toBeDefined();
      expect(config?.name).toBe('deepseek-chat');
    });

    it('should support isModelSupported function', () => {
      expect(isModelSupported('deepseek-chat')).toBe(true);
      expect(isModelSupported('unknown-model')).toBe(false);
    });

    it('should support getTokenLimit function', () => {
      expect(getTokenLimit('deepseek-chat')).toBe(128_000);
      expect(getTokenLimit('gemini-1.5-pro')).toBe(2_097_152);
      expect(getTokenLimit('unknown-model')).toBe(DEFAULT_TOKEN_LIMIT);
    });

    it('should support getDefaultModelsConfigPath function', () => {
      const projectDir = '/path/to/project';
      const expectedPath = path.join(projectDir, '.wren', 'models.json');
      expect(getDefaultModelsConfigPath(projectDir)).toBe(expectedPath);
    });
  });

  describe('Cache Management', () => {
    it('should cache configurations', () => {
      const configs1 = getAllModelConfigs();
      const configs2 = getAllModelConfigs();
      expect(configs1).toEqual(configs2);
    });

    it('should clear cache when requested', () => {
      // Load configs to populate cache
      getAllModelConfigs();

      // Clear cache
      clearModelConfigCache();

      // Loading again should work (no errors)
      const configs = getAllModelConfigs();
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should clear cache when custom models are loaded', () => {
      // Load initial configs
      const initialConfigs = getAllModelConfigs();

      // Load custom config
      const customConfig = {
        models: [
          {
            name: 'custom-model',
            tokenLimit: 200_000,
            provider: 'custom'
          }
        ]
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(customConfig));

      const configsWithCustom = getAllModelConfigs('/path/to/custom/models.json');

      expect(configsWithCustom.length).toBe(initialConfigs.length + 1);
      expect(configsWithCustom.find(c => c.name === 'custom-model')).toBeDefined();
    });
  });
});