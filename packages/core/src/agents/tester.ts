/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { ScreenshotTool } from "../tools/screenshot.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { TESTER_PROMPT } from "../prompts/tester.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../models/adapter.js";
import { TesterResponseSchema } from "../schemas/response.js";

const AGENT_NAME = 'Tester';
const AGENT_DESC = 'Tests vs. the user spec, returns pass/fail and feedback';
const MAX_SEARCH_RESULTS = 5;

export class TesterAgent extends BaseAgent {
  constructor({ workingDir, llmModelConfig, compressionConfig }: AgentConfig) {
    const llm = createLlmFromConfig(llmModelConfig);
    compressionConfig = compressionConfig ?? getModelSpecificCompressionConfig(llmModelConfig.provider, llmModelConfig.model);
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ShellTool({ workingDir, llm, compressionConfig }),
      ReadFileTool({ workingDir, llm, compressionConfig }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm, compressionConfig }),
      ScreenshotTool({ workingDir }),
      ReadConsoleLogTool({ workingDir }),
    ];

    super({
      name: AGENT_NAME,
      description: AGENT_DESC,
      prompt: TESTER_PROMPT({ workingDir }),
      llm,
      tools,
      compressionConfig,
      responseFormat: TesterResponseSchema,
    });
  }

  async invoke(state: typeof StateAnnotation.State) {
    console.log("[Tester] Executing Test");
    const result = await this.generationService.invoke(state);
    const testResult = result.structuredResponse.result;
    console.log(`[Tester] Test ${testResult}`);
    return result;
  }
}
