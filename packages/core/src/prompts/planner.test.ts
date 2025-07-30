/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PLANNER_PROMPT, type PlannerPromptVars } from "./planner.js";

describe("Planner Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project" };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toContain("Project root: **/test/project**");
    expect(prompt).toContain("You are the **Planner**");
    expect(prompt).toContain("glob/read-file tools");
    expect(prompt).toContain("steps");
  });

  it("should contain the correct output format instructions", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project" };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toContain('Output **only** a JSON object matching the Planner schema');
    expect(prompt).toContain('"steps":');
  });

  it("should trim whitespace from the prompt", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project" };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});