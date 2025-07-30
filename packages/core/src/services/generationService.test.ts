/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerationService } from "./generationService.js";
import { StateAnnotation } from "../types/stateAnnotation.js";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Mock agent for testing
const mockAgent = {
  invoke: vi.fn(),
  stream: vi.fn()
};

// Mock LLM for testing
const mockLLM = {
  invoke: vi.fn()
};

describe("GenerationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate to the underlying agent for invoke", async () => {
    const service = new GenerationService(mockAgent);
    const state = {
      messages: [new HumanMessage("Hello")],
      steps: [],
      suggestions: []
    } as typeof StateAnnotation.State;

    mockAgent.invoke.mockResolvedValue({ content: "Response" });

    const result = await service.invoke(state);

    expect(mockAgent.invoke).toHaveBeenCalledWith(state);
    expect(result).toEqual({ content: "Response" });
  });

  it("should delegate to the underlying agent for stream", async () => {
    const service = new GenerationService(mockAgent);
    const state = {
      messages: [new HumanMessage("Hello")],
      steps: [],
      suggestions: []
    } as typeof StateAnnotation.State;

    const mockStream = (async function* () {
      yield { content: "Chunk 1" };
      yield { content: "Chunk 2" };
    })();

    mockAgent.stream.mockResolvedValue(mockStream);

    const results: any[] = [];
    for await (const chunk of service.stream(state)) {
      results.push(chunk);
    }

    expect(mockAgent.stream).toHaveBeenCalledWith(state);
    expect(results).toEqual([{ content: "Chunk 1" }, { content: "Chunk 2" }]);
  });

  it("should truncate messages when there's no LLM for compression", async () => {
    const service = new GenerationService(mockAgent, { maxMessages: 2 });
    const state = {
      messages: [
        new HumanMessage("Message 1"),
        new AIMessage("Response 1"),
        new HumanMessage("Message 2"),
        new AIMessage("Response 2"),
        new HumanMessage("Message 3"),
        new AIMessage("Response 3")
      ],
      steps: [],
      suggestions: []
    } as typeof StateAnnotation.State;

    mockAgent.invoke.mockResolvedValue({ content: "Response" });

    await service.invoke(state);

    const calledWithState = mockAgent.invoke.mock.calls[0][0];
    expect(calledWithState.messages).toHaveLength(2);
    expect(calledWithState.messages[0].content).toBe("Message 3");
    expect(calledWithState.messages[1].content).toBe("Response 3");
  });

  it("should use compression when LLM is available and messages exceed token limit", async () => {
    const service = new GenerationService(
      mockAgent,
      { maxTokens: 10, targetTokens: 5 },
      mockLLM as any
    );

    // Create a long message that should trigger compression
    const longMessage = "A".repeat(1000);
    const state = {
      messages: [new HumanMessage(longMessage)],
      steps: [],
      suggestions: []
    } as typeof StateAnnotation.State;

    mockLLM.invoke.mockResolvedValue({ content: "Compressed content" });
    mockAgent.invoke.mockResolvedValue({ content: "Response" });

    await service.invoke(state);

    // Should have called the LLM for compression
    expect(mockLLM.invoke).toHaveBeenCalled();
    // Should have called the agent with compressed messages
    expect(mockAgent.invoke).toHaveBeenCalled();
  });
});