/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// import { SchemaValidator } from '../utils/schemaValidator.js';
import { getErrorMessage } from '../utils/errors.js';
import { BaseTool, ToolResult } from './tools.js';
import { Config } from '../config/config.js';
import { Type } from '@google/genai';
import { ReadTaskContextTool } from './readTaskContext.js';
import { WriteFileTool } from './write-file.js';

/**
 * Parameters for UpdateTaskContextTool
 */
export interface UpdateTaskContextToolParams {
    sessionId: string;
    updates: Partial<{
        objective: string;
        context: object;
        tasks: Array<{ id: string; status?: string }>;
    }>;
}

export class UpdateTaskContextTool extends BaseTool<
    UpdateTaskContextToolParams,
    ToolResult
> {
    static readonly Name = 'update_task_context';

    constructor(private config: Config) {
        super(
            UpdateTaskContextTool.Name,
            'UpdateTaskContext',
            'Updates the task context in a session-specific JSON file.',
            {
                properties: {
                    sessionId: {
                        type: Type.STRING,
                        description: 'Unique session identifier.',
                    },
                    updates: {
                        type: Type.OBJECT,
                        description: 'Partial updates to apply to the task context.',
                    },
                },
                required: ['sessionId', 'updates'],
                type: Type.OBJECT,
            },
        );
    }

    async execute(
        params: UpdateTaskContextToolParams,
        abortSignal: AbortSignal,
    ): Promise<ToolResult> {
        const filePath = `${this.config.getTargetDir()}/.wren/session/${params.sessionId}/agent-context.json`;
        const readTool = new ReadTaskContextTool(this.config);
        const writeTool = new WriteFileTool(this.config);

        try {
            // Read existing context
            const readResult = await readTool.execute(
                { sessionId: params.sessionId },
                abortSignal,
            );

            if (typeof readResult.llmContent === 'string') {
                throw new Error(readResult.llmContent);
            }

            const currentContext = readResult.llmContent;
            const updatedContext = { ...currentContext, ...params.updates };

            // // Validate merged context
            // const validationError = SchemaValidator.validate(
            //     TASK_CONTEXT_SCHEMA,
            //     updatedContext,
            // );

            // if (validationError) {
            //     return {
            //         llmContent: `Validation failed: ${validationError}`,
            //         returnDisplay: `Invalid updates: ${validationError}`,
            //     };
            // }

            // Write updated context
            const writeResult = await writeTool.execute(
                {
                    file_path: filePath,
                    content: JSON.stringify(updatedContext, null, 2),
                },
                abortSignal,
            );

            return {
                llmContent: updatedContext,
                returnDisplay: writeResult.returnDisplay,
            };
        } catch (error) {
            return {
                llmContent: `Error updating task context: ${getErrorMessage(error)}`,
                returnDisplay: `Failed to update task context: ${getErrorMessage(error)}`,
            };
        }
    }
}