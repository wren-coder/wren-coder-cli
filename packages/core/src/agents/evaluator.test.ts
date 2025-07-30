/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { EvaluatorAgent } from "./evaluator.js";
import { ChatOpenAI } from "@langchain/openai";

describe("EvaluatorAgent", () => {
  const workingDir = "/test/dir";
  
  // Use a real LLM instance that will be intercepted by MSW
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  });

  it("should create an instance with correct properties", () => {
    const agent = new EvaluatorAgent({ llm, workingDir });
    
    expect(agent.getName()).toBe("evaluator");
    expect(agent.getDescription()).toBe("Evaluates code + tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have an evaluate method", () => {
    const agent = new EvaluatorAgent({ llm, workingDir });
    expect(typeof agent.evaluate).toBe("function");
  });
});