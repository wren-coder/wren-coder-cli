/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TESTER_PROMPT, type TesterPromptVars } from "./tester.js";

// Mock tools for testing
const mockTools = [
  {
    getName: () => "read_file",
    description: "Read a file",
  },
  {
    getName: () => "run_shell",
    description: "Execute a shell command",
  }
];

describe("Tester Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toContain("# Tester Agent");
    expect(prompt).toContain("ROOT: `/test/project`");
    expect(prompt).toContain("- `read_file`: Read a file");
    expect(prompt).toContain("- `run_shell`: Execute a shell command");
  });

  it("should contain the correct output format instructions", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toContain("## Results");
    expect(prompt).toContain("- PASS:");
    expect(prompt).toContain("- FAIL:");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = TESTER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});