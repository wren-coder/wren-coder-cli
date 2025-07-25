/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Providers } from '../providers.js';
import { ModelConfig } from './base.js';

export const mistralModels: ModelConfig[] = [
  {
    name: 'mistral-large-2411',
    tokenLimit: 128_000,
    description: 'Mistral Large - Most capable model',
    provider: Providers.MISTRAL,
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'mistral-small-2412',
    tokenLimit: 128_000,
    description: 'Mistral Small - Cost-effective model',
    provider: Providers.MISTRAL,
    capabilities: {
      functionCalling: true,
      streaming: true,
    }
  },
  {
    name: 'pixtral-12b-2409',
    tokenLimit: 128_000,
    description: 'Pixtral 12B - Multimodal model',
    provider: Providers.MISTRAL,
    capabilities: {
      vision: true,
      streaming: true,
    }
  }
];