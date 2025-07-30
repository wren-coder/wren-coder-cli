/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ZodSchema } from 'zod';
import { StateAnnotation } from '../types/stateAnnotation.js';

/**
 * Parses a JSON string with a specific format that includes a code block.
 * Handles strings like: ```json\n{\n  "result": "PASS"\n}\n```
 * 
 * @param jsonString - The JSON string to parse, potentially wrapped in code block markers
 * @returns The parsed JSON object
 * @throws {Error} If the JSON is malformed or cannot be parsed
 */
export function parseJsonString(jsonString: string): unknown {
  // Trim whitespace
  let trimmed = jsonString.trim();

  // Use regex to extract JSON content between ```json and ```
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const match = trimmed.match(jsonBlockRegex);

  if (match) {
    trimmed = match[1].trim();
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}\nJSON string: ${trimmed}`);
  }
}

/**
 * Type guard to check if an object has a specific property
 * 
 * @param obj - The object to check
 * @param key - The property key to look for
 * @returns Whether the object has the specified property
 */
export function hasProperty<T extends Record<string, unknown>, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Extracts structured response from agent result with fallback parsing
 * 
 * @param result - The agent result that may contain structuredResponse
 * @param schema - Zod schema to validate and parse the response
 * @param fallbackMessageExtractor - Function to extract message content for fallback parsing
 * @returns The parsed and validated structured response
 */
export function extractStructuredResponse<T>(
  result: { structuredResponse?: unknown, messages: typeof StateAnnotation.State.messages },
  schema: ZodSchema<T>,
): T {
  if (result.structuredResponse) {
    return schema.parse(result.structuredResponse);
  } else {
    console.warn("Fell back to string parsing");
    console.log(result)
    const content = result.messages[result.messages.length - 1].content.toString();
    const parsed = parseJsonString(content);
    return schema.parse(parsed);
  }
}
