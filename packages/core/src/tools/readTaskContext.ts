/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Config } from '../config/config.js';
import { BaseTool, ToolResult } from './tools.js';
import { Type } from '@google/genai';
import { ReadFileTool } from './read-file.js';
// import { SchemaValidator } from '../utils/schemaValidator.js';
import { getErrorMessage } from '../utils/errors.js';

/**
 * Parameters for ReadTaskContextTool
 */
export interface ReadTaskContextToolParams {
  sessionId: string;
  taskId?: string; // New optional parameter
}

/**
 * Task context schema (aligned with example.json)
 */
// const TASK_CONTEXT_SCHEMA = {
//     type: 'object',
//     properties: {
//         objective: { type: 'string' },
//         context: {
//             type: 'object',
//             properties: {
//                 codebase: { type: 'object' },
//                 constraints: { type: 'array' },
//             },
//             required: ['codebase'],
//         },
//         tasks: { type: 'array' },
//     },
//     required: ['objective', 'tasks'],
// };

export class ReadTaskContextTool extends BaseTool<
  ReadTaskContextToolParams,
  ToolResult
> {
  static readonly Name = 'read_task_context';

  constructor(private config: Config) {
    super(
      ReadTaskContextTool.Name,
      'ReadTaskContext',
      'Reads and validates the task context from a session-specific JSON file.',
      {
        properties: {
          sessionId: {
            type: Type.STRING,
            description: 'Unique session identifier.',
          },
          taskId: {
            type: Type.STRING,
            description: 'Optional ID of the task to read.',
          },
        },
        required: ['sessionId'],
        type: Type.OBJECT,
      },
    );
  }

  async execute(
    params: ReadTaskContextToolParams,
    abortSignal: AbortSignal,
  ): Promise<ToolResult> {
    const filePath = `${this.config.getTargetDir()}/.wren/session/${params.sessionId}/agent-context.json`;
    const readFileTool = new ReadFileTool(this.config);

    try {
      const result = await readFileTool.execute(
        { absolute_path: filePath },
        abortSignal,
      );

      if (result.llmContent instanceof Error) {
        throw result.llmContent;
      }

      interface Task {
        id: string;
      }

      interface TaskContext {
        tasks?: Task[];
      }

      const content: TaskContext = JSON.parse(
        result.llmContent as string,
      ) as TaskContext;
      // const validationError = SchemaValidator.validate(TASK_CONTEXT_SCHEMA, content);

      // if (validationError) {
      //     return {
      //         llmContent: `Task context validation failed: ${validationError}`,
      //         returnDisplay: `Invalid task context: ${validationError}`,
      //     };
      // }

      // If taskId is provided, find and return just that task
      if (params.taskId) {
        const task = content.tasks?.find((t) => t.id === params.taskId);
        if (!task) {
          throw new Error(`Task with ID ${params.taskId} not found`);
        }
        return {
          llmContent: JSON.stringify(task),
          returnDisplay: `Task ${params.taskId} context loaded successfully.`,
        };
      }

      // Otherwise return full context
      return {
        llmContent: JSON.stringify(content),
        returnDisplay: 'Task context loaded successfully.',
      };
    } catch (error) {
      return {
        llmContent: `Error reading task context: ${getErrorMessage(error)}`,
        returnDisplay: `Failed to read task context: ${getErrorMessage(error)}`,
      };
    }
  }
}
