/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelConfig } from './base.js';

export const anthropicModels: ModelConfig[] = [
  {
    name: 'claude-3-5-sonnet-20241022',
    tokenLimit: 200_000,
    description: 'Claude 3.5 Sonnet - Most intelligent model',
    provider: 'anthropic',
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'claude-3-5-haiku-20241022',
    tokenLimit: 200_000,
    description: 'Claude 3.5 Haiku - Fast and cost-effective',
    provider: 'anthropic',
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'claude-3-opus-20240229',
    tokenLimit: 200_000,
    description: 'Claude 3 Opus - Most powerful model for complex tasks',
    provider: 'anthropic',
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    }
  }
];