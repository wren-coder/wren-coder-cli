/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StructuredTool } from "@langchain/core/tools";
import { StateAnnotation } from "../chat.js";
import { InteropZodType } from "@langchain/core/utils/types";

export interface BaseAgentConfig {
    name: string;
    description: string;
    prompt: string;
    llm: BaseChatModel;
    tools?: StructuredTool[];
    responseFormat?: InteropZodType;
}

export abstract class BaseAgent {
    protected name: string;
    protected description: string;
    protected prompt: string;
    protected llm: BaseChatModel;
    protected tools: StructuredTool[];
    protected agent;

    constructor(config: BaseAgentConfig) {
        this.name = config.name;
        this.description = config.description;
        this.prompt = config.prompt;
        this.llm = config.llm;
        this.tools = config.tools ?? [];

        this.agent = createReactAgent({
            llm: this.llm,
            tools: this.tools,
            prompt: this.prompt,
            name: this.name,
            stateSchema: StateAnnotation,
            responseFormat: config.responseFormat
        });
    }

    getAgent() {
        return this.agent;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }
}