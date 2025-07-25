/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Providers } from '../providers.js';
import { ModelConfig } from './base.js';

export const cohereModels: ModelConfig[] = [
  {
    name: 'command-r-plus-08-2024',
    tokenLimit: 128_000,
    description: 'Command R+ - Most capable model',
    provider: Providers.COHERE,
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'command-r-08-2024',
    tokenLimit: 128_000,
    description: 'Command R - Balanced model',
    provider: Providers.COHERE,
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'embed-english-v3.0',
    tokenLimit: 512,
    description: 'English embedding model',
    provider: Providers.COHERE,
    capabilities: {
      embedding: true,
    }
  },
  {
    name: 'embed-multilingual-v3.0',
    tokenLimit: 512,
    description: 'Multilingual embedding model',
    provider: Providers.COHERE,
    capabilities: {
      embedding: true,
    }
  }
];