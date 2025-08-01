/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from "vitest";
import { PLANNER_PROMPT, PLANNER_W_QUERY_PROMPT, PLANNER_USER_PROMPT, type PlannerPromptVars } from "./planner.js";
import { ToolName } from "../tools/enum.js";

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

describe("Planner Prompt", () => {
  it("should generate a prompt with the correct working directory", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toContain("## Planning Protocol");
    expect(prompt).toContain("Discovery Phase");
    expect(prompt).toContain("Analyze");
    expect(prompt).toContain("Explore");
    expect(prompt).toContain("Select");
    expect(prompt).toContain("Structure");
  });

  it("should contain the correct output format instructions", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toContain("## Analysis");
    expect(prompt).toContain("## Plan");
    expect(prompt).toContain("## Verification");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_PROMPT(vars);
    
    expect(prompt).toEqual(prompt.trim());
  });
});

describe("Planner W/ Query Prompt", () => {
  it("should generate a prompt with the correct working directory and tools", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);
    
    expect(prompt).toContain("# Planner Agent");
    expect(prompt).toContain("ROOT: `/test/project`");
    expect(prompt).toContain("- `read_file`: Read a file");
    expect(prompt).toContain("- `write_file`: Write a file");
    expect(prompt).toContain("Query Handling");
    expect(prompt).toContain("Planning Mode");
  });

  it("should contain the query handling instructions", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);
    
    expect(prompt).toContain("**Direct Answer Mode**");
    expect(prompt).toContain("**Planning Mode**");
    expect(prompt).toContain(ToolName.GLOB);
    expect(prompt).toContain(ToolName.GREP);
    expect(prompt).toContain(ToolName.READ_FILE);
  });

  it("should contain the original planning protocol", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
    const prompt = PLANNER_W_QUERY_PROMPT(vars);
    
    expect(prompt).toContain("## Planning Protocol");
    expect(prompt).toContain("Discovery Phase");
    expect(prompt).toContain("Analyze");
    expect(prompt).toContain("Explore");
    expect(prompt).toContain("Select");
    expect(prompt).toContain("Structure");
  });

  it("should trim whitespace from the prompt", () => {
    const vars: PlannerPromptVars = { workingDir: "/test/project", tools: mockTools };
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