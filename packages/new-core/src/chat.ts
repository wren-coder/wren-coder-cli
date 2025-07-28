/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { SUPERVISOR_PROMPT } from "./prompts/supervisor.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createLlmFromConfig, isAgentSpecificConfig, LlmConfig } from "./models/adapter.js";
import { TesterAgent } from "./agents/tester.js";

export interface ChatConfig {
    llmConfig: LlmConfig,
    debug?: boolean,
}

export class Chat {
    protected supervisor;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected testerAgent: TesterAgent;
    protected messageHistory: BaseMessage[] = [];

    constructor(config: ChatConfig) {
        const { coderLlm, plannerLlm, supervisorLlm } = this.loadModels(config.llmConfig);

        this.coderAgent = new CoderAgent({
            llm: coderLlm,
        });
        this.plannerAgent = new PlannerAgent({
            llm: plannerLlm,
        });
        this.testerAgent = new TesterAgent({
            llm: coderLlm,
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
        this.messageHistory.push(new HumanMessage(query));

        // 2. stream the *full* state after each node runs:
        let finalState: { messages: BaseMessage[] } | undefined;
        const iterator = this.supervisor.stream(
            { messages: this.messageHistory },
            { streamMode: "values" }
        );

        for await (const state of await iterator) {
            // you’ll get the entire message array at each step:
            console.debug("intermediate messages:", state.messages);
            finalState = state;
        }

        // 3. once done, stash the last state back into your history
        if (!finalState) {
            throw new Error("Stream completed without yielding a state");
        }
        this.messageHistory = finalState.messages;

        // 4. pull off the last AIMessage as your “assistant reply”
        const last = this.messageHistory
            .filter((m): m is AIMessage => m instanceof AIMessage)
            .at(-1)!;
        console.log("assistant:", last.content);
    }
}

const chat = new Chat({
    llmConfig: {
        defaultModel: {
            provider: 'deepseek',
            model: 'deepseek-chat'
        }
    }
})

chat.query("Write a simple browser based minecraft clone in the ~/workspace/ dir").then(() => {
    chat.query("Yes. Proceed")
})
