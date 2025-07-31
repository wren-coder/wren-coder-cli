/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { createLlmFromConfig, isAgentSpecificConfig, LlmConfig, LlmModelConfig } from "./models/adapter.js";
import { EvaluatorAgent } from "./agents/evaluator.js";
import { StateGraph, START, END } from "@langchain/langgraph";
import { ApprovalMode } from "./types/approvalMode.js";
import { StateAnnotation } from "./types/stateAnnotation.js";
import { MessageRoles } from "./types/messageRole.js";
import { CompressionConfig, getModelSpecificCompressionConfig } from "./utils/compression.js";
import { AgentConfig, createAgentConfig } from "./agents/agentConfig.js";
import { GenerationService } from "./services/generationService.js";
import { TesterAgent } from "./index.js";

export interface ChatConfig {
    llmConfig: LlmConfig,
    approvalMode?: ApprovalMode,
    debug?: boolean,
    graphRecursionLimit?: number,
    workingDir?: string,
    compressionConfig?: CompressionConfig;
}

export class Chat {
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected testerAgent: TesterAgent;
    protected evaluatorAgent: EvaluatorAgent;
    protected messageHistory: BaseMessage[] = [];
    protected debug: boolean;
    protected graphRecursionLimit?: number;
    protected workingDir: string;
    protected compressionConfig?: CompressionConfig;
    protected generationService: GenerationService;

    constructor(config: ChatConfig) {
        this.debug = config.debug ?? false;
        this.graphRecursionLimit = config.graphRecursionLimit;
        this.compressionConfig = config.compressionConfig;
        this.workingDir = config.workingDir ?? process.cwd();

        const { coderAgentConfig, plannerAgentConfig, evaluatorAgentConfig } = this.loadAgentConfigs(config.llmConfig);

        this.coderAgent = new CoderAgent(coderAgentConfig);
        this.plannerAgent = new PlannerAgent(plannerAgentConfig);
        this.testerAgent = new TesterAgent(coderAgentConfig);
        this.evaluatorAgent = new EvaluatorAgent(evaluatorAgentConfig);

        const graph = this.createGraph();
        this.generationService = this.createGenerationService(coderAgentConfig.llmModelConfig, graph);
    }

    private createGenerationService(llmModelConfig: LlmModelConfig, graph: ReturnType<typeof this.createGraph>) {
        const llm = createLlmFromConfig(llmModelConfig);
        const compressionConfig = this.compressionConfig ?? getModelSpecificCompressionConfig(llmModelConfig.provider, llmModelConfig.model);
        return new GenerationService({
            agent: graph,
            llm,
            compressionConfig,
            graphRecursionLimit: this.graphRecursionLimit,
        });
    }

    private createGraph() {
        return new StateGraph(StateAnnotation)
            .addNode(this.plannerAgent.getName(), this.plannerAgent.invoke)
            .addNode(this.coderAgent.getName(), this.coderAgent.invoke)
            .addNode(this.testerAgent.getName(), this.testerAgent.invoke)
            .addNode(this.evaluatorAgent.getName(), this.evaluatorAgent.invoke)

            .addEdge(START, this.plannerAgent.getName())
            .addEdge(this.plannerAgent.getName(), this.coderAgent.getName())
            .addEdge(this.coderAgent.getName(), this.testerAgent.getName())
            .addEdge(this.testerAgent.getName(), this.evaluatorAgent.getName())

            .addConditionalEdges(
                this.evaluatorAgent.getName(),
                state => {
                    if (!state.eval) return this.plannerAgent.getName();
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
            coderAgentConfig = createAgentConfig(this.workingDir, config.agentModels.coder, this.compressionConfig, this.graphRecursionLimit);
            plannerAgentConfig = createAgentConfig(this.workingDir, config.agentModels.planner, this.compressionConfig, this.graphRecursionLimit);
            evaluatorAgentConfig = createAgentConfig(this.workingDir, config.agentModels.evaluator, this.compressionConfig, this.graphRecursionLimit);
        } else {
            defaultAgentConfig = createAgentConfig(this.workingDir, config.defaultModel, this.compressionConfig, this.graphRecursionLimit);
            coderAgentConfig = config.agentModels?.coder ?
                createAgentConfig(this.workingDir, config.agentModels.coder, this.compressionConfig, this.graphRecursionLimit) : defaultAgentConfig;
            plannerAgentConfig = config.agentModels?.planner ?
                createAgentConfig(this.workingDir, config.agentModels.planner, this.compressionConfig, this.graphRecursionLimit) : defaultAgentConfig;
            evaluatorAgentConfig = config.agentModels?.evaluator ?
                createAgentConfig(this.workingDir, config.agentModels.evaluator, this.compressionConfig, this.graphRecursionLimit) : defaultAgentConfig;
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
        let shownCount = this.messageHistory.length;

        const iterator = await this.generationService.stream(
            {
                messages: this.messageHistory,
                eval: false,
                original_request: query,
            }
        );

        for await (const state of iterator) {
            finalState = state;

            if (this.debug) {
                const all = state.messages;
                const newlyAdded = all.slice(shownCount);
                newlyAdded.forEach((m: BaseMessage) => {
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
