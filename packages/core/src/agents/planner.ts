/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { PLANNER_PROMPT, PLANNER_USER_PROMPT } from "../prompts/planner.js";
import { BaseAgent } from "./base.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GlobTool } from "../tools/glob.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../models/adapter.js";
import { HumanMessage } from "@langchain/core/messages";

const AGENT_NAME = 'planner';
const AGENT_DESC = 'Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.';
const MAX_SEARCH_RESULTS = 5;

export class PlannerAgent extends BaseAgent {
  constructor({ workingDir, llmModelConfig, compressionConfig, graphRecursionLimit }: AgentConfig) {
    const llm = createLlmFromConfig(llmModelConfig);
    compressionConfig = compressionConfig ?? getModelSpecificCompressionConfig(llmModelConfig.provider, llmModelConfig.model);
    // Update tools to use the working directory if provided
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ReadFileTool({ workingDir, llm, compressionConfig }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm, compressionConfig }),
      ReadConsoleLogTool({ workingDir }),
    ];

    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: PLANNER_PROMPT({ workingDir, tools }),
      llm,
      tools,
      compressionConfig,
      graphRecursionLimit,
    });

    this.stream = this.stream.bind(this);
  }

  async stream(state: typeof StateAnnotation.State) {
    console.log("[Planner] Starting plan generation");
    const messages = state.messages;
    const prompt = messages[messages.length - 1].content.toString()
    messages.push(new HumanMessage(PLANNER_USER_PROMPT(`${prompt}`)));
    const result = await this.generationService.stream({
      ...state,
      messages
    });
    console.log(`[Planner] Plan generation completed.`);
    return result;
  }
}
