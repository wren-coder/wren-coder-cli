/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PlannerAgent } from "./planner.js";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";

describe("PlannerAgent", () => {
  const workingDir = "/test/dir";

  const llmModelConfig = {
    provider: Provider.OPENAI as Provider,
    model: "gpt-4" as Model,
    openAIApiKey: "fake-api-key", // This will be intercepted by MSW
  };

  it("should create an instance with correct properties", () => {
    const agent = new PlannerAgent({
      workingDir,
      llmModelConfig
    });

    expect(agent.getName()).toBe("planner");
    expect(agent.getDescription()).toBe("Analyzes the codebase, tests, and configurations to draft clear, step‑by‑step plans that reference project conventions and required verification steps.");
  });

  it("should have an invoke method", () => {
    const agent = new PlannerAgent({
      workingDir,
      llmModelConfig
    });
    expect(typeof agent.stream).toBe("function");
  });
});