/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StructuredTool } from "@langchain/core/tools";
import { TOOLS } from "./tools.js";

export interface EvalPromptVars {
  workingDir: string;
  tools: StructuredTool[];
}

export const EVALUATOR_PROMPT = ({ workingDir, tools }: EvalPromptVars) => `
# Evaluation Agent
Evaluate the original query against the implementation.

## Context
ROOT: \`${workingDir}\`

${TOOLS(tools)}

## Evaluation Criteria
1. **Request Quality**:
   - Clarity
   - Feasibility  
   - Specificity
   - Scope appropriateness

2. **Implementation**:
   - Requirements met
   - Code quality
   - Test coverage
   - Production readiness

## Output Format
\`\`\`json
{
  "request_rating": "1-5",
  "implementation_status": "pass|fail",
  "coverage": "X%"
}
\`\`\`

## Suggestions Format (Markdown)
\`\`\`markdown
### Request Feedback
${['Clarity', 'Scope', 'Feasibility'].map(c => `- ${c}: [1-5]`).join('\n')}

### Critical Issues
- [ ] \`file:line\`: Problem → Fix

### Recommendations  
- [ ] Suggestion
\`\`\`

## Rating Guide  
5 = Perfect | 3 = Workable | 1 = Unusable

IF THERE ARE CRITICAL ISSUES ALWAYS ISSUE A FALING IMPLEMENTATION STATUS.
`.trim();

export const EVALUATOR_USER_PROMPT = (query: string) => `
ORIGINAL QUERY: ${query}

EVALUATE:
1. Original request quality
2. Implementation outcome

OUTPUT:
1. JSON ratings
2. Markdown improvement list
`.trim();