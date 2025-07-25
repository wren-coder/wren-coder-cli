/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export const DEFAULT_MODEL = 'deepseek-chat';
export const DEFAULT_THINKING_MODEL = 'deepseek-reasoner';
export const DEFAULT_EMBEDDING_MODEL = 'gemini-embedding-001';
export const DEFAULT_TOKEN_LIMIT = 128_000;

export interface ModelConfig {
  name: string;
  tokenLimit: number;
  description?: string;
  provider?: string;
  capabilities?: {
    reasoning?: boolean;
    imageGeneration?: boolean;
    embedding?: boolean;
  };
}

export interface ModelsConfigFile {
  models: ModelConfig[];
}

// Built-in model configurations
export const BUILT_IN_MODEL_CONFIGS: ModelConfig[] = [
  {
    name: 'deepseek-chat',
    tokenLimit: 128_000,
    description: 'DeepSeek Chat model',
    provider: 'deepseek',
    capabilities: {}
  },
  {
    name: 'deepseek-reasoner',
    tokenLimit: 128_000,
    description: 'DeepSeek Reasoner model with advanced reasoning capabilities',
    provider: 'deepseek',
    capabilities: {
      reasoning: true
    }
  },
  {
    name: 'gemini-1.5-pro',
    tokenLimit: 2_097_152,
    description: 'Gemini 1.5 Pro model',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-1.5-flash',
    tokenLimit: 1_048_576,
    description: 'Gemini 1.5 Flash model',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.5-pro-preview-05-06',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.5 Pro Preview (05-06)',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.5-pro-preview-06-05',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.5 Pro Preview (06-05)',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.5-pro',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.5 Pro model',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.5-flash-preview-05-20',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.5 Flash Preview (05-20)',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.5-flash',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.5 Flash model',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.0-flash',
    tokenLimit: 1_048_576,
    description: 'Gemini 2.0 Flash model',
    provider: 'google',
    capabilities: {}
  },
  {
    name: 'gemini-2.0-flash-preview-image-generation',
    tokenLimit: 32_000,
    description: 'Gemini 2.0 Flash Preview for image generation',
    provider: 'google',
    capabilities: {
      imageGeneration: true
    }
  },
  {
    name: 'gemini-embedding-001',
    tokenLimit: 1_048_576,
    description: 'Gemini embedding model',
    provider: 'google',
    capabilities: {
      embedding: true
    }
  }
];

let cachedModelConfigs: ModelConfig[] | null = null;

/**
 * Load custom model configurations from a JSON file
 */
function loadCustomModelConfigs(configPath: string): ModelConfig[] {
  try {
    if (!fs.existsSync(configPath)) {
      return [];
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config: ModelsConfigFile = JSON.parse(content);

    if (!config.models || !Array.isArray(config.models)) {
      console.warn(`Invalid models config file format at ${configPath}. Expected { "models": [...] }`);
      return [];
    }

    // Validate each model config
    return config.models.filter((model): model is ModelConfig => {
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
  } catch (error) {
    console.warn(`Failed to load custom model configs from ${configPath}:`, error);
    return [];
  }
}

/**
 * Get all available model configurations (built-in + custom)
 */
export function getAllModelConfigs(customConfigPath?: string): ModelConfig[] {
  if (cachedModelConfigs && !customConfigPath) {
    return [...cachedModelConfigs];
  }

  const builtInConfigs = [...BUILT_IN_MODEL_CONFIGS];

  if (!customConfigPath) {
    cachedModelConfigs = builtInConfigs;
    return [...cachedModelConfigs];
  }

  const customConfigs = loadCustomModelConfigs(customConfigPath);

  // Merge configs, with custom configs taking precedence for duplicate names
  const configMap = new Map<string, ModelConfig>();

  // Add built-in configs first
  builtInConfigs.forEach(config => {
    configMap.set(config.name, config);
  });

  // Override with custom configs
  customConfigs.forEach(config => {
    configMap.set(config.name, config);
  });

  const allConfigs = Array.from(configMap.values());

  if (!customConfigPath) {
    cachedModelConfigs = allConfigs;
  }

  return [...allConfigs];
}

/**
 * Get configuration for a specific model
 */
export function getModelConfig(modelName: string, customConfigPath?: string): ModelConfig | undefined {
  const allConfigs = getAllModelConfigs(customConfigPath);
  return allConfigs.find(config => config.name === modelName);
}

/**
 * Check if a model is supported
 */
export function isModelSupported(modelName: string, customConfigPath?: string): boolean {
  return getModelConfig(modelName, customConfigPath) !== undefined;
}

/**
 * Get token limit for a model
 */
export function getTokenLimit(modelName: string, customConfigPath?: string): number {
  const config = getModelConfig(modelName, customConfigPath);
  return config?.tokenLimit ?? DEFAULT_TOKEN_LIMIT;
}

/**
 * Clear the cached model configurations (useful for testing or when config changes)
 */
export function clearModelConfigCache(): void {
  cachedModelConfigs = null;
}

/**
 * Get the default models config file path relative to a project directory
 */
export function getDefaultModelsConfigPath(projectDir: string): string {
  return path.join(projectDir, '.wren', 'models.json');
}
