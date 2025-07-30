/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { EVALUATOR_PROMPT, type EvalPromptVars } from "./evaluator.js";

describe("Evaluator Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: EvalPromptVars = { workingDir: "/test/project" };
    const prompt = EVALUATOR_PROMPT(vars);
    
    expect(prompt).toContain("Project root: **/test/project**");
    expect(prompt).toContain("You are the **Evaluator**");
    expect(prompt).toContain("READ_FILE");
    expect(prompt).toContain("`RUN_SHELL` for tests, linting, type checks, build");
  });

  it("should contain the correct output format instructions", () => {
    const vars: EvalPromptVars = { workingDir: "/test/project" };
    const prompt = EVALUATOR_PROMPT(vars);
    
    expect(prompt).toContain('Output **only** JSON matching the Evaluator schema');
    expect(prompt).toContain('"suggestions":');
  });

  it("should trim whitespace from the prompt", () => {
    const vars: EvalPromptVars = { workingDir: "/test/project" };
    const prompt = EVALUATOR_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});