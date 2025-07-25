/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { modelsDevClient, ModelsDevPricing } from '../clients/modelsDevClient.js';

/**
 * Get pricing information for a model from models.dev
 */
export async function getModelPricing(modelId: string): Promise<ModelsDevPricing | null> {
  try {
    const model = await modelsDevClient.getModel(modelId);
    return model?.pricing || null;
  } catch (error) {
    console.warn(`Failed to get pricing for model ${modelId}:`, error);
    return null;
  }
}