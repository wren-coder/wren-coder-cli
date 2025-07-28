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

const AGENT_NAME = 'planner';
const AGENT_DESC = 'Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.';
const MAX_SEARCH_RESULTS = 5;

const tools = [
  new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
  ReadFileTool,
  GrepTool,
  ListFilesTool,
  GlobTool,
]

interface CoderAgentConfig {
  llm: BaseChatModel;
}

export class PlannerAgent extends BaseAgent {
  constructor(config: CoderAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: PLANNER_PROMPT,
      llm: config.llm,
      tools,
    });
  }
}
