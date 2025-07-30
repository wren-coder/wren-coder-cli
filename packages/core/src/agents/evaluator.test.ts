/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { EvaluatorAgent } from "./evaluator.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Mock BaseChatModel
class MockChatModel extends BaseChatModel {
  _llmType(): string {
    return "mock";
  }
  
  // Mock the abstract method
  async _call() {
    return "";
  }
}

describe("EvaluatorAgent", () => {
  const mockLlm = new MockChatModel({});
  const workingDir = "/test/dir";

  it("should create an instance with correct properties", () => {
    const agent = new EvaluatorAgent({ llm: mockLlm, workingDir });
    
    expect(agent.getName()).toBe("evaluator");
    expect(agent.getDescription()).toBe("Evaluates code + tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have an evaluate method", () => {
    const agent = new EvaluatorAgent({ llm: mockLlm, workingDir });
    expect(typeof agent.evaluate).toBe("function");
  });
});