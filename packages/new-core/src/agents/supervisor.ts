/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { SUPERVISOR_PROMPT } from "../prompts/supervisor.js";
import { createHandoffTool } from "../tools/supervisor/handoff.js";
import { BaseAgent } from "./base.js";

const AGENT_NAME = 'supervisor';
const AGENT_DESC = '';

interface SupervisorAgentConfig {
  subAgents: BaseAgent[];
  llm: BaseChatModel;
}

export class SupervisorAgent extends BaseAgent {
  constructor(config: SupervisorAgentConfig) {
    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: SUPERVISOR_PROMPT,
      tools: config.subAgents.map(agent => createHandoffTool(agent.getName(), agent.getDescription())),
      llm: config.llm,
    });
  }
}
