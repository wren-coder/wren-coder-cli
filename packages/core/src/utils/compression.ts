/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getCompressionPrompt } from "../prompts/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Configuration for compression operations
 */
export interface CompressionConfig {
  /** Maximum token limit before compression is triggered */
  maxTokens: number;
  /** Target token count after compression */
  targetTokens?: number;
  /** Whether to enable chunking for very large content */
  enableChunking?: boolean;
  /** Maximum chunk size in tokens */
  maxChunkTokens?: number;

  maxMessages: number;
}

/**
 * Result of a compression operation
 */
export interface CompressionResult {
  /** Compressed content */
  content: string;
  /** Original token count (if available) */
  originalTokenCount?: number;
  /** New token count (if available) */
  newTokenCount?: number;
  /** Whether the content was chunked */
  wasChunked: boolean;
  /** Number of chunks if chunked */
  chunkCount?: number;
}

/**
 * Compresses large context using an LLM to summarize while preserving key information
 * 
 * @param content The content to compress
 * @param llm The language model to use for compression
 * @param config Compression configuration
 * @returns Compressed content result
 */
export async function compressContext(
  content: string,
  llm: BaseChatModel,
  _config: CompressionConfig
): Promise<CompressionResult> {
  // For now, we'll implement a basic compression using the LLM
  // In a more advanced implementation, we would check token counts and only compress if needed

  const compressionPrompt = getCompressionPrompt();

  try {
    const response = await llm.invoke([
      new SystemMessage(compressionPrompt),
      new HumanMessage(`Please compress the following content:\n\n${content}`)
    ]);

    return {
      content: response.content as string,
      wasChunked: false
    };
  } catch (_err) {
    // If compression fails, return the original content
    return {
      content,
      wasChunked: false
    };
  }
}

/**
 * Chunks large content into smaller pieces
 * 
 * @param content The content to chunk
 * @param maxChunkSize Maximum size of each chunk in characters
 * @returns Array of content chunks
 */
export function chunkContent(
  content: string,
  maxChunkSize: number = 10000
): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let position = 0;

  while (position < content.length) {
    const chunk = content.slice(position, position + maxChunkSize);
    chunks.push(chunk);
    position += maxChunkSize;
  }

  return chunks;
}

/**
 * Processes tool call responses and other large context, applying compression or chunking as needed
 * 
 * @param content The content to process
 * @param llm The language model to use for compression
 * @param config Compression configuration
 * @returns Processed content result
 */
export async function processLargeContext(
  content: string,
  llm: BaseChatModel,
  config: CompressionConfig
): Promise<CompressionResult> {
  const effectiveConfig = {
    maxTokens: config?.maxTokens ?? 30000, // Default max tokens before compression
    targetTokens: config?.targetTokens ?? 10000, // Default target after compression
    enableChunking: config?.enableChunking ?? true,
    maxChunkTokens: config?.maxChunkTokens ?? 5000
  };

  // For simplicity, we'll use character count as a proxy for token count
  // In a real implementation, we would use a tokenizer
  const charCount = content.length;
  const estimatedTokens = Math.floor(charCount / 4); // Rough estimate

  // If content is small enough, return as-is
  if (estimatedTokens <= effectiveConfig.maxTokens) {
    return {
      content,
      wasChunked: false
    };
  }

  // If content is very large and chunking is enabled, chunk it
  if (effectiveConfig.enableChunking && estimatedTokens > effectiveConfig.maxTokens * 2) {
    const maxChunkChars = effectiveConfig.maxChunkTokens * 4;
    const chunks = chunkContent(content, maxChunkChars);

    // If we only have one chunk, just compress it directly
    if (chunks.length === 1) {
      return await compressContext(content, llm, config);
    }

    // Compress each chunk and then compress the combined summaries
    const summaries = await Promise.all(chunks.map(chunk => compressContext(chunk, llm, config)));
    const combinedSummaries = summaries.map(s => s.content).join("----entry----");
    const finalResult = await compressContext(combinedSummaries, llm, config);

    return {
      ...finalResult,
      wasChunked: true,
      chunkCount: chunks.length
    };
  }

  // Otherwise, compress the content
  return await compressContext(content, llm, config);
}