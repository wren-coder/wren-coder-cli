/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface LlmModelConfig {
    provider: 'deepseek' | 'openai' | 'anthropic' | string;
    model: string;
    temperature?: number;
    topP?: number;
    apiKey?: string;
}

interface DefaultLlmConfig {
    defaultModel: LlmModelConfig;
    agentModels?: {
        coder?: LlmModelConfig;
        planner?: LlmModelConfig;
        supervisor?: LlmModelConfig;
        [key: string]: LlmModelConfig | undefined;
    };
}

interface AgentSpecificLlmConfig {
    defaultModel?: LlmModelConfig;
    agentModels: {
        coder: LlmModelConfig;
        planner: LlmModelConfig;
        supervisor: LlmModelConfig;
        [key: string]: LlmModelConfig;
    };
}

export type LlmConfig = DefaultLlmConfig | AgentSpecificLlmConfig;

export function createLlmFromConfig(config: LlmModelConfig): BaseChatModel {
    switch (config.provider) {
        case 'deepseek':
            return new ChatDeepSeek(config);
        // Add cases for other providers as needed
        // case 'openai':
        //     return new ChatOpenAI({...});
        // case 'anthropic':
        //     return new ChatAnthropic({...});
        default:
            // Default to DeepSeek if provider is not recognized
            return new ChatDeepSeek(config);
    }
}

export function isAgentSpecificConfig(config: LlmConfig): config is AgentSpecificLlmConfig {
    return (config as AgentSpecificLlmConfig).agentModels !== undefined;
}