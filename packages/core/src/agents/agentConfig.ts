/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Model } from "../types/model.js";
import { Provider } from "../types/provider.js";
import { CompressionConfig } from "../utils/compression.js";
import { LlmModelConfig } from "../models/adapter.js";

export interface AgentConfig {
    workingDir: string;
    model: Model;
    provider: Provider;
    llmModelConfig: LlmModelConfig;
    compressionConfig?: CompressionConfig;
}


export function createAgentConfig(workingDir: string, llmModelConfig: LlmModelConfig, compressionConfig?: CompressionConfig): AgentConfig {
    return {
        workingDir,
        llmModelConfig,
        model: llmModelConfig.model,
        provider: llmModelConfig.provider,
        compressionConfig,
    }

}