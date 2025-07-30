/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CODER_PROMPT, type CoderPromptVars } from "./coder.js";

describe("Coder Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project" };
    const prompt = CODER_PROMPT(vars);
    
    expect(prompt).toContain("Project root: **/test/project**");
    expect(prompt).toContain("You are the **Coder**");
    expect(prompt).toContain("WRITE_FILE");
    expect(prompt).toContain("run linter, type checker, and build");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project" };
    const prompt = CODER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});