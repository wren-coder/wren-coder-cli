/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { CoderAgent } from "./agents/coder.js";
import { PlannerAgent } from "./agents/planner.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createLlmFromConfig, isAgentSpecificConfig, LlmConfig } from "./models/adapter.js";
import { TesterAgent } from "./agents/tester.js";
import { EvaluatorAgent } from "./agents/evaluator.js";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";

// --- Import readline for user input ---
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        default: () => [],
        reducer: (all, one) =>
            Array.isArray(one) ? all.concat(one) : all.concat([one]),
    }),
    steps: Annotation<string[]>({
        default: () => [],
        reducer: (all, one) =>
            Array.isArray(one) ? all.concat(one) : all.concat([one]),
    }),
    suggestions: Annotation<string[]>({
        default: () => [],
        reducer: (all, one) =>
            Array.isArray(one) ? all.concat(one) : all.concat([one]),
    }),
});

export enum ApprovalMode {
    DEFAULT = 'default',
    AUTO_EDIT = 'autoEdit',
    YOLO = 'yolo',
}

export interface ChatConfig {
    llmConfig: LlmConfig,
    approvalMode?: ApprovalMode,
    debug?: boolean,
    graphRecursionLimit?: number,
    maxReflections?: number,
    workingDir?: string,
}

export class Chat {
    protected graph;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected testerAgent: TesterAgent;
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

        const { coderLlm, plannerLlm } = this.loadModels(config.llmConfig);

        this.coderAgent = new CoderAgent({
            llm: coderLlm,
            workingDir: this.workingDir,
        });
        this.plannerAgent = new PlannerAgent({
            llm: plannerLlm,
            workingDir: this.workingDir,
        });
        this.testerAgent = new TesterAgent({
            llm: coderLlm,
            workingDir: this.workingDir,
        });
        this.evaluatorAgent = new EvaluatorAgent({
            llm: coderLlm,
            workingDir: this.workingDir,
        });

        this.graph = this.createGraph();
    }

    private createGraph() {
        const placeholderFunction1 = async () => {
            console.log("Executing placeholder function 1");
            return {
                messages: [],
                suggestions: []
            };
        };

        const placeholderFunction2 = async () => {
            console.log("Executing placeholder function 2");
            return {
                messages: [],
                suggestions: []
            };
        };

        return new StateGraph(StateAnnotation)
            .addNode(this.plannerAgent.getName(), this.plannerAgent.getAgent())
            .addNode(this.coderAgent.getName(), this.coderAgent.getAgent())
            .addNode(this.testerAgent.getName(), this.testerAgent.getAgent())
            .addNode(this.evaluatorAgent.getName(), this.evaluatorAgent.getAgent())
            .addNode("placeholder1", placeholderFunction1)
            .addNode("placeholder2", placeholderFunction2)

            // wiring: START → plan → code → test → evaluate → placeholder1 → placeholder2
            .addEdge(START, this.plannerAgent.getName())
            .addEdge(this.plannerAgent.getName(), this.coderAgent.getName())
            .addEdge("placeholder1", this.coderAgent.getName())
            .addEdge(this.coderAgent.getName(), this.testerAgent.getName())
            .addEdge(this.testerAgent.getName(), this.evaluatorAgent.getName())
            .addEdge(this.evaluatorAgent.getName(), "placeholder2")


            .addConditionalEdges(
                this.testerAgent.getName(),
                state => {
                    if (state.steps && state.steps.length > 0) return this.coderAgent.getName();
                    return END;
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

    async query(query: string) {
        this.messageHistory.push(new HumanMessage(query));

        let finalState: { messages: BaseMessage[] } | undefined;
        this.graph.clearCache();

        // track how many messages we've already shown
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
                        ? "user"
                        : m instanceof AIMessage
                            ? "assistant"
                            : "system";
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


(async () => {
    const chat = new Chat({
        debug: true,
        graphRecursionLimit: 100,
        maxReflections: 3,
        workingDir: process.cwd(), // Use current working directory
        llmConfig: {
            agentModels: {
                coder: {
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    temperature: 0,
                },
                planner: {
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    temperature: 0,
                },
                supervisor: {
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    temperature: 0,
                },
                tester: {
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    temperature: 0,
                },
                evaluator: {
                    provider: 'deepseek',
                    model: 'deepseek-chat',
                    temperature: 0,
                },

            }
        }
    });

    // --- Create readline interface ---
    const rl = readline.createInterface({ input, output });

    try {
        // --- Get the initial task from the user ---
        const initialTask = await rl.question('Enter the initial task for the agent: ');

        if (!initialTask.trim()) {
            console.log("No task provided. Exiting.");
            rl.close();
            return;
        }

        console.log("\n--- Starting Task ---");
        await chat.query(initialTask);

        // --- Interactive loop ---
        console.log("\n--- Entering Interactive Mode ---");
        console.log("You can now provide feedback, ask questions, or type 'exit' to quit.");
        while (true) {
            const userInput = await rl.question('\nYou: ');

            if (userInput.toLowerCase() === 'exit') {
                console.log("Goodbye!");
                break;
            }

            if (userInput.trim()) {
                await chat.query(userInput);
            } else {
                console.log("Empty input ignored.");
            }
        }

    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        rl.close();
    }
})();