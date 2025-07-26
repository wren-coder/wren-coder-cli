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
  taskId: string;
  updates: Partial<{
    contextNotes: string;
    status: string;
    acceptanceStatus: string;
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
      'Updates a specific task in the session context JSON file.',
      {
        properties: {
          sessionId: {
            type: Type.STRING,
            description: 'Unique session identifier.',
          },
          taskId: {
            type: Type.STRING,
            description: 'ID of the task to update.',
          },
          updates: {
            type: Type.OBJECT,
            description:
              'Allowed updates: contextNotes, status, acceptanceStatus',
            properties: {
              contextNotes: { type: Type.STRING },
              status: { type: Type.STRING },
              acceptanceStatus: { type: Type.STRING },
            },
          },
        },
        required: ['sessionId', 'taskId', 'updates'],
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

      const currentContext = JSON.parse(readResult.llmContent.toString());

      // Find and update the specific task
      const taskIndex = currentContext.tasks?.findIndex(
        (t: { id: string }) => t.id === params.taskId,
      );
      if (taskIndex === -1 || taskIndex === undefined) {
        throw new Error(`Task with ID ${params.taskId} not found`);
      }

      // Apply only allowed updates
      const updatedTask = {
        ...currentContext.tasks[taskIndex],
        ...params.updates,
      };

      const updatedContext = {
        ...currentContext,
        tasks: [
          ...currentContext.tasks.slice(0, taskIndex),
          updatedTask,
          ...currentContext.tasks.slice(taskIndex + 1),
        ],
      };

      // Write updated context
      const writeResult = await writeTool.execute(
        {
          file_path: filePath,
          content: JSON.stringify(updatedContext, null, 2),
        },
        abortSignal,
      );

      return {
        llmContent: updatedTask,
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
