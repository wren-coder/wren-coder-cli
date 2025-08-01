/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CODER_PROMPT, type CoderPromptVars } from "./coder.js";

// Mock tools for testing
const mockTools = [
  {
    getName: () => "read_file",
    description: "Read a file",
  },
  {
    getName: () => "write_file",
    description: "Write a file",
  }
];

describe("Coder Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = CODER_PROMPT(vars);
    
    expect(prompt).toContain("# Coder Agent (Iterative Mode)");
    expect(prompt).toContain("ROOT: `/test/project`");
    expect(prompt).toContain("- `read_file`: Read a file");
    expect(prompt).toContain("- `write_file`: Write a file");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = CODER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});