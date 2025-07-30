/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatAnthropic } from "@langchain/anthropic";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";
import { Temperature, TopP } from "../types/llmParameters.js";
import { ProviderNotFoundError } from "../errors/ProviderNotFoundError.js";
import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatOpenAI } from "@langchain/openai";

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
        maxRetries: config.maxRetries ?? 3,
        ...config
    };


    switch (configWithRetries.provider) {
        case Provider.DEEPSEEK:
            {
                return new ChatDeepSeek(configWithRetries);
            }

        case Provider.OPENAI:
            {
                return new ChatOpenAI(configWithRetries);
            }

        case Provider.ANTHROPIC:
            {
                return new ChatAnthropic(configWithRetries);
            }

        default:
            console.error(`Failed to create LLM for provider ${configWithRetries.provider}`);
            throw new ProviderNotFoundError(configWithRetries.provider);
    }

}

export function isAgentSpecificConfig(config: LlmConfig): config is AgentSpecificLlmConfig {
    return (config as AgentSpecificLlmConfig).agentModels !== undefined;
}