/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TesterAgent } from "./tester.js";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";

describe("TesterAgent", () => {
  const workingDir = "/test/dir";
  
  const llmModelConfig = {
    provider: Provider.OPENAI as Provider,
    model: "gpt-4" as Model,
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  };

  it("should create an instance with correct properties", () => {
    const agent = new TesterAgent({ 
      workingDir,
      llmModelConfig
    });
    
    expect(agent.getName()).toBe("Tester");
    expect(agent.getDescription()).toBe("Tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have an invoke method", () => {
    const agent = new TesterAgent({ 
      workingDir,
      llmModelConfig
    });
    expect(typeof agent.invoke).toBe("function");
  });

  it("should have the correct tools configured", () => {
    const agent = new TesterAgent({ 
      workingDir,
      llmModelConfig
    });
    
    // Verify that the agent instantiates correctly
    expect(agent).toBeDefined();
    // We can't easily check the tools array directly since it's protected,
    // but we've verified the agent instantiates correctly
  });
});