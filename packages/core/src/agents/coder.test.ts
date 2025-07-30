/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CoderAgent } from "./coder.js";
import { ChatOpenAI } from "@langchain/openai";

describe("CoderAgent", () => {
  const workingDir = "/test/dir";
  
  // Use a real LLM instance that will be intercepted by MSW
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  });

  it("should create an instance with correct properties", () => {
    const agent = new CoderAgent({ 
      llm, 
      workingDir,
      model: "gpt-4",
      provider: "openai"
    });
    
    expect(agent.getName()).toBe("coder");
    expect(agent.getDescription()).toBe("Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.");
  });

  it("should have an invoke method", () => {
    const agent = new CoderAgent({ 
      llm, 
      workingDir,
      model: "gpt-4",
      provider: "openai"
    });
    expect(typeof agent.invoke).toBe("function");
  });
});;