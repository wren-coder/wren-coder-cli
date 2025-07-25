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

import { Models } from '../models.js';
import { Providers } from '../providers.js';
import { ModelConfig } from './base.js';

export const deepseekModels: ModelConfig[] = [
  {
    name: Models.DEEPSEEK_CHAT,
    tokenLimit: 128_000,
    description: 'DeepSeek Chat model for general conversation',
    provider: Providers.DEEPSEEK,
    capabilities: {
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: Models.DEEPSEEK_REASONER,
    tokenLimit: 128_000,
    description: 'DeepSeek Reasoner model with advanced reasoning capabilities',
    provider: Providers.DEEPSEEK,
    capabilities: {
      reasoning: true,
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: Models.DEEPSEEK_CODER,
    tokenLimit: 128_000,
    description: 'DeepSeek Coder model optimized for code generation',
    provider: Providers.DEEPSEEK,
    capabilities: {
      functionCalling: true,
      streaming: true,
    },
  },
];
