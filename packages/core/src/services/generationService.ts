/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAnnotation } from "../types/stateAnnotation.js";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { processLargeContext, CompressionConfig } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export interface GenerationServiceConfig {
  compressionConfig: CompressionConfig;
  llm: BaseChatModel,
  agent: any,
  graphRecursionLimit?: number;
}

export class GenerationService {
  private agent;
  private compressionConfig: CompressionConfig;
  private llm: BaseChatModel;
  private graphRecursionLimit: number;

  constructor({ agent, llm, compressionConfig, graphRecursionLimit }: GenerationServiceConfig) {
    this.agent = agent;
    this.compressionConfig = compressionConfig;
    this.llm = llm;
    this.graphRecursionLimit = graphRecursionLimit ?? 25;
  }

  /**
   * Estimate token count for messages (simplified implementation)
   * In a production environment, you would use a proper tokenizer
   */
  private estimateTokenCount(messages: BaseMessage[]): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalChars = messages.reduce((acc, msg) => acc + JSON.stringify(msg).length, 0);
    return Math.floor(totalChars / 4);
  }

  /**
   * Compress message history if it exceeds token limits
   */
  private async compressMessages(messages: BaseMessage[]): Promise<BaseMessage[]> {
    const tokenCount = this.estimateTokenCount(messages);

    // If within limits, no compression needed
    if (tokenCount <= this.compressionConfig.maxTokens) {
      return messages.slice(-this.compressionConfig.maxMessages);
    }

    // Convert messages to string for compression
    const messagesString = messages.map(msg =>
      `${msg._getType()}: ${typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)} `
    ).join('\n');

    try {
      const compressionResult = await processLargeContext(messagesString, this.llm, this.compressionConfig);

      // Create a new message with the compressed content
      const compressedMessage = new HumanMessage(
        `Compressed conversation history:\n${compressionResult.content}`
      );

      // Return the compressed message plus any recent messages that weren't included
      return [compressedMessage];
    } catch (_error) {
      // If compression fails, fall back to truncation
      return messages.slice(-this.compressionConfig.maxMessages);
    }
  }

  async invoke(state: typeof StateAnnotation.State) {
    const processedMessages = await this.compressMessages(state.messages);
    const processedState = {
      ...state,
      messages: processedMessages
    };
    console.log(processedMessages);

    return await this.agent.invoke(processedState, { recursionLimit: this.graphRecursionLimit });
  }

  async * stream(state: typeof StateAnnotation.State) {
    const processedMessages = await this.compressMessages(state.messages);
    const processedState = {
      ...state,
      messages: processedMessages
    };
    console.log(processedMessages);

    if (this.agent.stream) {
      const stream = await this.agent.stream(processedState, { streamMode: "values", recursionLimit: this.graphRecursionLimit });

      for await (const chunk of stream) {
        yield chunk;
      }
    } else {
      const result = await this.agent.invoke(processedState);
      yield result;
    }
  }
}