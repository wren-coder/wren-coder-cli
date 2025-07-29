/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { CODER_PROMPT } from "../prompts/coder.js";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { ReadFileTool } from "../tools/read-file.js";
import { WriteFileTool } from "../tools/write-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { StateAnnotation } from "../chat.js";
import { HumanMessage } from "@langchain/core/messages";


const AGENT_NAME = 'coder';
const AGENT_DESC = 'Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.';
const MAX_SEARCH_RESULTS = 5;

interface CoderAgentConfig {
  llm: BaseChatModel;
  workingDir: string;
}

export class CoderAgent extends BaseAgent {
  constructor({ workingDir, llm }: CoderAgentConfig) {
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ShellTool({ workingDir, llm }),
      ReadFileTool({ workingDir, llm }),
      WriteFileTool({ workingDir }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm }),
    ];

    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: CODER_PROMPT({ workingDir }),
      llm,
      tools,
    });

    this.code = this.code.bind(this);
  }
  async code(state: typeof StateAnnotation.State) {
    // If there are steps to execute, process them one by one
    if (state.steps && state.steps.length > 0) {
      // Take the first step
      const currentStep = state.steps[0];

      // Create a new state with the current step as the message
      const stepState = {
        ...state
      };

      stepState.messages.push(new HumanMessage(currentStep))
      // Invoke the agent with the current step
      const result = await this.agent.invoke(stepState);

      // Remove the completed step from the steps array
      const remainingSteps = state.steps.slice(1);

      // Return the updated state with the result and remaining steps
      return {
        ...result,
        steps: remainingSteps
      };
    }

    // If no steps, just invoke the agent normally
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
