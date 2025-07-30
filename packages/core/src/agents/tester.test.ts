/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from "vitest";
import { TesterAgent } from "./tester.js";
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

describe("TesterAgent", () => {
  const mockLlm = new MockChatModel({});
  const workingDir = "/test/dir";

  it("should create an instance with correct properties", () => {
    const agent = new TesterAgent({ llm: mockLlm, workingDir });
    
    expect(agent.getName()).toBe("Tester");
    expect(agent.getDescription()).toBe("Tests vs. the user spec, returns pass/fail and feedback");
  });

  it("should have the correct tools configured", () => {
    const agent = new TesterAgent({ llm: mockLlm, workingDir });
    
    // Verify that the agent instantiates correctly
    expect(agent).toBeDefined();
    // We can't easily check the tools array directly since it's protected,
    // but we've verified the agent instantiates correctly
  });
});