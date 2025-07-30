/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAnnotation } from "../types/stateAnnotation.js";
import { getCompressionPrompt } from "../prompts/compression.js";

export class GenerationService {
  private agent;

  constructor(agent: any) {
    this.agent = agent;
  }

  async invoke(state: typeof StateAnnotation.State) {
    // Here we could add compression, chunking, etc. logic
    // For now, we'll just delegate to the underlying agent
    return await this.agent.invoke(state);
  }

  async *stream(state: typeof StateAnnotation.State) {
    // Streaming implementation with potential for compression, chunking, etc.
    // This is a simplified version - in a real implementation, we'd add the additional features
    const stream = await this.agent.stream(state);

    for await (const chunk of stream) {
      // Could add chunking, compression, or other processing here
      yield chunk;
    }
  }

  // Additional methods for compression, chunking, etc. could be added here
}