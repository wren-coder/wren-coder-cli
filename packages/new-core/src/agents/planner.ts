/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { PLANNER_PROMPT } from "../prompts/planner.js";
import { BaseAgent } from "./base.js";

const AGENT_NAME = 'planner';
const AGENT_DESC = '';

interface CoderAgentConfig {
  llm: BaseChatModel;
}

export class PlannerAgent extends BaseAgent {
  constructor(config: CoderAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: PLANNER_PROMPT,
      llm: config.llm
    });
  }
}
