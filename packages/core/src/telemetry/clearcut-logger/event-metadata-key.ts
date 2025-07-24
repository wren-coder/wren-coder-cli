/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Defines valid event metadata keys for Clearcut logging.
export enum EventMetadataKey {
  WREN_CODER_KEY_UNKNOWN = 0,

  // ==========================================================================
  // Start Session Event Keys
  // ===========================================================================

  // Logs the model id used in the session.
  WREN_CODER_START_SESSION_MODEL = 1,

  // Logs the embedding model id used in the session.
  WREN_CODER_START_SESSION_EMBEDDING_MODEL = 2,

  // Logs the sandbox that was used in the session.
  WREN_CODER_START_SESSION_SANDBOX = 3,

  // Logs the core tools that were enabled in the session.
  WREN_CODER_START_SESSION_CORE_TOOLS = 4,

  // Logs the approval mode that was used in the session.
  WREN_CODER_START_SESSION_APPROVAL_MODE = 5,

  // Logs whether an API key was used in the session.
  WREN_CODER_START_SESSION_API_KEY_ENABLED = 6,

  // Logs whether the Vertex API was used in the session.
  WREN_CODER_START_SESSION_VERTEX_API_ENABLED = 7,

  // Logs whether debug mode was enabled in the session.
  WREN_CODER_START_SESSION_DEBUG_MODE_ENABLED = 8,

  // Logs the MCP servers that were enabled in the session.
  WREN_CODER_START_SESSION_MCP_SERVERS = 9,

  // Logs whether user-collected telemetry was enabled in the session.
  WREN_CODER_START_SESSION_TELEMETRY_ENABLED = 10,

  // Logs whether prompt collection was enabled for user-collected telemetry.
  WREN_CODER_START_SESSION_TELEMETRY_LOG_USER_PROMPTS_ENABLED = 11,

  // Logs whether the session was configured to respect gitignore files.
  WREN_CODER_START_SESSION_RESPECT_GITIGNORE = 12,

  // ==========================================================================
  // User Prompt Event Keys
  // ===========================================================================

  // Logs the length of the prompt.
  WREN_CODER_USER_PROMPT_LENGTH = 13,

  // ==========================================================================
  // Tool Call Event Keys
  // ===========================================================================

  // Logs the function name.
  WREN_CODER_TOOL_CALL_NAME = 14,

  // Logs the user's decision about how to handle the tool call.
  WREN_CODER_TOOL_CALL_DECISION = 15,

  // Logs whether the tool call succeeded.
  WREN_CODER_TOOL_CALL_SUCCESS = 16,

  // Logs the tool call duration in milliseconds.
  WREN_CODER_TOOL_CALL_DURATION_MS = 17,

  // Logs the tool call error message, if any.
  WREN_CODER_TOOL_ERROR_MESSAGE = 18,

  // Logs the tool call error type, if any.
  WREN_CODER_TOOL_CALL_ERROR_TYPE = 19,

  // ==========================================================================
  // GenAI API Request Event Keys
  // ===========================================================================

  // Logs the model id of the request.
  WREN_CODER_API_REQUEST_MODEL = 20,

  // ==========================================================================
  // GenAI API Response Event Keys
  // ===========================================================================

  // Logs the model id of the API call.
  WREN_CODER_API_RESPONSE_MODEL = 21,

  // Logs the status code of the response.
  WREN_CODER_API_RESPONSE_STATUS_CODE = 22,

  // Logs the duration of the API call in milliseconds.
  WREN_CODER_API_RESPONSE_DURATION_MS = 23,

  // Logs the error message of the API call, if any.
  WREN_CODER_API_ERROR_MESSAGE = 24,

  // Logs the input token count of the API call.
  WREN_CODER_API_RESPONSE_INPUT_TOKEN_COUNT = 25,

  // Logs the output token count of the API call.
  WREN_CODER_API_RESPONSE_OUTPUT_TOKEN_COUNT = 26,

  // Logs the cached token count of the API call.
  WREN_CODER_API_RESPONSE_CACHED_TOKEN_COUNT = 27,

  // Logs the thinking token count of the API call.
  WREN_CODER_API_RESPONSE_THINKING_TOKEN_COUNT = 28,

  // Logs the tool use token count of the API call.
  WREN_CODER_API_RESPONSE_TOOL_TOKEN_COUNT = 29,

  // ==========================================================================
  // GenAI API Error Event Keys
  // ===========================================================================

  // Logs the model id of the API call.
  WREN_CODER_API_ERROR_MODEL = 30,

  // Logs the error type.
  WREN_CODER_API_ERROR_TYPE = 31,

  // Logs the status code of the error response.
  WREN_CODER_API_ERROR_STATUS_CODE = 32,

  // Logs the duration of the API call in milliseconds.
  WREN_CODER_API_ERROR_DURATION_MS = 33,

  // ==========================================================================
  // End Session Event Keys
  // ===========================================================================

  // Logs the end of a session.
  WREN_CODER_END_SESSION_ID = 34,

  // ==========================================================================
  // Shared Keys
  // ===========================================================================

  // Logs the Prompt Id
  WREN_CODER_PROMPT_ID = 35,

  // Logs the Auth type for the prompt, api responses and errors.
  WREN_CODER_AUTH_TYPE = 36,

  // Logs the total number of Google accounts ever used.
  WREN_CODER_GOOGLE_ACCOUNTS_COUNT = 37,

  // ==========================================================================
  // Loop Detected Event Keys
  // ===========================================================================

  // Logs the type of loop detected.
  WREN_CODER_LOOP_DETECTED_TYPE = 38,
}

export function getEventMetadataKey(
  keyName: string,
): EventMetadataKey | undefined {
  // Access the enum member by its string name
  const key = EventMetadataKey[keyName as keyof typeof EventMetadataKey];

  // Check if the result is a valid enum member (not undefined and is a number)
  if (typeof key === 'number') {
    return key;
  }
  return undefined;
}
