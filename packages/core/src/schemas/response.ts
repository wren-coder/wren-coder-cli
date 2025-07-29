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
  steps: z.array(z.string()).describe('Array of steps describing what actions to take')
});

/**
 * Schema for the evaluator agent's response
 */
export const EvaluatorResponseSchema = z.object({
  grade: z.enum(['pass', 'fail']).describe('Evaluation result: pass or fail'),
  feedback: z.string().describe('Explanation of the evaluation result')
});

export type PlannerResponse = z.infer<typeof PlannerResponseSchema>;
export type EvaluatorResponse = z.infer<typeof EvaluatorResponseSchema>;