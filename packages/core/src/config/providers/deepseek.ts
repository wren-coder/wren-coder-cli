/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelConfig } from './base.js';

export const deepseekModels: ModelConfig[] = [
  {
    name: 'deepseek-chat',
    tokenLimit: 128_000,
    description: 'DeepSeek Chat model for general conversation',
    provider: 'deepseek',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'deepseek-reasoner',
    tokenLimit: 128_000,
    description: 'DeepSeek Reasoner model with advanced reasoning capabilities',
    provider: 'deepseek',
    capabilities: {
      reasoning: true,
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'deepseek-coder',
    tokenLimit: 128_000,
    description: 'DeepSeek Coder model optimized for code generation',
    provider: 'deepseek',
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  }
];