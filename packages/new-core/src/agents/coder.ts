/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { CODER_PROMPT } from "../prompts/coder.js";
import { BaseAgent } from "./base.js";


const AGENT_NAME = 'coder';
const AGENT_DESC = 'Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.';
const MAX_SEARCH_RESULTS = 5;

const tools = [
  new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS })
]

interface CoderAgentConfig {
  llm: BaseChatModel;
}

export class CoderAgent extends BaseAgent {
  constructor(config: CoderAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: CODER_PROMPT,
      llm: config.llm,
      tools,
    });
  }
}
