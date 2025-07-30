/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Type definitions for common LLM parameters
 */

/**
 * Temperature controls the randomness of the model's output.
 * Lower values make the output more deterministic and conservative.
 * Higher values make the output more random and creative.
 * Typically ranges from 0.0 to 2.0.
 */
export type Temperature = number;

/**
 * Top-P (nucleus sampling) controls diversity by limiting the cumulative probability
 * of token selection. Lower values make the output more focused and deterministic.
 * Higher values allow for more diverse outputs.
 * Typically ranges from 0.0 to 1.0.
 */
export type TopP = number;

/**
 * Maximum number of tokens to generate in the completion.
 */
export type MaxTokens = number;

/**
 * Penalty for repeated tokens. Higher values discourage repetition.
 * Typically ranges from -2.0 to 2.0.
 */
export type FrequencyPenalty = number;

/**
 * Penalty for token presence. Higher values discourage using tokens that
 * have already appeared in the text.
 * Typically ranges from -2.0 to 2.0.
 */
export type PresencePenalty = number;

/**
 * Controls the model's verbosity. Lower values make responses more concise.
 * Typically ranges from -2.0 to 2.0.
 */
export type LengthPenalty = number;

/**
 * Number of completions to generate for each prompt.
 */
export type NCompletions = number;

/**
 * Whether to stream the response as tokens are generated.
 */
export type Stream = boolean;

/**
 * Stop sequences that will cause the model to stop generating further tokens.
 */
export type StopSequences = string | string[];