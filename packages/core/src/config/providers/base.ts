/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ModelConfig {
  name: string;
  tokenLimit: number;
  description?: string;
  provider: string;
  capabilities?: {
    reasoning?: boolean;
    imageGeneration?: boolean;
    embedding?: boolean;
    vision?: boolean;
    functionCalling?: boolean;
    streaming?: boolean;
  };
  deprecated?: boolean;
  releaseDate?: string;
}