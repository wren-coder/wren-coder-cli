/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { HumanMessage } from "@langchain/core/messages";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { ChatDeepSeek } from '@langchain/deepseek';
import { SUPERVISOR_PROMPT } from "./prompts/supervisor.js";

export interface ChatConfig {
    llmConfig: {}
}


export class Chat {
    protected supervisor;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;

    constructor(config: ChatConfig) {
        this.coderAgent = new CoderAgent({
            llm: new ChatDeepSeek({
                model: 'deepseek-chat'
            }),
        });
        this.plannerAgent = new PlannerAgent({
            llm: new ChatDeepSeek(
                {
                    model: 'deepseek-chat'
                }
            ),
        });

        const subAgents = [
            this.coderAgent,
            this.plannerAgent,
        ];
        this.supervisor = createSupervisor({
            agents: subAgents,
            prompt: SUPERVISOR_PROMPT,
            llm: new ChatDeepSeek(
                {
                    model: 'deepseek-chat'
                }
            ),
        })
    }

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
