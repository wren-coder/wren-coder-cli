/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PlannerAgent } from "./planner.js";
import { ChatOpenAI } from "@langchain/openai";

describe("PlannerAgent", () => {
  const workingDir = "/test/dir";
  
  // Use a real LLM instance that will be intercepted by MSW
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  });

  it("should create an instance with correct properties", () => {
    const agent = new PlannerAgent({ llm, workingDir });
    
    expect(agent.getName()).toBe("planner");
    expect(agent.getDescription()).toBe("Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.");
  });

  it("should have a plan method", () => {
    const agent = new PlannerAgent({ llm, workingDir });
    expect(typeof agent.plan).toBe("function");
  });
});