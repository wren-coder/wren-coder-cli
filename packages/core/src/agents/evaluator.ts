/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";
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
import { StateAnnotation } from "../chat.js";

const AGENT_NAME = 'evaluator';
const AGENT_DESC = 'Evaluates code + tests vs. the user spec, returns pass/fail and feedback';
const MAX_SEARCH_RESULTS = 5;

interface EvaluatorAgentConfig {
  llm: BaseChatModel;
  workingDir: string;
}

export class EvaluatorAgent extends BaseAgent {
  constructor({ workingDir, llm }: EvaluatorAgentConfig) {
    const tools = [
      new DuckDuckGoSearch({ maxResults: MAX_SEARCH_RESULTS }),
      ShellTool({ workingDir, llm }),
      ReadFileTool({ workingDir, llm }),
      GrepTool({ workingDir }),
      ListFilesTool({ workingDir }),
      GlobTool({ workingDir, llm }),
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
    });

    this.evaluate = this.evaluate.bind(this);
  }

  async evaluate(state: typeof StateAnnotation.State) {
    const result = await this.agent.invoke(state);

    const suggestions = result.structuredResponse?.suggestions || [];

    console.log(result.structuredResponse)

    result.suggestions = suggestions;
    return result;
  }
}
