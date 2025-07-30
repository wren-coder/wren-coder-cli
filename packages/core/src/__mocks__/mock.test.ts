/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { LLM_API_ENDPOINTS } from './handlers';

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
});