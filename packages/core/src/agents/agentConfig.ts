/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Model } from "../types/model.js";
import { Provider } from "../types/provider.js";
import { CompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig, LlmModelConfig } from "../models/adapter.js";

export interface AgentConfig {
    llm: BaseChatModel;
    workingDir: string;
    model: Model;
    provider: Provider;
    compressionConfig?: CompressionConfig;
}


export function createAgentConfig(config: LlmModelConfig, workingDir: string): AgentConfig {
    return {
        llm: createLlmFromConfig(config),
        workingDir,
        ...config
    }

}