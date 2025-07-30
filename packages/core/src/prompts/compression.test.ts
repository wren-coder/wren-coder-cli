/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { getCompressionPrompt } from "./compression.js";

describe("Compression Prompt", () => {
  it("should generate a prompt with the correct structure", () => {
    const prompt = getCompressionPrompt();
    
    expect(prompt).toContain("You are the component that summarizes internal chat history");
    expect(prompt).toContain("<state_snapshot>");
    expect(prompt).toContain("<overall_goal>");
    expect(prompt).toContain("<key_knowledge>");
    expect(prompt).toContain("<file_system_state>");
    expect(prompt).toContain("<recent_actions>");
    expect(prompt).toContain("<current_plan>");
  });

  it("should contain examples in the prompt", () => {
    const prompt = getCompressionPrompt();
    
    expect(prompt).toContain("Refactor the authentication service to use a new JWT library");
    expect(prompt).toContain("Build Command: `npm run build`");
    expect(prompt).toContain("READ: `package.json`");
    expect(prompt).toContain("[DONE] Identify all files using the deprecated 'UserAPI'");
  });

  it("should trim whitespace from the prompt", () => {
    const prompt = getCompressionPrompt();
    
    expect(prompt).toEqual(prompt.trim());
  });
});