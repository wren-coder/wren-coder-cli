/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { HumanMessage } from "@langchain/core/messages";

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseMessage } from "@langchain/core/messages";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { SupervisorAgent } from "./agents/supervisor.js";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { BaseAgent } from "./agents/base.js";
import { ChatDeepSeek } from '@langchain/deepseek';

const START = "__start__";
const END = "__end__"

export interface ChatConfig {
    llmConfig: {}
}

export class Chat {
    protected supervisorAgent: SupervisorAgent;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected supervisoryGraph;

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
        this.supervisorAgent = new SupervisorAgent({
            subAgents,
            llm: new ChatDeepSeek(
                {
                    model: 'deepseek-chat'
                }
            ),
        });

        this.supervisoryGraph = this.createGraph(subAgents);
    }

    private createGraph(subAgents: BaseAgent[]) {
        const StateAnnotation = Annotation.Root({
            sentiment: Annotation<string>,
            messages: Annotation<BaseMessage[]>({
                reducer: (left: BaseMessage[], right: BaseMessage | BaseMessage[]) => {
                    if (Array.isArray(right)) {
                        return left.concat(right);
                    }
                    return left.concat([right]);
                },
                default: () => [],
            }),
        });

        const graphBuilder = new StateGraph(StateAnnotation);
        const graph = graphBuilder;

        graph.addNode(this.supervisorAgent.getName(), this.supervisorAgent.getAgent());
        subAgents.forEach(agent => {
            graph.addNode(agent.getName(), agent.getAgent());
        })

        // graph.addEdge(START, "supervisor");
        // graph.addEdge("supervisor", END);

        return graph.compile();

    }

    async query(query: string) {
        const initialState = {
            messages: [new HumanMessage(query)],
        };

        for await (const step of await this.supervisoryGraph.stream(initialState)) {
            console.log(step);
            console.log("---");
        }
    }
}
