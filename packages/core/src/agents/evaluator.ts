/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { EVALUATOR_PROMPT, EVALUATOR_USER_PROMPT } from "../prompts/evaluator.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { ScreenshotTool } from "../tools/screenshot.js";
import { ReadConsoleLogTool } from "../tools/read-console.js";
import { EvaluatorResponse, EvaluatorResponseSchema } from "../schemas/response.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../models/adapter.js";
import { extractStructuredResponse } from "../utils/jsonParser.js";
import { HumanMessage } from "@langchain/core/messages";

const AGENT_NAME = 'evaluator';
const AGENT_DESC = 'Evaluates code + tests vs. the user spec, returns pass/fail and feedback';
const MAX_SEARCH_RESULTS = 5;

export class EvaluatorAgent extends BaseAgent {
  constructor({ workingDir, llmModelConfig, compressionConfig, graphRecursionLimit }: AgentConfig) {
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
      prompt: EVALUATOR_PROMPT({ workingDir, tools }),
      llm,
      tools,
      responseFormat: EvaluatorResponseSchema,
      compressionConfig,
      graphRecursionLimit,
    });

    this.stream = this.stream.bind(this);
  }


  async stream(state: typeof StateAnnotation.State) {
    console.log("[EVALUATOR] Starting testing");
    const messages = state.messages;
    messages.push(new HumanMessage(EVALUATOR_USER_PROMPT(`${state.original_request}`)));
    const result = await this.generationService.stream({
      ...state,
      messages
    });

    const evalResult = extractStructuredResponse<EvaluatorResponse>(result, EvaluatorResponseSchema);

    result.eval = evalResult.status_report.implementation_status === 'pass';
    console.log(`[Evaluator] Evaluation generation completed with ${evalResult.status_report.implementation_status}`);
    return result;
  }
}
