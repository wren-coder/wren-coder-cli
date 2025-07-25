/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Providers } from '../providers.js';
import { ModelConfig } from './base.js';

export const openaiModels: ModelConfig[] = [
  {
    name: 'gpt-4o',
    tokenLimit: 128_000,
    description: 'GPT-4o - Most advanced multimodal model',
    provider: Providers.OPENAI,
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: 'gpt-4o-mini',
    tokenLimit: 128_000,
    description: 'GPT-4o Mini - Affordable and intelligent small model',
    provider: Providers.OPENAI,
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: 'gpt-4-turbo',
    tokenLimit: 128_000,
    description: 'GPT-4 Turbo - Fast and capable model',
    provider: Providers.OPENAI,
    capabilities: {
      vision: true,
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: 'gpt-3.5-turbo',
    tokenLimit: 16_385,
    description: 'GPT-3.5 Turbo - Fast and affordable model',
    provider: Providers.OPENAI,
    capabilities: {
      functionCalling: true,
      streaming: true,
    },
  },
  {
    name: 'text-embedding-3-large',
    tokenLimit: 8_191,
    description: 'Most capable embedding model',
    provider: Providers.OPENAI,
    capabilities: {
      embedding: true,
    },
  },
  {
    name: 'text-embedding-3-small',
    tokenLimit: 8_191,
    description: 'Smaller and more efficient embedding model',
    provider: Providers.OPENAI,
    capabilities: {
      embedding: true,
    },
  },
];
