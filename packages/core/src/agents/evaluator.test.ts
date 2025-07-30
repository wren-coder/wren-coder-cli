/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { EvaluatorAgent } from "./evaluator.js";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";

describe("EvaluatorAgent", () => {
  const workingDir = "/test/dir";
  
  const llmModelConfig = {
    provider: Provider.OPENAI as Provider,
    model: "gpt-4" as Model,
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  };

  it("should create an instance with correct properties", () => {
    const agent = new EvaluatorAgent({ 
      workingDir,
      llmModelConfig
    });
    
    expect(agent.getName()).toBe("evaluator");
    expect(agent.getDescription()).toBe("Evaluates code + tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have an invoke method", () => {
    const agent = new EvaluatorAgent({ 
      workingDir,
      llmModelConfig
    });
    expect(typeof agent.invoke).toBe("function");
  });
});