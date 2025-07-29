/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { PLANNER_PROMPT } from "../prompts/planner.js";
import { BaseAgent } from "./base.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GlobTool } from "../tools/glob.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { PlannerResponseSchema } from "../schemas/response.js";
import { StateAnnotation } from "../chat.js";

const AGENT_NAME = 'planner';
const AGENT_DESC = 'Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.';
const MAX_SEARCH_RESULTS = 5;

interface PlannerAgentConfig {
  llm: BaseChatModel;
  workingDir: string;
}

export class PlannerAgent extends BaseAgent {
  constructor({ workingDir, llm }: PlannerAgentConfig) {
    // Update tools to use the working directory if provided
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ReadFileTool({ workingDir, llm }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm }),
      ReadConsoleLogTool({ workingDir }),
    ];

    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: PLANNER_PROMPT({ workingDir }),
      llm,
      tools,
      responseFormat: PlannerResponseSchema,
    });

    this.plan = this.plan.bind(this);
  }

  async plan(state: typeof StateAnnotation.State) {
    // Use the agent to generate a structured response
    const result = await this.agent.invoke(state);

    // Extract steps from the response
    const aiMessage = result.messages[result.messages.length - 1];
    const content = typeof aiMessage.content === 'string' ? aiMessage.content : '';

    // Parse the JSON content to extract steps
    let steps: string[] = [];
    try {
      // Extract JSON from the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        steps = parsed.steps || [];
      }
    } catch (e) {
      console.error('Error parsing JSON from planner response:', e);
      // Fallback: use the full content as a single step
      steps = [content];
    }

    // Return the updated state with steps
    return {
      ...result,
      steps
    };
  }
}
