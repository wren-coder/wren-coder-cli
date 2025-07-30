/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { EVALUATOR_PROMPT } from "../prompts/evaluator.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { ScreenshotTool } from "../tools/screenshot.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { EvaluatorResponseSchema } from "../schemas/response.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../models/adapter.js";

const AGENT_NAME = 'evaluator';
const AGENT_DESC = 'Evaluates code + tests vs. the user spec, returns pass/fail and feedback';
const MAX_SEARCH_RESULTS = 5;

export class EvaluatorAgent extends BaseAgent {
  constructor({ workingDir, provider, model, llmModelConfig, compressionConfig }: AgentConfig) {
    const llm = createLlmFromConfig(llmModelConfig);
    compressionConfig = compressionConfig ?? getModelSpecificCompressionConfig(provider, model);
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
      prompt: EVALUATOR_PROMPT({ workingDir }),
      llm,
      tools,
      responseFormat: EvaluatorResponseSchema,
      compressionConfig,
    });

    this.invoke = this.invoke.bind(this);
  }


  async invoke(state: typeof StateAnnotation.State) {
    const result = await this.generationService.invoke(state);
    const lastMessage = result.messages[result.messages.length - 1];

    let suggestions = [];
    if (result.messages.length > 1) {
      // Try to find JSON in the response
      const jsonMatch = lastMessage.content.toString().match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          suggestions = parsed.suggestions || [];
        } catch (e) {
          console.error("Failed to parse JSON from LLM response:", e);
        }
      }
    }

    result.suggestions = suggestions;
    return result;
  }
}
