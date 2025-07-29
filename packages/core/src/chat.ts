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
import { EvaluatorAgent } from "./agents/evaluator.js";

// --- Import readline for user input ---
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export enum ApprovalMode {
    DEFAULT = 'default',
    AUTO_EDIT = 'autoEdit',
    YOLO = 'yolo',
}

export interface ChatConfig {
    llmConfig: LlmConfig,
    approvalMode?: ApprovalMode,
    debug?: boolean,
}

export class Chat {
    protected supervisor;
    protected plannerAgent: PlannerAgent;
    protected coderAgent: CoderAgent;
    protected testerAgent: TesterAgent;
    protected evaluatorAgent: EvaluatorAgent;
    protected messageHistory: BaseMessage[] = [];
    protected debug: boolean;

    constructor(config: ChatConfig) {
        this.debug = config.debug ?? false;

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
        this.evaluatorAgent = new EvaluatorAgent({
            llm: coderLlm,
        });

        const subAgents = [
            this.coderAgent,
            this.plannerAgent,
            this.testerAgent,
            this.evaluatorAgent,
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

        let finalState: { messages: BaseMessage[] } | undefined;
        this.supervisor.clearCache();

        // track how many messages we've already shown
        let shownCount = this.messageHistory.length;

        const iterator = this.supervisor.stream(
            { messages: this.messageHistory },
            { streamMode: "values" }
        );

        for await (const state of await iterator) {
            finalState = state;

            if (this.debug) {
                // only print the new messages since last state
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

        // last AI message is the “final” reply
        const last = this.messageHistory
            .filter((m): m is AIMessage => m instanceof AIMessage)
            .at(-1)!;
        console.log("assistant:", last.content);
    }
}


(async () => {
    const chat = new Chat({
        debug: true,
        llmConfig: {
            defaultModel: {
                provider: 'deepseek',
                model: 'deepseek-chat'
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
