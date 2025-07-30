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

// Helper function to create a streaming response
function createStreamingResponse(provider: string, delayMs: number = 50): ReadableStream {
  const contentMap: Record<string, string> = {
    openai: 'This is a mocked streaming response from the OpenAI API.',
    anthropic: 'This is a mocked streaming response from the Anthropic API.',
    deepseek: 'This is a mocked streaming response from the DeepSeek API.',
    groq: 'This is a mocked streaming response from the Groq API.',
    mistral: 'This is a mocked streaming response from the Mistral API.',
    generic: 'This is a generic mocked streaming response for an LLM API.',
  };
  
  const content = contentMap[provider] || contentMap.generic;
  // Split by spaces but keep the punctuation with the last word
  const words = content.split(' ');
  
  return new ReadableStream({
    async start(controller) {
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i];
        const data = `data: ${JSON.stringify({
          id: 'chatcmpl-mock-stream',
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: 'gpt-4-mock',
          choices: [
            {
              index: 0,
              delta: {
                content: chunk + (i < words.length - 1 ? ' ' : ''),
              },
              finish_reason: null,
            },
          ],
        })}\n\n`;
        
        controller.enqueue(new TextEncoder().encode(data));
        
        // Add a small delay to simulate network latency
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      // Send the final chunk with finish_reason
      const finalData = `data: ${JSON.stringify({
        id: 'chatcmpl-mock-stream',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4-mock',
        choices: [
          {
            index: 0,
            delta: {},
            finish_reason: 'stop',
          },
        ],
      })}\n\n`;
      
      controller.enqueue(new TextEncoder().encode(finalData));
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// Mock handlers for LLM API calls
export const handlers = [
  // Mock for OpenAI chat completions API (non-streaming)
  http.post(LLM_API_ENDPOINTS.OPENAI_CHAT, async ({ request }) => {
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;
    
    if (isStreaming) {
      // Streaming response
      return new HttpResponse(createStreamingResponse('openai'), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      return HttpResponse.json({
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
      });
    }
  }),

  // Mock for Anthropic API (non-streaming)
  http.post(LLM_API_ENDPOINTS.ANTHROPIC_MESSAGES, async ({ request }) => {
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;
    
    if (isStreaming) {
      // Streaming response for Anthropic
      return new HttpResponse(createStreamingResponse('anthropic'), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      return HttpResponse.json({
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
      });
    }
  }),

  // Mock for DeepSeek API (non-streaming)
  http.post(LLM_API_ENDPOINTS.DEEPSEEK_CHAT, async ({ request }) => {
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;
    
    if (isStreaming) {
      // Streaming response for DeepSeek
      return new HttpResponse(createStreamingResponse('deepseek'), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      return HttpResponse.json({
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
      });
    }
  }),

  // Mock for Groq API (non-streaming)
  http.post(LLM_API_ENDPOINTS.GROQ_CHAT, async ({ request }) => {
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;
    
    if (isStreaming) {
      // Streaming response for Groq
      return new HttpResponse(createStreamingResponse('groq'), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      return HttpResponse.json({
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
      });
    }
  }),

  // Mock for Mistral API (non-streaming)
  http.post(LLM_API_ENDPOINTS.MISTRAL_CHAT, async ({ request }) => {
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;
    
    if (isStreaming) {
      // Streaming response for Mistral
      return new HttpResponse(createStreamingResponse('mistral'), {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      return HttpResponse.json({
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
      });
    }
  }),

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
    const requestBody = await request.json();
    const isStreaming = requestBody?.stream === true;

    // Only mock API calls that look like LLM endpoints
    if (url.pathname.includes('api') && (url.pathname.includes('completion') || url.pathname.includes('generate'))) {
      if (isStreaming) {
        // Streaming response for generic API
        return new HttpResponse(createStreamingResponse('generic'), {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } else {
        // Non-streaming response for generic API
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
    }

    // Let non-matching requests pass through
    return new HttpResponse(null, { status: 404 });
  }),
];