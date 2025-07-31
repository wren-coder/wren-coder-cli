/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Schema for the evaluator agent's response
 */
export const EvaluatorResponseSchema = z.object({
  status_report: z.object({
    request_rating: z.number().min(1).max(5).describe('Request quality rating 1-5'),
    implementation_status: z.enum(["pass", "fail"]).describe('Overall pass/fail status'),
    coverage: z.string().regex(/^\d+%$/).describe('Test coverage percentage')
  }),
  suggestions_md: z.string().describe('Markdown formatted improvement list')
});

export type EvaluatorResponse = z.infer<typeof EvaluatorResponseSchema>;