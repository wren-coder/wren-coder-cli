/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CoderAgent } from "./coder.js";
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

describe("CoderAgent", () => {
  const mockLlm = new MockChatModel({});
  const workingDir = "/test/dir";

  it("should create an instance with correct properties", () => {
    const agent = new CoderAgent({ llm: mockLlm, workingDir });
    
    expect(agent.getName()).toBe("coder");
    expect(agent.getDescription()).toBe("Executes approved plans by editing and creating code using absolute paths, matching existing style and architecture, and running build, lint, and test commands to ensure quality.");
  });

  it("should have a code method", () => {
    const agent = new CoderAgent({ llm: mockLlm, workingDir });
    expect(typeof agent.code).toBe("function");
  });
});