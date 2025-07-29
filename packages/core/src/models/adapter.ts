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
    maxRetries?: number; // Add retry configuration
}

interface DefaultLlmConfig {
    defaultModel: LlmModelConfig;
    agentModels?: {
        coder?: LlmModelConfig;
        planner?: LlmModelConfig;
        evaluator?: LlmModelConfig;
        [key: string]: LlmModelConfig | undefined;
    };
}

interface AgentSpecificLlmConfig {
    defaultModel?: LlmModelConfig;
    agentModels: {
        coder: LlmModelConfig;
        planner: LlmModelConfig;
        evaluator: LlmModelConfig;
        [key: string]: LlmModelConfig;
    };
}

export type LlmConfig = DefaultLlmConfig | AgentSpecificLlmConfig;

export function createLlmFromConfig(config: LlmModelConfig): BaseChatModel {
    // Set default maxRetries if not provided
    const configWithRetries = {
        maxRetries: 3,
        ...config
    };

    switch (configWithRetries.provider) {
        case 'deepseek':
            return new ChatDeepSeek(configWithRetries);
        // Add cases for other providers as needed
        // case 'openai':
        //     return new ChatOpenAI({...});
        // case 'anthropic':
        //     return new ChatAnthropic({...});
        default:
            // Default to DeepSeek if provider is not recognized
            return new ChatDeepSeek(configWithRetries);
    }
}

export function isAgentSpecificConfig(config: LlmConfig): config is AgentSpecificLlmConfig {
    return (config as AgentSpecificLlmConfig).agentModels !== undefined;
}