/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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
  
  // Check if the string starts with a code block marker
  if (trimmed.startsWith('```')) {
    // Find the end of the code block marker (first newline after the opening markers)
    const firstNewlineIndex = trimmed.indexOf('\n');
    if (firstNewlineIndex !== -1) {
      // Extract content between the code block markers
      const lastTripleBacktickIndex = trimmed.lastIndexOf('```');
      if (lastTripleBacktickIndex !== -1 && lastTripleBacktickIndex > firstNewlineIndex) {
        trimmed = trimmed.substring(firstNewlineIndex + 1, lastTripleBacktickIndex);
      } else {
        // If no closing ``` found, just remove the opening ones
        trimmed = trimmed.substring(firstNewlineIndex + 1);
      }
    } else {
      // If no newline found after ```, remove the opening markers
      trimmed = trimmed.substring(3);
    }
    
    // Trim again after processing code block markers
    trimmed = trimmed.trim();
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