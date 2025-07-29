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
  }
}
