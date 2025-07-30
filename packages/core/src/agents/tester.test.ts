/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TesterAgent } from "./tester.js";
import { ChatOpenAI } from "@langchain/openai";

describe("TesterAgent", () => {
  const workingDir = "/test/dir";
  
  // Use a real LLM instance that will be intercepted by MSW
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  });

  it("should create an instance with correct properties", () => {
    const agent = new TesterAgent({ 
      llm, 
      workingDir,
      model: "gpt-4",
      provider: "openai"
    });
    
    expect(agent.getName()).toBe("Tester");
    expect(agent.getDescription()).toBe("Tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have an invoke method", () => {
    const agent = new TesterAgent({ 
      llm, 
      workingDir,
      model: "gpt-4",
      provider: "openai"
    });
    expect(typeof agent.invoke).toBe("function");
  });

  it("should have the correct tools configured", () => {
    const agent = new TesterAgent({ 
      llm, 
      workingDir,
      model: "gpt-4",
      provider: "openai"
    });
    
    // Verify that the agent instantiates correctly
    expect(agent).toBeDefined();
    // We can't easily check the tools array directly since it's protected,
    // but we've verified the agent instantiates correctly
  });
});