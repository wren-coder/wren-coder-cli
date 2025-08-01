/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { TOOLS } from "./tools.js";
import { ReadFileTool } from "../tools/read-file.js";
import { GlobTool } from "../tools/glob.js";
import { ShellTool } from "../tools/shell.js";
import { ToolName } from "../tools/enum.js";
import { createLlmFromConfig } from "../models/adapter.js";
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

describe("Tools Prompt", () => {
  it("should generate a prompt with the correct working directory and tools", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, tools);

    expect(prompt).toContain("# Available Tools");
    expect(prompt).toContain(`- \`${ToolName.READ_FILE}\`: Read text from a file. Input: { path: string }. Returns file contents or an error message. Large files will be automatically compressed.`);
    expect(prompt).toContain(`- \`${ToolName.GLOB}\`: Searches for files matching a glob pattern in the user's workspace directory, returning absolute paths sorted by modification time (newest first). Input: { pattern: string }. Returns an array of matching file paths or an error message. Large results will be automatically compressed.`);
    expect(prompt).toContain(`- \`${ToolName.RUN_SHELL}\`: Execute a Bash command on the host machine. Input must be a single string containing the full command (e.g. 'ls -la').`);
    expect(prompt).toContain(`\`${workingDir}/path/to/file.ext\``);
  });

  it("should handle empty tools array", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, []);

    expect(prompt).toContain("# Available Tools");
    // When there are no tools, there should be a blank line between "Available Tools" and "## Tool Usage"
    const lines = prompt.split('\n');
    const availableToolsIndex = lines.findIndex(line => line.includes("Available Tools"));
    expect(lines[availableToolsIndex + 1]).toBe("");
  });

  it("should contain tool usage instructions", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, tools);

    expect(prompt).toContain("## Tool Usage");
    expect(prompt).toContain("File Paths:");
    expect(prompt).toContain("Parallelism:");
    expect(prompt).toContain("Git Prohibition:");
    expect(prompt).toContain("Command Execution:");
  });

  it("should trim whitespace from the prompt", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, tools);

    expect(prompt).toEqual(prompt.trim());
  });

  it("should include tool examples in the prompt", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, tools);

    expect(prompt).toContain(`[tool_call: ${ToolName.GLOB} for pattern 'src/**/*.ts']`);
    expect(prompt).toContain(`[tool_call: ${ToolName.READ_FILE} for absolute_path '/path/to/file.txt']`);
    expect(prompt).toContain(`[tool_call: ${ToolName.RUN_SHELL} for 'ls -la']`);
  });

  it("should contain specific tool usage instructions", () => {
    const workingDir = "/test/project";
    const prompt = TOOLS(workingDir, tools);

    expect(prompt).toContain("File Paths:");
    expect(prompt).toContain("Parallelism:");
    expect(prompt).toContain("Git Prohibition:");
    expect(prompt).toContain("Command Execution:");
    expect(prompt).toContain("Background Processes:");
    expect(prompt).toContain("Interactive Commands:");
    expect(prompt).toContain("User Confirmations:");
    expect(prompt).toContain("Failure Handling:");
  });
});