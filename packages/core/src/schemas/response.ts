/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Schema for the planner agent's response
 */
export const PlannerResponseSchema = z.object({
  steps: z.array(z.object({
    action: z.string(),
    description: z.string(),
    details: z.array(z.string()).or(z.string()),
  })).describe('Array of steps describing what actions to take')
});

/**
 * Schema for the evaluator agent's response
 */
export const EvaluatorResponseSchema = z.object({
  suggestions: z.array(z.string()).describe('Array of steps describing what to improve')
});


export type EvaluatorResponse = z.infer<typeof EvaluatorResponseSchema>;