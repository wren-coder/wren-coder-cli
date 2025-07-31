/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAnnotation } from "../types/stateAnnotation.js";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { processLargeContext, CompressionConfig } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { MessageRoles } from "../types/messageRole.js";

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

  async stream(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State> {
    const processedMessages = await this.compressMessages(state.messages);
    const processedState = {
      ...state,
      messages: processedMessages
    };
    const iterator = await this.agent.stream(processedState, { streamMode: "values", recursionLimit: this.graphRecursionLimit });

    let finalState: { messages: BaseMessage[] } | undefined;
    let shownCount = processedMessages.length;
    for await (const state of iterator) {
      finalState = state;


      const all = state.messages;
      const newlyAdded = all.slice(shownCount);
      newlyAdded.forEach((m: BaseMessage) => {
        const role = m instanceof HumanMessage
          ? MessageRoles.USER
          : m instanceof AIMessage
            ? MessageRoles.ASSISTANT
            : MessageRoles.SYSTEM;
        console.log(`[${role}] ${m.content}`);
      });
      shownCount = all.length;
    }

    if (!finalState) {
      throw new Error();
    }

    const last = finalState.messages
      .filter((m): m is AIMessage => m instanceof AIMessage)
      .at(-1);

    if (last) {
      console.log("assistant:", last.content);
    }

    return {
      ...processedState,
      messages: finalState.messages
    }
  }
}