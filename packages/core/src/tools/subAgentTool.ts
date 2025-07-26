/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShellTool, ShellToolParams } from './shell.js';
import { BaseTool, ToolResult } from './tools.js';
import { Type } from '@google/genai';
import { Config } from '../config/config.js';

export interface SubAgentToolParams {
  task: string;
  description?: string;
  directory?: string;
}

export class SubAgentTool extends BaseTool<SubAgentToolParams, ToolResult> {
  static Name: string = 'spawn_sub_agent';
  private shellTool: ShellTool;

  constructor(private readonly config: Config) {
    super(
      SubAgentTool.Name,
      'SubAgent',
      'This tool spawns sub-agents by running `wren --yolo -p "TASK"` in the shell. It leverages the existing ShellTool for execution.',
      {
        type: Type.OBJECT,
        properties: {
          task: {
            type: Type.STRING,
            description: 'The task to delegate to the sub-agent.',
          },
          description: {
            type: Type.OBJECT,
            description: 'Brief description of the task for the user.',
          },
          directory: {
            type: Type.OBJECT,
            description: 'Optional directory to run the command in.',
          },
        },
        required: ['task'],
      },
      false, // output is not markdown
      true, // output can be updated
    );
    this.shellTool = new ShellTool(config);
  }

  getDescription(params: SubAgentToolParams): string {
    let description = `Spawn sub-agent for task: ${params.task}`;
    if (params.directory) {
      description += ` [in ${params.directory}]`;
    }
    if (params.description) {
      description += ` (${params.description.replace(/\n/g, ' ')})`;
    }
    return description;
  }

  async execute(
    params: SubAgentToolParams,
    abortSignal: AbortSignal,
    updateOutput?: (chunk: string) => void,
  ): Promise<ToolResult> {
    const shellParams: ShellToolParams = {
      command: `wren --yolo -p "${params.task}"`,
      description: params.description,
      directory: params.directory,
    };

    return this.shellTool.execute(shellParams, abortSignal, updateOutput);
  }
}
