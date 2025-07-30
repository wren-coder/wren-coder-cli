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
import { TesterAgent } from "./tester.js";
import { formatError } from "../utils/format-error.js";

const AGENT_NAME = 'coder';
const AGENT_DESC = 'Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.';
const MAX_SEARCH_RESULTS = 5;

interface CoderAgentConfig {
  llm: BaseChatModel;
  workingDir: string;
}

export class CoderAgent extends BaseAgent {
  protected testerAgent: TesterAgent;
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

    this.testerAgent = new TesterAgent({ workingDir, llm });
    this.code = this.code.bind(this);
  }
  async code(state: typeof StateAnnotation.State) {
    let result = { ...state };
    console.log(`[Coder] Starting execution with ${result.steps.length} steps`);
    
    while (result.steps.length > 0) {
      const currentStep = result.steps[0];
      // Convert the step object to a string representation
      const stepString = `${currentStep.action}: ${currentStep.description}\nDetails: ${Array.isArray(currentStep.details) ? currentStep.details.join(', ') : currentStep.details}`;

      console.log(`[Coder] Executing step (${result.steps.length} remaining): ${currentStep.action} - ${currentStep.description}`);

      const stepState = {
        ...result,
        messages: [...result.messages, new HumanMessage(stepString)]
      };

      try {
        const agentResult = await this.agent.invoke(stepState);

        // Now invoke the tester agent to validate the implementation
        console.log(`[Coder] Testing implementation for: ${currentStep.description}`);
        const testResult = await this.testerAgent.getAgent().invoke({
          ...stepState,
          messages: [...stepState.messages, new HumanMessage(`Test the implementation for ${stepString}`)]
        });

        // Check if the test passed
        const testPassed = testResult.messages[testResult.messages.length - 1].content.toString().toLowerCase().includes("pass");
        console.log(`[Coder] Test result for "${currentStep.description}": ${testPassed ? 'PASS' : 'FAIL'}`);

        if (testPassed) {
          // If test passed, continue with the next step
          result = {
            ...agentResult,
            steps: result.steps.slice(1)
          };
        } else {
          // If test failed, add a new step to fix the issue at the front of the queue
          const newStep = {
            action: "fix",
            description: "Fix failed test",
            details: [`The implementation for "${currentStep.description}" failed tests. Please fix the implementation.`]
          };

          result = {
            ...agentResult,
            steps: [newStep, ...result.steps] // Add the fix step at the beginning
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
