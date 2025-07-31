/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { CODER_PROMPT, CODER_USER_PROMPT } from "../prompts/coder.js";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { ReadFileTool } from "../tools/read-file.js";
import { WriteFileTool } from "../tools/write-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { HumanMessage } from "@langchain/core/messages";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../index.js";

const AGENT_NAME = 'coder';
const AGENT_DESC = 'Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.';
const MAX_SEARCH_RESULTS = 5;

export class CoderAgent extends BaseAgent {
  constructor({ workingDir, llmModelConfig, compressionConfig, graphRecursionLimit }: AgentConfig) {
    const llm = createLlmFromConfig(llmModelConfig);
    compressionConfig = compressionConfig ?? getModelSpecificCompressionConfig(llmModelConfig.provider, llmModelConfig.model);
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ShellTool({ workingDir, llm, compressionConfig }),
      ReadFileTool({ workingDir, llm, compressionConfig }),
      WriteFileTool({ workingDir }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm, compressionConfig }),
    ];

    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: CODER_PROMPT({ workingDir, tools }),
      llm,
      tools,
      compressionConfig,
      graphRecursionLimit,
    });

    this.invoke = this.invoke.bind(this);
  }

  async invoke(state: typeof StateAnnotation.State) {
    const messages = state.messages;
    let lm = "";
    let result;

    while (!lm.includes("-----DONE-----")) {
      lm = messages[messages.length - 1].content.toString();
      messages.push(new HumanMessage(CODER_USER_PROMPT(`${lm}`)));
      result = await this.generationService.invoke({
        ...state,
        messages
      });
    }

    console.log("[Coder] All steps completed");
    return result;
  }
}
