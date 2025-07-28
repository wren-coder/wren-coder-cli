/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { CODER_PROMPT } from "../prompts/coder.js";
import { BaseAgent } from "./base.js";

const AGENT_NAME = 'coder';
const AGENT_DESC = '';

interface CoderAgentConfig {
  llm: BaseChatModel;
}

export class CoderAgent extends BaseAgent {
  constructor(config: CoderAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: CODER_PROMPT,
      llm: config.llm
    });
  }
}
