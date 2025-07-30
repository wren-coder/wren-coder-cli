/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { isAgentSpecificConfig, LlmConfig } from "./models/adapter.js";
import { EvaluatorAgent } from "./agents/evaluator.js";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ApprovalMode } from "./types/approvalMode.js";
import { StateAnnotation } from "./types/stateAnnotation.js";
import { MessageRoles } from "./types/messageRole.js";
import { CompressionConfig } from "./utils/compression.js";
import { AgentConfig, createAgentConfig } from "./agents/agentConfig.js";

export interface ChatConfig {
    llmConfig: LlmConfig,
    approvalMode?: ApprovalMode,
    debug?: boolean,
    graphRecursionLimit?: number,
    maxReflections?: number,
    workingDir?: string,
    compressionConfig?: CompressionConfig;
}

export class Chat {
    protected graph: ReturnType<typeof this.createGraph>
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected evaluatorAgent: EvaluatorAgent;
    protected messageHistory: BaseMessage[] = [];
    protected debug: boolean;
    protected graphRecursionLimit: number;
    protected maxReflections: number;
    protected workingDir: string;

    constructor(config: ChatConfig) {
        this.debug = config.debug ?? false;
        this.graphRecursionLimit = config.graphRecursionLimit ?? 25;
        this.maxReflections = config.maxReflections ?? 3;
        this.workingDir = config.workingDir ?? process.cwd();

        const { coderAgentConfig, plannerAgentConfig, evaluatorAgentConfig } = this.loadAgentConfigs(config.llmConfig);

        this.coderAgent = new CoderAgent(coderAgentConfig);
        this.plannerAgent = new PlannerAgent(plannerAgentConfig);
        this.evaluatorAgent = new EvaluatorAgent(evaluatorAgentConfig);

        this.graph = this.createGraph();
    }

    private createGraph() {
        return new StateGraph(StateAnnotation)
            .addNode(this.plannerAgent.getName(), this.plannerAgent.invoke)
            .addNode(this.coderAgent.getName(), this.coderAgent.invoke)
            .addNode(this.evaluatorAgent.getName(), this.evaluatorAgent.invoke)

            .addEdge(START, this.plannerAgent.getName())
            .addEdge(this.plannerAgent.getName(), this.coderAgent.getName())

            .addConditionalEdges(
                this.coderAgent.getName(),
                state => {
                    if (state.steps && state.steps.length > 0) return this.coderAgent.getName();
                    return this.evaluatorAgent.getName();
                }
            )

            .addConditionalEdges(
                this.evaluatorAgent.getName(),
                state => {
                    if (state.suggestions && state.suggestions.length > 0) return this.plannerAgent.getName();
                    return END;
                }
            )

            .compile();
    }

    private loadAgentConfigs(config: LlmConfig) {
        let defaultAgentConfig: AgentConfig | undefined;
        let coderAgentConfig: AgentConfig;
        let plannerAgentConfig: AgentConfig;
        let evaluatorAgentConfig: AgentConfig;

        if (isAgentSpecificConfig(config)) {
            coderAgentConfig = createAgentConfig(config.agentModels.coder, this.workingDir);
            plannerAgentConfig = createAgentConfig(config.agentModels.planner, this.workingDir);
            evaluatorAgentConfig = createAgentConfig(config.agentModels.planner, this.workingDir);
        } else {
            defaultAgentConfig = createAgentConfig(config.defaultModel, this.workingDir);
            coderAgentConfig = config.agentModels?.coder ?
                createAgentConfig(config.agentModels.coder, this.workingDir) : defaultAgentConfig;
            plannerAgentConfig = config.agentModels?.planner ?
                createAgentConfig(config.agentModels.planner, this.workingDir) : defaultAgentConfig;
            evaluatorAgentConfig = config.agentModels?.planner ?
                createAgentConfig(config.agentModels.planner, this.workingDir) : defaultAgentConfig;
        }

        return {
            coderAgentConfig,
            plannerAgentConfig,
            evaluatorAgentConfig,
        }
    }

    async query(query: string) {
        this.messageHistory.push(new HumanMessage(query));

        let finalState: { messages: BaseMessage[] } | undefined;
        this.graph.clearCache();

        let shownCount = this.messageHistory.length;

        const iterator = await this.graph.stream(
            { messages: this.messageHistory },
            { streamMode: "values", recursionLimit: this.graphRecursionLimit }
        );

        for await (const state of iterator) {
            finalState = state;

            if (this.debug) {
                console.log(state)
                const all = state.messages;
                const newlyAdded = all.slice(shownCount);
                newlyAdded.forEach((m) => {
                    const role = m instanceof HumanMessage
                        ? MessageRoles.USER
                        : m instanceof AIMessage
                            ? MessageRoles.ASSISTANT
                            : MessageRoles.SYSTEM;
                    console.log(`[${role}] ${m.content}`);
                });
                shownCount = all.length;
            }
        }

        if (!finalState) throw new Error("Stream completed without yielding a state");
        this.messageHistory = finalState.messages;

        // last AI message is the "final" reply
        const last = this.messageHistory
            .filter((m): m is AIMessage => m instanceof AIMessage)
            .at(-1);

        if (last) {
            console.log("assistant:", last.content);
        }
    }
}
