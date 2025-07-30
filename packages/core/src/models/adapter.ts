/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatDeepSeek } from "@langchain/deepseek";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";
import { Temperature, TopP } from "../types/llmParameters.js";

export interface LlmModelConfig {
    provider: Provider;
    model: Model;
    temperature?: Temperature;
    topP?: TopP;
    apiKey?: string;
    maxRetries?: number;
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
    const configWithRetries = {
        maxRetries: 3,
        ...config
    };

    switch (configWithRetries.provider) {
        case Provider.DEEPSEEK:
            return new ChatDeepSeek(configWithRetries);
        // Add cases for other providers as needed
        // case 'openai':
        //     return new ChatOpenAI({...});
        // case 'anthropic':
        //     return new ChatAnthropic({...});
        default:
            throw new Error();
    }
}

export function isAgentSpecificConfig(config: LlmConfig): config is AgentSpecificLlmConfig {
    return (config as AgentSpecificLlmConfig).agentModels !== undefined;
}