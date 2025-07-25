/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelConfig } from './base.js';

export const metaModels: ModelConfig[] = [
  {
    name: 'llama-3.3-70b-instruct',
    tokenLimit: 128_000,
    description: 'Llama 3.3 70B - Latest Llama model',
    provider: 'meta',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'llama-3.2-90b-instruct',
    tokenLimit: 128_000,
    description: 'Llama 3.2 90B - Large instruction-following model',
    provider: 'meta',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'llama-3.2-11b-vision-instruct',
    tokenLimit: 128_000,
    description: 'Llama 3.2 11B Vision - Multimodal model',
    provider: 'meta',
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'llama-3.2-3b-instruct',
    tokenLimit: 128_000,
    description: 'Llama 3.2 3B - Efficient small model',
    provider: 'meta',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'llama-3.2-1b-instruct',
    tokenLimit: 128_000,
    description: 'Llama 3.2 1B - Ultra-lightweight model',
    provider: 'meta',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  }
];