/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { EVALUATOR_PROMPT } from "../prompts/evaluator.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GrepTool } from "../tools/grep-tool.js";
import { ListFilesTool } from "../tools/list-files.js";

const AGENT_NAME = 'evaluator';
const AGENT_DESC = 'Evaluates code + tests vs. the user spec, returns pass/fail and feedback';
const MAX_SEARCH_RESULTS = 5;

const tools = [
  new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
  ShellTool,
  ReadFileTool,
  GrepTool,
  ListFilesTool,
]

export interface Evaluation {
  grade: 'pass' | 'fail';
  feedback: string;
}

interface EvaluatorAgentConfig {
  llm: BaseChatModel;
}

export class EvaluatorAgent extends BaseAgent {
  constructor(config: EvaluatorAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: EVALUATOR_PROMPT,
      llm: config.llm,
      tools,
    });
  }
}
