/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { TESTER_PROMPT } from "../prompts/tester.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GlobTool } from "../tools/glob.js";
import { ScreenshotTool } from "../tools/screenshot.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";


const AGENT_NAME = 'tester';
const AGENT_DESC = 'Validates code correctness and quality by reviewing changes, running or simulating tests, and reporting issues or confirmations.';
const MAX_SEARCH_RESULTS = 5;

const tools = [
  new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
  ShellTool,
  ReadFileTool,
  GrepTool,
  ListFilesTool,
  GlobTool,
  ScreenshotTool,
  ReadConsoleLogTool,
]

interface CoderAgentConfig {
  llm: BaseChatModel;
}

export class TesterAgent extends BaseAgent {
  constructor(config: CoderAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: TESTER_PROMPT,
      llm: config.llm,
      tools,
    });
  }
}
