/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PlannerAgent } from "./planner.js";
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

describe("PlannerAgent", () => {
  const mockLlm = new MockChatModel({});
  const workingDir = "/test/dir";

  it("should create an instance with correct properties", () => {
    const agent = new PlannerAgent({ llm: mockLlm, workingDir });
    
    expect(agent.getName()).toBe("planner");
    expect(agent.getDescription()).toBe("Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.");
  });

  it("should have a plan method", () => {
    const agent = new PlannerAgent({ llm: mockLlm, workingDir });
    expect(typeof agent.plan).toBe("function");
  });
});