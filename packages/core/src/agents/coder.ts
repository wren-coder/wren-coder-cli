/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { DuckDuckGoSearch } from "@langchain/community/tools/duckduckgo_search";
import { CODER_PROMPT } from "../prompts/coder.js";
import { BaseAgent } from "./base.js";
import { ShellTool } from "../tools/shell.js";
import { ReadFileTool } from "../tools/read-file.js";
import { WriteFileTool } from "../tools/write-file.js";
import { GrepTool } from "../tools/grep.js";
import { ListFilesTool } from "../tools/list-files.js";
import { GlobTool } from "../tools/glob.js";
import { HumanMessage } from "@langchain/core/messages";
import { TesterAgent } from "./tester.js";
import { formatError } from "../utils/format-error.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { AgentConfig } from "./agentConfig.js";
import { getModelSpecificCompressionConfig } from "../utils/compression.js";
import { createLlmFromConfig } from "../index.js";

const AGENT_NAME = 'coder';
const AGENT_DESC = 'Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.';
const MAX_SEARCH_RESULTS = 5;

export class CoderAgent extends BaseAgent {
  protected testerAgent: TesterAgent;
  constructor({ workingDir, llmModelConfig, compressionConfig }: AgentConfig) {
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
      prompt: CODER_PROMPT({ workingDir }),
      llm,
      tools,
      compressionConfig,
    });

    this.testerAgent = new TesterAgent({ workingDir, llmModelConfig, compressionConfig });
    this.invoke = this.invoke.bind(this);
  }

  async invoke(state: typeof StateAnnotation.State) {
    let result = { ...state };
    console.log(`[Coder] Starting execution with ${result.steps.length} steps`);

    while (result.steps.length > 0) {
      const currentStep = result.steps[0];
      const stepString = `${currentStep.action}: ${currentStep.description}\nDetails: ${Array.isArray(currentStep.details) ? currentStep.details.join(', ') : currentStep.details}`;

      console.log(`[Coder] Executing step (${result.steps.length} remaining): ${currentStep.action} - ${currentStep.description}`);

      const stepState = {
        ...result,
        messages: [...result.messages, new HumanMessage(stepString)]
      };

      try {
        const agentResult = await this.generationService.invoke(stepState);

        console.log(`[Coder] Testing implementation for: ${currentStep.description}`);
        const testAgentResult = await this.testerAgent.invoke({
          ...stepState,
          messages: [...stepState.messages, new HumanMessage(`Test the implementation for ${stepString}`)]
        });

        const testPassed = testAgentResult.testResult;

        console.log(`[Coder] Test result for "${currentStep.description}": ${testPassed ? 'PASS' : 'FAIL'}`);

        if (testPassed) {
          result = {
            ...agentResult,
            steps: result.steps.slice(1)
          };
        } else {
          const newStep = {
            action: "fix",
            description: "Fix failed test",
            details: [`The implementation for "${currentStep.description}" failed tests. Please fix the implementation.`]
          };

          result = {
            ...agentResult,
            steps: [newStep, ...result.steps]
          };
          console.log(`[Coder] Added fix step for: ${currentStep.description}`);
        }
      } catch (error) {
        console.error(`[Coder] Error during step execution: ${formatError(error)}`);
        throw error;
      }
    }

    console.log("[Coder] All steps completed");
    return result;
  }
}
