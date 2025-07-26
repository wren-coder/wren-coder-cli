import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  listDefaultModels,
  listModels,
  getModelConfig,
  isModelSupported,
  getModelsByProvider,
  getModelsByCapability,
  listProviders,
  getTokenLimit,
  ModelConfig,
} from './modelRegistry.js';
import { ModelNotFoundError } from './ModelNotFoundError.js';

vi.mock('node:fs');
vi.mock('node:path');

const MOCK_DEFAULT_MODELS: ModelConfig[] = [
  { name: 'default-model-1', provider: 'provider-1', tokenLimit: 100, capabilities: { chat: true } },
  { name: 'default-model-2', provider: 'provider-2', tokenLimit: 200, capabilities: { chat: false } },
];

const MOCK_CUSTOM_MODELS: ModelConfig[] = [
  { name: 'custom-model-1', provider: 'provider-3', tokenLimit: 300, capabilities: { chat: true } },
  { name: 'custom-model-2', provider: 'provider-4', tokenLimit: 400, capabilities: { chat: false } },
];

describe('modelRegistry', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(fs, 'readFileSync').mockReturnValue(
      JSON.stringify({ models: MOCK_CUSTOM_MODELS }),
    );
    vi.spyOn(path, 'join').mockReturnValue('.wren/models.json');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listDefaultModels', () => {
    it('returns all default models', () => {
      const models = listDefaultModels();
      expect(models).toEqual(expect.arrayContaining(MOCK_DEFAULT_MODELS));
    });
  });

  describe('listModels', () => {
    it('returns all models (default + custom)', () => {
      const models = listModels();
      expect(models).toEqual(
        expect.arrayContaining([...MOCK_DEFAULT_MODELS, ...MOCK_CUSTOM_MODELS]),
      );
    });

    it('handles missing custom models file', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      const models = listModels();
      expect(models).toEqual(expect.arrayContaining(MOCK_DEFAULT_MODELS));
    });
  });

  describe('getModelConfig', () => {
    it('returns the correct model config', () => {
      const model = getModelConfig('default-model-1');
      expect(model).toEqual(MOCK_DEFAULT_MODELS[0]);
    });

    it('throws ModelNotFoundError for unsupported models', () => {
      expect(() => getModelConfig('unknown-model')).toThrow(ModelNotFoundError);
    });
  });

  describe('isModelSupported', () => {
    it('returns true for supported models', () => {
      expect(isModelSupported('default-model-1')).toBe(true);
    });

    it('returns false for unsupported models', () => {
      expect(isModelSupported('unknown-model')).toBe(false);
    });
  });

  describe('getModelsByProvider', () => {
    it('returns models filtered by provider', () => {
      const models = getModelsByProvider('provider-1');
      expect(models).toEqual([MOCK_DEFAULT_MODELS[0]]);
    });
  });

  describe('getModelsByCapability', () => {
    it('returns models filtered by capability', () => {
      const models = getModelsByCapability('chat');
      expect(models).toEqual(
        expect.arrayContaining([MOCK_DEFAULT_MODELS[0], MOCK_CUSTOM_MODELS[0]]),
      );
    });
  });

  describe('listProviders', () => {
    it('returns all unique providers', () => {
      const providers = listProviders();
      expect(providers).toEqual(
        expect.arrayContaining(['provider-1', 'provider-2', 'provider-3', 'provider-4']),
      );
    });
  });

  describe('getTokenLimit', () => {
    it('returns the correct token limit for a model', () => {
      expect(getTokenLimit('default-model-1')).toBe(100);
    });
  });
});