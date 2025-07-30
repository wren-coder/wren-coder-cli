/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CompressionConfig } from "../utils/compression.js";
import { LlmModelConfig } from "../models/adapter.js";

export interface AgentConfig {
    workingDir: string;
    llmModelConfig: LlmModelConfig;
    compressionConfig?: CompressionConfig;
    graphRecursionLimit?: number;
}


export function createAgentConfig(workingDir: string, llmModelConfig: LlmModelConfig, compressionConfig?: CompressionConfig, graphRecursionLimit?: number): AgentConfig {
    return {
        workingDir,
        llmModelConfig,
        compressionConfig,
        graphRecursionLimit,
    }

}