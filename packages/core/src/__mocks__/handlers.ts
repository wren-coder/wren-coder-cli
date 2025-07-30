/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { http, HttpResponse } from 'msw';

// API endpoint constants to avoid magic strings
export const LLM_API_ENDPOINTS = {
  OPENAI_CHAT: 'https://api.openai.com/v1/chat/completions',
  ANTHROPIC_MESSAGES: 'https://api.anthropic.com/v1/messages',
  DEEPSEEK_CHAT: 'https://api.deepseek.com/v1/chat/completions',
  GROQ_CHAT: 'https://api.groq.com/openai/v1/chat/completions',
  MISTRAL_CHAT: 'https://api.mistral.ai/v1/chat/completions',
  GOOGLE_GEMINI: 'https://generativelanguage.googleapis.com/v1beta/models',
} as const;

// Mock handlers for LLM API calls
export const handlers = [
  // Mock for OpenAI chat completions API
  http.post(LLM_API_ENDPOINTS.OPENAI_CHAT, async () => HttpResponse.json({
    id: 'chatcmpl-mock123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'gpt-4-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mocked response from the OpenAI API.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    },
  })),

  // Mock for Anthropic API
  http.post(LLM_API_ENDPOINTS.ANTHROPIC_MESSAGES, async () => HttpResponse.json({
    id: 'msg-mock123',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: 'This is a mocked response from the Anthropic API.',
      },
    ],
    model: 'claude-3-mock',
    stop_reason: 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: 10,
      output_tokens: 5,
    },
  })),

  // Mock for DeepSeek API
  http.post(LLM_API_ENDPOINTS.DEEPSEEK_CHAT, async () => HttpResponse.json({
    id: 'deepseek-mock123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'deepseek-chat-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mocked response from the DeepSeek API.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 12,
      completion_tokens: 8,
      total_tokens: 20,
    },
  })),

  // Mock for Groq API
  http.post(LLM_API_ENDPOINTS.GROQ_CHAT, async () => HttpResponse.json({
    id: 'groq-mock123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'llama3-8b-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mocked response from the Groq API.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 8,
      completion_tokens: 6,
      total_tokens: 14,
    },
  })),

  // Mock for Mistral API
  http.post(LLM_API_ENDPOINTS.MISTRAL_CHAT, async () => HttpResponse.json({
    id: 'mistral-mock123',
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mistral-small-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: 'This is a mocked response from the Mistral API.',
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 9,
      completion_tokens: 7,
      total_tokens: 16,
    },
  })),

  // Mock for Google Gemini API
  http.post(`${LLM_API_ENDPOINTS.GOOGLE_GEMINI}/*/generateContent`, async () => HttpResponse.json({
    candidates: [
      {
        content: {
          parts: [
            {
              text: 'This is a mocked response from the Google Gemini API.',
            },
          ],
          role: 'model',
        },
        finishReason: 'STOP',
        index: 0,
        safetyRatings: [],
      },
    ],
    promptFeedback: { safetyRatings: [] },
  })),

  // Generic mock for any other LLM API
  http.post('*', async ({ request }) => {
    const url = new URL(request.url);

    // Only mock API calls that look like LLM endpoints
    if (url.pathname.includes('api') && (url.pathname.includes('completion') || url.pathname.includes('generate'))) {
      return HttpResponse.json({
        id: 'generic-mock123',
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'This is a generic mocked response for an LLM API.',
            },
          },
        ],
      });
    }

    // Let non-matching requests pass through
    return new HttpResponse(null, { status: 404 });
  }),
];