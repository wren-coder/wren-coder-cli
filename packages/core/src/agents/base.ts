/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { StructuredTool } from "@langchain/core/tools";
import { InteropZodType } from "@langchain/core/utils/types";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { GenerationService } from "../services/generationService.js";
import { AgentInterface } from "./agentInterface.js";

export interface BaseAgentConfig {
    name: string;
    description: string;
    prompt: string;
    llm: BaseChatModel;
    tools?: StructuredTool[];
    responseFormat?: InteropZodType;
}

export abstract class BaseAgent implements AgentInterface {
    protected name: string;
    protected description: string;
    protected generationService: GenerationService;

    constructor(config: BaseAgentConfig) {
        this.name = config.name;
        this.description = config.description;

        const agent = createReactAgent({
            name: config.name,
            prompt: config.prompt,
            llm: config.llm,
            tools: config.tools ?? [],
            responseFormat: config.responseFormat,
        });
        this.generationService = new GenerationService(agent);
    }

    abstract invoke(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State>;

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }
}