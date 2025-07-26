/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ModelsDevClient,
  modelsDevClient,
  ModelsDevResponse,
} from './modelsDevClient.js';

// Mock fetch
global.fetch = vi.fn();
const mockFetch = vi.mocked(fetch);

describe('ModelsDevClient', () => {
  let client: ModelsDevClient;

  beforeEach(() => {
    client = new ModelsDevClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    client.clearCache();
  });

  const mockModelsDevResponse: ModelsDevResponse = {
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        description: 'Most advanced multimodal model',
        context_length: 128000,
        pricing: {
          prompt: 2.5,
          completion: 10.0,
          currency: 'USD',
        },
        capabilities: {
          vision: true,
          function_calling: true,
          reasoning: false,
        },
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        description: 'Most intelligent model',
        context_length: 200000,
        pricing: {
          prompt: 3.0,
          completion: 15.0,
          currency: 'USD',
        },
        capabilities: {
          vision: true,
          function_calling: true,
          reasoning: false,
        },
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        provider: 'deepseek',
        description: 'Model with reasoning capabilities',
        context_length: 128000,
        pricing: {
          prompt: 0.55,
          completion: 2.19,
          currency: 'USD',
        },
        capabilities: {
          reasoning: true,
          function_calling: true,
        },
      },
    ],
    last_updated: '2025-01-25T12:00:00Z',
  };

  describe('fetchModels', () => {
    it('should fetch models from API successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);

      const result = await client.fetchModels();

      expect(mockFetch).toHaveBeenCalledWith('https://models.dev/api.json');
      expect(result).toEqual(mockModelsDevResponse);
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const result = await client.fetchModels();

      expect(result.models).toEqual([]);
      expect(result.last_updated).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch models from models.dev:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should handle network errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.fetchModels();

      expect(result.models).toEqual([]);
      expect(result.last_updated).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch models from models.dev:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should use cached data when API fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // First successful call to populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);

      await client.fetchModels();

      // Second call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.fetchModels();

      expect(result).toEqual(mockModelsDevResponse);
      expect(consoleSpy).toHaveBeenCalledWith('Using cached model data');

      consoleSpy.mockRestore();
    });
  });

  describe('getModels', () => {
    it('should return cached data when valid', async () => {
      // Populate cache
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);

      const result1 = await client.getModels();
      const result2 = await client.getModels();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should fetch new data when cache is expired', async () => {
      // Mock cache duration to be very short for testing
      const originalCacheDuration = (ModelsDevClient as any).CACHE_DURATION;
      (ModelsDevClient as any).CACHE_DURATION = 1; // 1ms

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockModelsDevResponse,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockModelsDevResponse,
            last_updated: '2025-01-25T13:00:00Z',
          }),
        } as Response);

      await client.getModels();

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 2));

      await client.getModels();

      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Restore original cache duration
      (ModelsDevClient as any).CACHE_DURATION = originalCacheDuration;
    });
  });

  describe('getModel', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);
    });

    it('should find model by ID', async () => {
      const model = await client.getModel('gpt-4o');

      expect(model).toBeDefined();
      expect(model?.id).toBe('gpt-4o');
      expect(model?.name).toBe('GPT-4o');
    });

    it('should find model by name', async () => {
      const model = await client.getModel('Claude 3.5 Sonnet');

      expect(model).toBeDefined();
      expect(model?.id).toBe('claude-3-5-sonnet-20241022');
      expect(model?.name).toBe('Claude 3.5 Sonnet');
    });

    it('should return null for unknown model', async () => {
      const model = await client.getModel('unknown-model');
      expect(model).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const model = await client.getModel('gpt-4o');

      expect(model).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('searchModels', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);
    });

    it('should search by model ID', async () => {
      const results = await client.searchModels('gpt');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('gpt-4o');
    });

    it('should search by model name', async () => {
      const results = await client.searchModels('Claude');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Claude 3.5 Sonnet');
    });

    it('should search by provider', async () => {
      const results = await client.searchModels('anthropic');

      expect(results).toHaveLength(1);
      expect(results[0].provider).toBe('anthropic');
    });

    it('should search by description', async () => {
      const results = await client.searchModels('reasoning');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('deepseek-reasoner');
    });

    it('should return empty array for no matches', async () => {
      const results = await client.searchModels('nonexistent');
      expect(results).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await client.searchModels('gpt');

      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getModelsByProvider', () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);
    });

    it('should filter models by provider', async () => {
      const openaiModels = await client.getModelsByProvider('openai');

      expect(openaiModels).toHaveLength(1);
      expect(openaiModels[0].provider).toBe('openai');
    });

    it('should be case insensitive', async () => {
      const anthropicModels = await client.getModelsByProvider('ANTHROPIC');

      expect(anthropicModels).toHaveLength(1);
      expect(anthropicModels[0].provider).toBe('anthropic');
    });

    it('should return empty array for unknown provider', async () => {
      const results = await client.getModelsByProvider('unknown');
      expect(results).toHaveLength(0);
    });
  });

  describe('Cache Management', () => {
    it('should provide cache status', () => {
      const status = client.getCacheStatus();

      expect(status.cached).toBe(false);
      expect(status.age).toBe(0);
      expect(status.lastUpdated).toBeUndefined();
    });

    it('should update cache status after fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);

      await client.fetchModels();

      const status = client.getCacheStatus();

      expect(status.cached).toBe(true);
      expect(status.age).toBeGreaterThanOrEqual(0);
      expect(status.lastUpdated).toBe(mockModelsDevResponse.last_updated);
    });

    it('should clear cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockModelsDevResponse,
      } as Response);

      await client.fetchModels();

      let status = client.getCacheStatus();
      expect(status.cached).toBe(true);

      client.clearCache();

      status = client.getCacheStatus();
      expect(status.cached).toBe(false);
      expect(status.age).toBe(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(modelsDevClient).toBeInstanceOf(ModelsDevClient);
    });
  });
});
