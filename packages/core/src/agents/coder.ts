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
    let result = state;
    while (result.steps.length > 0) {

      const currentStep = result.steps[0];

      const stepState = {
        ...result
      };

      console.log(currentStep);

      stepState.messages.push(new HumanMessage(currentStep))

      result = await this.agent.invoke(stepState);

      result.steps = result.steps.slice(1);
    }

    return result;
  }
}
