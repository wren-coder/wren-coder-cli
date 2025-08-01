/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PLANNER_PROMPT, PLANNER_W_QUERY_PROMPT, PLANNER_USER_PROMPT, type PlannerPromptVars } from "./planner.js";
import { ToolName } from "../tools/enum.js";
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

describe("Planner Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_PROMPT(vars);

    expect(prompt).toContain("## Planning Protocol");
    expect(prompt).toContain("Discovery Phase");
    expect(prompt).toContain("Analyze");
    expect(prompt).toContain("Explore");
    expect(prompt).toContain("Select");
    expect(prompt).toContain("Structure");
  });

  it("should contain the correct output format instructions", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_PROMPT(vars);

    expect(prompt).toContain("## Analysis");
    expect(prompt).toContain("## Plan");
    expect(prompt).toContain("## Verification");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_PROMPT(vars);

    expect(prompt).toEqual(prompt.trim());
  });
});

describe("Planner W/ Query Prompt", () => {
  it("should generate a prompt with the correct working directory and tools", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);

    expect(prompt).toContain("# Planner Agent");
    expect(prompt).toContain("ROOT: `/test/project`");
    expect(prompt).toContain("- `read_file`: Read a file");
    expect(prompt).toContain("- `write_file`: Write a file");
    expect(prompt).toContain("Query Handling");
    expect(prompt).toContain("Planning Mode");
  });

  it("should contain the query handling instructions", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);

    expect(prompt).toContain("**Direct Answer Mode**");
    expect(prompt).toContain("**Planning Mode**");
    expect(prompt).toContain(ToolName.GLOB);
    expect(prompt).toContain(ToolName.GREP);
    expect(prompt).toContain(ToolName.READ_FILE);
  });

  it("should contain the original planning protocol", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);

    expect(prompt).toContain("## Planning Protocol");
    expect(prompt).toContain("Discovery Phase");
    expect(prompt).toContain("Analyze");
    expect(prompt).toContain("Explore");
    expect(prompt).toContain("Select");
    expect(prompt).toContain("Structure");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools, };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);

    expect(prompt).toEqual(prompt.trim());
  });
});

describe("Planner User Prompt", () => {
  it("should generate a prompt with the correct query", () => {
    const query = "Implement a new feature";
    const prompt = PLANNER_USER_PROMPT(query);

    expect(prompt).toContain("ARCHITECT SOLUTION OR ANSWER QUERY:");
    expect(prompt).toContain(query);
  });

  it("should trim whitespace from the prompt", () => {
    const query = "Implement a new feature";
    const prompt = PLANNER_USER_PROMPT(query);

    expect(prompt).toEqual(prompt.trim());
  });
});