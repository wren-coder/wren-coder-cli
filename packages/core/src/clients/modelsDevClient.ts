/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModelsDevPricing {
  prompt?: number; // cost per 1M tokens
  completion?: number; // cost per 1M tokens
  currency?: string;
}

export interface ModelsDevModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  context_length?: number;
  pricing?: ModelsDevPricing;
  capabilities?: {
    vision?: boolean;
    function_calling?: boolean;
    reasoning?: boolean;
    code_generation?: boolean;
    multimodal?: boolean;
  };
  deprecated?: boolean;
  release_date?: string;
}

export interface ModelsDevResponse {
  models: ModelsDevModel[];
  last_updated: string;
}

/**
 * Client for the models.dev API
 */
export class ModelsDevClient {
  private static readonly API_URL = 'https://models.dev/api.json';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  
  private cache: ModelsDevResponse | null = null;
  private cacheTimestamp: number = 0;

  /**
   * Fetch latest model data from models.dev
   */
  async fetchModels(): Promise<ModelsDevResponse> {
    try {
      const response = await fetch(ModelsDevClient.API_URL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: ModelsDevResponse = await response.json();
      
      // Update cache
      this.cache = data;
      this.cacheTimestamp = Date.now();
      
      return data;
    } catch (error) {
      console.warn('Failed to fetch models from models.dev:', error);
      
      // Return cached data if available
      if (this.cache) {
        console.warn('Using cached model data');
        return this.cache;
      }
      
      // Return empty response as fallback
      return {
        models: [],
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Get model data with caching
   */
  async getModels(): Promise<ModelsDevResponse> {
    const now = Date.now();
    const isCacheValid = this.cache && (now - this.cacheTimestamp < ModelsDevClient.CACHE_DURATION);
    
    if (isCacheValid) {
      return this.cache!;
    }
    
    return this.fetchModels();
  }

  /**
   * Get model by ID or name
   */
  async getModel(modelId: string): Promise<ModelsDevModel | null> {
    try {
      const data = await this.getModels();
      return data.models.find(m => m.id === modelId || m.name === modelId) || null;
    } catch (error) {
      console.warn(`Failed to get model ${modelId}:`, error);
      return null;
    }
  }

  /**
   * Search models by name, provider, or description
   */
  async searchModels(query: string): Promise<ModelsDevModel[]> {
    try {
      const data = await this.getModels();
      const lowerQuery = query.toLowerCase();
      
      return data.models.filter(model => 
        model.id.toLowerCase().includes(lowerQuery) ||
        model.name.toLowerCase().includes(lowerQuery) ||
        model.provider.toLowerCase().includes(lowerQuery) ||
        model.description?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.warn('Failed to search models:', error);
      return [];
    }
  }

  /**
   * Get all models for a specific provider
   */
  async getModelsByProvider(provider: string): Promise<ModelsDevModel[]> {
    try {
      const data = await this.getModels();
      return data.models.filter(model => 
        model.provider.toLowerCase() === provider.toLowerCase()
      );
    } catch (error) {
      console.warn(`Failed to get models for provider ${provider}:`, error);
      return [];
    }
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { cached: boolean; age: number; lastUpdated?: string } {
    const age = this.cache ? Date.now() - this.cacheTimestamp : 0;
    return {
      cached: !!this.cache,
      age,
      lastUpdated: this.cache?.last_updated
    };
  }
}

// Export singleton instance
export const modelsDevClient = new ModelsDevClient();