/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { HumanMessage } from "@langchain/core/messages";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { SUPERVISOR_PROMPT } from "./prompts/supervisor.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createLlmFromConfig, isAgentSpecificConfig, LlmConfig } from "./models/adapter.js";

export interface ChatConfig {
    llmConfig: LlmConfig,
}

export class Chat {
    protected supervisor;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;

    constructor(config: ChatConfig) {
        const { coderLlm, plannerLlm, supervisorLlm } = this.loadModels(config.llmConfig);

        this.coderAgent = new CoderAgent({
            llm: coderLlm,
        });
        this.plannerAgent = new PlannerAgent({
            llm: plannerLlm,
        });

        const subAgents = [
            this.coderAgent,
            this.plannerAgent,
            // ...this.loadCustomSubAgents(config.subAgents)
        ];
        this.supervisor = createSupervisor({
            agents: subAgents.map(agent => agent.getAgent()),
            prompt: SUPERVISOR_PROMPT,
            llm: supervisorLlm,
        })
            .compile();
    }

    private loadModels(config: LlmConfig) {
        let defaultLlm: BaseChatModel | undefined;
        let coderLlm: BaseChatModel;
        let plannerLlm: BaseChatModel;
        let supervisorLlm: BaseChatModel;

        if (isAgentSpecificConfig(config)) {
            coderLlm = createLlmFromConfig(config.agentModels.coder);
            plannerLlm = createLlmFromConfig(config.agentModels.planner);
            supervisorLlm = createLlmFromConfig(config.agentModels.supervisor);
        } else {
            defaultLlm = createLlmFromConfig(config.defaultModel);
            coderLlm = config.agentModels?.coder ?
                createLlmFromConfig(config.agentModels.coder) : defaultLlm;
            plannerLlm = config.agentModels?.planner ?
                createLlmFromConfig(config.agentModels.planner) : defaultLlm;
            supervisorLlm = config.agentModels?.supervisor ?
                createLlmFromConfig(config.agentModels.supervisor) : defaultLlm;
        }

        return {
            coderLlm,
            plannerLlm,
            supervisorLlm
        }
    }

    // TODO: Figure this out later. Need to load models and come up with interface
    // private loadCustomSubAgents(configs?: BaseAgentConfig[]) {
    //     if (!configs) return [];
    //     return configs.map(config => new class CustomAgent extends BaseAgent { }(config))
    // }

    async query(query: string) {
        const initialState = {
            messages: [new HumanMessage(query)],
        };

        for await (const step of await this.supervisor.stream(initialState)) {
            console.log(step);
            console.log("---");
        }
    }
}
