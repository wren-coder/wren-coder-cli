/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';

/**
 * Schema for the evaluator agent's response
 */
export const TesterResponseSchema = z.object({
  status_report: z.object({
    implementation_status: z.enum(["pass", "fail"]).describe('Overall pass/fail status'),
  }),
});

export type EvaluatorResponse = z.infer<typeof TesterResponseSchema>;