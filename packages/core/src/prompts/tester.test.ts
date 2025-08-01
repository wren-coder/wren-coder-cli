/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TESTER_PROMPT, type TesterPromptVars } from "./tester.js";
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

describe("Tester Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools, };
    const prompt = TESTER_PROMPT(vars);

    expect(prompt).toContain("# Tester Agent");
    expect(prompt).toContain("ROOT: `/test/project`");
    expect(prompt).toContain("- `read_file`: Read a file");
    expect(prompt).toContain("- `run_shell`: Execute a shell command");
  });

  it("should contain the correct output format instructions", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools, };
    const prompt = TESTER_PROMPT(vars);

    expect(prompt).toContain("## Results");
    expect(prompt).toContain("- PASS:");
    expect(prompt).toContain("- FAIL:");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: TesterPromptVars = { workingDir: "/test/project", tools, };
    const prompt = TESTER_PROMPT(vars);

    expect(prompt).toEqual(prompt.trim());
  });
});