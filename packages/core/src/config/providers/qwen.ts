/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Models } from '../models.js';
import { Providers } from '../providers.js';
import { ModelConfig } from './base.js';

export const qwenModels: ModelConfig[] = [
  {
    name: Models.QWEN_3_CODER,
    tokenLimit: 262_144,
    description: 'Qwen 3 Coder - The most agentic code model to date',
    provider: Providers.QWEN,
    capabilities: {
      functionCalling: true,
      streaming: true,
    },
  },
];
