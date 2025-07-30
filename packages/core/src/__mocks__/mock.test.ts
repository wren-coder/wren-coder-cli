/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { LLM_API_ENDPOINTS } from './handlers.js';

describe('MSW LLM API Mocking', () => {
  it('should mock OpenAI chat completions API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.OPENAI_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-api-key',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('choices');
    expect(data.choices[0].message.content).toContain('mocked response from the OpenAI API');
  });

  it('should mock streaming OpenAI chat completions API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.OPENAI_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-api-key',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }],
        stream: true,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const text = new TextDecoder().decode(value);
          // Parse the SSE format to extract content
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Verify we received the expected content
      expect(fullContent).toBe('This is a mocked streaming response from the OpenAI API.');
    }
  });

  it('should mock Anthropic API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.ANTHROPIC_MESSAGES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'fake-api-key',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello!' }],
        max_tokens: 1024,
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.content[0].text).toContain('mocked response from the Anthropic API');
  });

  it('should mock streaming Anthropic API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.ANTHROPIC_MESSAGES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'fake-api-key',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: 'Hello!' }],
        max_tokens: 1024,
        stream: true,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const text = new TextDecoder().decode(value);
          // Parse the SSE format to extract content
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Verify we received the expected content
      expect(fullContent).toBe('This is a mocked streaming response from the Anthropic API.');
    }
  });

  it('should mock DeepSeek API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.DEEPSEEK_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-api-key',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello!' }],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('choices');
    expect(data.choices[0].message.content).toContain('mocked response from the DeepSeek API');
  });

  it('should mock streaming DeepSeek API', async () => {
    const response = await fetch(LLM_API_ENDPOINTS.DEEPSEEK_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-api-key',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello!' }],
        stream: true,
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      let done = false;
      let fullContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const text = new TextDecoder().decode(value);
          // Parse the SSE format to extract content
          const lines = text.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  fullContent += data.choices[0].delta.content;
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      }

      // Verify we received the expected content
      expect(fullContent).toBe('This is a mocked streaming response from the DeepSeek API.');
    }
  });
});