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
import { ModelNotFoundError } from './ModelNotFoundError.js';

export interface ModelsConfigFile {
  models: ModelConfig[];
}

const CUSTOM_MODEL_CONFIG_PATH = path.join('.wren', 'models.json');

// All built-in models from providers
const DEFAULT_MODELS: ModelConfig[] = [
  ...deepseekModels,
  ...googleModels,
  ...openaiModels,
  ...anthropicModels,
  ...metaModels,
  ...mistralModels,
  ...cohereModels,
];

const DEFAULT_MODELS_MAP: Map<string, ModelConfig> = new Map(
  DEFAULT_MODELS.map(model => [model.name, model])
);

const DEFAULT_PROVIDERS = new Set(DEFAULT_MODELS.map(model => model.provider));

const customModels: ModelConfig[] = loadModels();

/**
 * Get all built-in models
 */
export function listDefaultModels(): ModelConfig[] {
  return DEFAULT_MODELS;
}

/**
 * Load custom models from a config file
 */
function loadModels() {
  let models: ModelConfig[] = [];
  try {
    if (fs.existsSync(CUSTOM_MODEL_CONFIG_PATH)) {
      return models;
    }

    const content = fs.readFileSync(CUSTOM_MODEL_CONFIG_PATH, 'utf-8');
    const config: ModelsConfigFile = JSON.parse(content);

    if (!config.models || !Array.isArray(config.models)) {
      console.warn(`Invalid models config file format at ${CUSTOM_MODEL_CONFIG_PATH}. Expected { "models": [...] }`);
      return models;
    }

    // Validate each model config
    models = config.models.filter((model): model is ModelConfig => {
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
    console.warn(`Failed to load custom model configs from ${CUSTOM_MODEL_CONFIG_PATH}:`, error);
    models = [];
  }
  return models;
};

/**
 * Get all models (built-in + custom)
 */
export function listModels(): ModelConfig[] {
  return [...DEFAULT_MODELS, ...customModels]
}

/**
 * Get model by name
 */
export function getModel(modelName: string): ModelConfig | undefined {
  return DEFAULT_MODELS_MAP.get(modelName);
}

/**
 * Get models by provider
 */
export function getModelsByProvider(providerName: string): ModelConfig[] {
  return listModels().filter(model => model.provider === providerName);
}

/**
 * Get models by capability
 */
export function getModelsByCapability(capability: keyof ModelConfig['capabilities']): ModelConfig[] {
  return listModels().filter(model => model.capabilities?.[capability] === true);
}


/**
 * Get available providers
 */
export function listProviders(): string[] {
  const customProviders = new Set(customModels.map(m => m.provider));
  return [...Array.from(DEFAULT_PROVIDERS), ...Array.from(customProviders)];
}


export function getModelConfig(modelName: string): ModelConfig {
  const model = getModel(modelName);
  if (!model) {
    throw new ModelNotFoundError(modelName)
  }
  return model;
}

export function isModelSupported(modelName: string): boolean {
  return getModelConfig(modelName) !== undefined;
}

export function getTokenLimit(modelName: string): number {
  const config = getModelConfig(modelName);
  return config.tokenLimit;
}
