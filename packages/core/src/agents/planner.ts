/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { PLANNER_PROMPT } from "../prompts/planner.js";
import { BaseAgent } from "./base.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GlobTool } from "../tools/glob.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { PlannerResponseSchema } from "../schemas/response.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { formatError } from "../utils/format-error.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../models/adapter.js";

const AGENT_NAME = 'planner';
const AGENT_DESC = 'Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.';
const MAX_SEARCH_RESULTS = 5;

export class PlannerAgent extends BaseAgent {
  constructor({ workingDir, llmModelConfig, compressionConfig }: AgentConfig) {
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
      prompt: PLANNER_PROMPT({ workingDir }),
      llm,
      tools,
      responseFormat: PlannerResponseSchema,
      compressionConfig,
    });

    this.invoke = this.invoke.bind(this);
  }

  async invoke(state: typeof StateAnnotation.State) {
    console.log("[Planner] Starting plan generation");

    try {
      const result = await this.generationService.invoke(state);
      const lastMessage = result.messages[result.messages.length - 1];

      let steps = [];
      if (result.messages.length > 1) {
        // Try to find JSON in the response
        const jsonMatch = lastMessage.content.toString().match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            steps = parsed.steps || [];
            console.log(`[Planner] Successfully parsed ${steps.length} steps from LLM response`);
          } catch (e) {
            console.error("[Planner] Failed to parse JSON from LLM response:", formatError(e));
          }
        } else {
          console.warn("[Planner] No JSON found in LLM response");
        }
      }

      result.steps = steps;
      console.log(`[Planner] Plan generation completed with ${steps.length} steps`);
      return result;
    } catch (error) {
      console.error(`[Planner] Error during plan generation: ${formatError(error)}`);
      throw error;
    }
  }
}
