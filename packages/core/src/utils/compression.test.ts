/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compressContext, chunkContent, processLargeContext } from './compression.js';
import { ChatDeepSeek } from "@langchain/deepseek";
import { AIMessage } from "@langchain/core/messages";

// Mock the LLM
const mockLlmInvoke = vi.fn();

vi.mock("@langchain/deepseek", () => {
  return {
    ChatDeepSeek: vi.fn().mockImplementation(() => {
      return {
        invoke: mockLlmInvoke
      };
    })
  };
});

describe('compression utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('chunkContent', () => {
    it('should not chunk small content', () => {
      const content = 'This is a small piece of content';
      const chunks = chunkContent(content, 100);
      expect(chunks).toEqual([content]);
    });

    it('should chunk large content', () => {
      const content = 'A'.repeat(100); // 100 characters
      const chunks = chunkContent(content, 30); // 30 characters per chunk
      expect(chunks.length).toBe(4); // 100/30 = 3.33 -> 4 chunks
      expect(chunks[0]).toBe('A'.repeat(30));
      expect(chunks[1]).toBe('A'.repeat(30));
      expect(chunks[2]).toBe('A'.repeat(30));
      expect(chunks[3]).toBe('A'.repeat(10));
    });
  });

  describe('compressContext', () => {
    it('should compress content using LLM', async () => {
      const content = 'This is a long piece of content that needs to be compressed';
      const mockLlm = new ChatDeepSeek({ model: 'deepseek-chat' });
      
      mockLlmInvoke.mockResolvedValue(new AIMessage('Compressed content'));
      
      const result = await compressContext(content, mockLlm);
      
      expect(result.content).toBe('Compressed content');
      expect(result.wasChunked).toBe(false);
      expect(mockLlmInvoke).toHaveBeenCalled();
    });

    it('should return original content if compression fails', async () => {
      const content = 'This is a long piece of content that needs to be compressed';
      const mockLlm = new ChatDeepSeek({ model: 'deepseek-chat' });
      
      mockLlmInvoke.mockRejectedValue(new Error('Compression failed'));
      
      const result = await compressContext(content, mockLlm);
      
      expect(result.content).toBe(content);
      expect(result.wasChunked).toBe(false);
    });
  });

  describe('processLargeContext', () => {
    it('should return small content as-is', async () => {
      const content = 'Small content';
      const mockLlm = new ChatDeepSeek({ model: 'deepseek-chat' });
      
      const result = await processLargeContext(content, mockLlm);
      
      expect(result.content).toBe(content);
      expect(result.wasChunked).toBe(false);
    });

    it('should chunk very large content', async () => {
      const content = 'A'.repeat(50000); // Large content
      const mockLlm = new ChatDeepSeek({ model: 'deepseek-chat' });
      
      // Mock the compressContext calls to return predictable results
      mockLlmInvoke.mockResolvedValue(new AIMessage('Compressed content'));
      
      const result = await processLargeContext(content, mockLlm, {
        maxTokens: 1000,
        enableChunking: true,
        maxChunkTokens: 1000
      });
      
      expect(result.wasChunked).toBe(true);
      expect(result.chunkCount).toBeGreaterThan(1);
    });
    
    it('should compress content without chunking when just over threshold', async () => {
      const content = 'A'.repeat(15000); // Medium-large content
      const mockLlm = new ChatDeepSeek({ model: 'deepseek-chat' });
      
      mockLlmInvoke.mockResolvedValue(new AIMessage('Compressed content'));
      
      const result = await processLargeContext(content, mockLlm, {
        maxTokens: 1000,
        enableChunking: true,
        maxChunkTokens: 5000
      });
      
      expect(result.content).toBe('Compressed content');
      expect(result.wasChunked).toBe(false);
    });
  });
});