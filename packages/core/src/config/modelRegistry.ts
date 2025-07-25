/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ModelConfig } from './providers/base.js';
import {
  deepseekModels,
  googleModels,
  openaiModels,
  anthropicModels,
  metaModels,
  mistralModels,
  cohereModels
} from './providers/index.js';

export const DEFAULT_MODEL = 'deepseek-chat';
export const DEFAULT_THINKING_MODEL = 'deepseek-reasoner';
export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
export const DEFAULT_TOKEN_LIMIT = 128_000;

export interface ModelsConfigFile {
  models: ModelConfig[];
}

// All built-in models from providers
const BUILT_IN_MODELS: ModelConfig[] = [
  ...deepseekModels,
  ...googleModels,
  ...openaiModels,
  ...anthropicModels,
  ...metaModels,
  ...mistralModels,
  ...cohereModels,
];

/**
 * Central registry for all model configurations
 */
class ModelRegistry {
  private customModels: ModelConfig[] = [];
  private cachedAllModels: ModelConfig[] | null = null;

  /**
   * Get all built-in models
   */
  getBuiltInModels(): ModelConfig[] {
    return [...BUILT_IN_MODELS];
  }

  /**
   * Load custom models from a config file
   */
  loadCustomModels(configPath: string): void {
    try {
      if (!fs.existsSync(configPath)) {
        this.customModels = [];
        return;
      }

      const content = fs.readFileSync(configPath, 'utf-8');
      const config: ModelsConfigFile = JSON.parse(content);

      if (!config.models || !Array.isArray(config.models)) {
        console.warn(`Invalid models config file format at ${configPath}. Expected { "models": [...] }`);
        this.customModels = [];
        return;
      }

      // Validate each model config
      this.customModels = config.models.filter((model): model is ModelConfig => {
        if (!model.name || typeof model.name !== 'string') {
          console.warn(`Skipping model config with invalid name: ${JSON.stringify(model)}`);
          return false;
        }

        if (!model.tokenLimit || typeof model.tokenLimit !== 'number' || model.tokenLimit <= 0) {
          console.warn(`Skipping model config "${model.name}" with invalid tokenLimit: ${model.tokenLimit}`);
          return false;
        }

        return true;
      });

      // Clear cache when custom models are loaded
      this.cachedAllModels = null;
    } catch (error) {
      console.warn(`Failed to load custom model configs from ${configPath}:`, error);
      this.customModels = [];
    }
  }

  /**
   * Get all models (built-in + custom)
   */
  listModels(): ModelConfig[] {
    if (this.cachedAllModels) {
      return [...this.cachedAllModels];
    }

    const builtInModels = this.getBuiltInModels();
    const configMap = new Map<string, ModelConfig>();

    // Add built-in models first
    builtInModels.forEach(model => {
      configMap.set(model.name, model);
    });

    // Override with custom models
    this.customModels.forEach(model => {
      configMap.set(model.name, model);
    });

    this.cachedAllModels = Array.from(configMap.values());
    return [...this.cachedAllModels];
  }

  /**
   * Get model by name
   */
  getModel(modelName: string): ModelConfig | undefined {
    return this.listModels().find(model => model.name === modelName);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(providerName: string): ModelConfig[] {
    return this.listModels().filter(model => model.provider === providerName);
  }

  /**
   * Get models by capability
   */
  getModelsByCapability(capability: keyof ModelConfig['capabilities']): ModelConfig[] {
    return this.listModels().filter(model => model.capabilities?.[capability] === true);
  }

  /**
   * Search models by name or description
   */
  searchModels(query: string): ModelConfig[] {
    const lowerQuery = query.toLowerCase();
    return this.listModels().filter(model =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.description?.toLowerCase().includes(lowerQuery) ||
      model.provider.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    const providers = new Set(this.listModels().map(model => model.provider));
    return Array.from(providers);
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cachedAllModels = null;
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

// Legacy API compatibility functions
export function getAllModelConfigs(customConfigPath?: string): ModelConfig[] {
  if (customConfigPath) {
    modelRegistry.loadCustomModels(customConfigPath);
  }
  return modelRegistry.listModels();
}

export function getModelConfig(modelName: string, customConfigPath?: string): ModelConfig | undefined {
  if (customConfigPath) {
    modelRegistry.loadCustomModels(customConfigPath);
  }
  return modelRegistry.getModel(modelName);
}

export function isModelSupported(modelName: string, customConfigPath?: string): boolean {
  return getModelConfig(modelName, customConfigPath) !== undefined;
}

export function getTokenLimit(modelName: string, customConfigPath?: string): number {
  const config = getModelConfig(modelName, customConfigPath);
  return config?.tokenLimit ?? DEFAULT_TOKEN_LIMIT;
}

export function clearModelConfigCache(): void {
  modelRegistry.clearCache();
}

export function getDefaultModelsConfigPath(projectDir: string): string {
  return path.join(projectDir, '.wren', 'models.json');
}