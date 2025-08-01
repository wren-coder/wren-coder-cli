/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { CODER_PROMPT, type CoderPromptVars } from "./coder.js";
import { createLlmFromConfig } from "../models/adapter.js";
import { GlobTool } from "../tools/glob.js";
import { ReadFileTool } from "../tools/read-file.js";
import { ShellTool } from "../tools/shell.js";
import { Model } from "../types/model.js";
import { Provider } from "../types/provider.js";

const config = {
  provider: Provider.DEEPSEEK,
  model: Model.DEEPSEEK_CHAT,
  temperature: 0.7,
  topP: 0.9,
};

const llm = createLlmFromConfig(config);

// Mock compression config for testing
const mockCompressionConfig = {
  maxContextLength: 1000,
  compressionThreshold: 500,
  maxTokens: 10000,
  maxMessages: 50,
};

// Real tools for testing
const tools = [
  ReadFileTool({
    workingDir: "/test/project",
    llm,
    compressionConfig: mockCompressionConfig
  }),
  GlobTool({
    workingDir: "/test/project",
    llm,
    compressionConfig: mockCompressionConfig
  }),
  ShellTool({
    workingDir: "/test/project",
    llm,
    compressionConfig: mockCompressionConfig
  })
];

describe("Coder Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project", tools };
    const prompt = CODER_PROMPT(vars);
    console.log("Generated prompt:", prompt); // Temporary log to see actual output

    expect(prompt).toContain("# Coder Agent (Iterative Mode)");
    expect(prompt).toContain("ROOT: `/test/project`");
    // Updated expectations based on actual tool descriptions
    expect(prompt).toContain("- `read_file`: Read text from a file.");
    expect(prompt).toContain("- `glob`: Searches for files matching a glob pattern");
    expect(prompt).toContain("- `run_shell`: Execute a Bash command on the host machine.");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: CoderPromptVars = { workingDir: "/test/project", tools };
    const prompt = CODER_PROMPT(vars);

    expect(prompt).toEqual(prompt.trim());
  });
});