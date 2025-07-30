/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TESTER_PROMPT, type TesterPromptVars } from "./tester.js";

describe("Tester Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project" };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toContain("Project root: **/test/project**");
    expect(prompt).toContain("You are the **Tester**");
    expect(prompt).toContain("RUN_SHELL");
  });

  it("should contain the correct output format instructions", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project" };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toContain('"result": "PASS"');
    expect(prompt).toContain('"result": "FAIL"');
  });

  it("should trim whitespace from the prompt", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project" };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});