/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

export const createHandoffTool = (agentName: string, description?: string) => {
    const name = `transfer_to_${agentName}`;
    const toolDescription = description || `Ask ${agentName} for help.`;

    return new DynamicStructuredTool({
        name,
        description: toolDescription,
        schema: z.object({
            task_description: z.string().describe(
                "Description of what the next agent should do, including all relevant context."
            ),
        }),
        func: async ({ task_description }) =>
            // In a real implementation, this would transfer control to the specified agent
            // For now, we'll just return a success message
            JSON.stringify({
                success: true,
                message: `Successfully transferred to ${agentName}`,
                task_description,
            })
        ,
    });
};
