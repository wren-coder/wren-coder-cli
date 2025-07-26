/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateTaskContextTool } from './updateTaskContext.js';
import { Config } from '../config/config.js';
import { ReadTaskContextTool } from './readTaskContext.js';
import { WriteFileTool } from './write-file.js';
import { getErrorMessage } from '../utils/errors.js';

// Mock dependencies
vi.mock('./readTaskContext.js');
vi.mock('./write-file.js');
vi.mock('../config/config.js');

const mockConfig = {
  getTargetDir: vi.fn().mockReturnValue('/mock/target/dir'),
} as unknown as Config;

const mockReadTool = {
  execute: vi.fn(),
} as unknown as ReadTaskContextTool;

const mockWriteTool = {
  execute: vi.fn(),
} as unknown as WriteFileTool;

// Mock the constructors to return our mock instances
vi.mocked(ReadTaskContextTool).mockReturnValue(mockReadTool);
vi.mocked(WriteFileTool).mockReturnValue(mockWriteTool);

describe('UpdateTaskContextTool', () => {
  let tool: UpdateTaskContextTool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new UpdateTaskContextTool(mockConfig);
  });

  it('should successfully update a task context file', async () => {
    const mockCurrentContext = {
      objective: 'test objective',
      tasks: ['task1', 'task2'],
    };

    const mockUpdates = {
      objective: 'updated objective',
    };

    const mockWriteResult = {
      returnDisplay: 'File written successfully.',
    };

    vi.mocked(mockReadTool.execute).mockResolvedValue({
      llmContent: mockCurrentContext,
    });

    vi.mocked(mockWriteTool.execute).mockResolvedValue(mockWriteResult);

    const result = await tool.execute(
      { sessionId: 'test-session', updates: mockUpdates },
      new AbortController().signal,
    );

    expect(result.llmContent).toEqual({
      ...mockCurrentContext,
      ...mockUpdates,
    });
    expect(result.returnDisplay).toBe(mockWriteResult.returnDisplay);
    expect(mockReadTool.execute).toHaveBeenCalledWith(
      { sessionId: 'test-session' },
      expect.any(AbortSignal),
    );
    expect(mockWriteTool.execute).toHaveBeenCalledWith(
      {
        file_path: '/mock/target/dir/.wren/session/test-session/agent-context.json',
        content: JSON.stringify({
          ...mockCurrentContext,
          ...mockUpdates,
        }, null, 2),
      },
      expect.any(AbortSignal),
    );
  });

  it('should handle read errors', async () => {
    const mockError = new Error('File not found');
    vi.mocked(mockReadTool.execute).mockResolvedValue({
      llmContent: getErrorMessage(mockError),
    });

    const result = await tool.execute(
      { sessionId: 'test-session', updates: {} },
      new AbortController().signal,
    );

    expect(result.llmContent).toContain('Error updating task context');
    expect(result.returnDisplay).toContain('Failed to update task context');
  });

  it('should handle write errors', async () => {
    const mockCurrentContext = {
      objective: 'test objective',
      tasks: ['task1', 'task2'],
    };

    const mockError = new Error('Permission denied');
    vi.mocked(mockReadTool.execute).mockResolvedValue({
      llmContent: mockCurrentContext,
    });

    vi.mocked(mockWriteTool.execute).mockResolvedValue({
      llmContent: mockError,
    });

    const result = await tool.execute(
      { sessionId: 'test-session', updates: {} },
      new AbortController().signal,
    );

    expect(result.llmContent).toContain('Error updating task context');
    expect(result.returnDisplay).toContain('Failed to update task context');
  });

  // Uncomment this test if schema validation is enabled in the future
  // it('should handle schema validation errors', async () => {
  //   const mockCurrentContext = {
  //     objective: 'test objective',
  //     tasks: ['task1', 'task2'],
  //   };

  //   const mockUpdates = {
  //     objective: 123, // Invalid type
  //   };

  //   vi.mocked(mockReadTool.execute).mockResolvedValue({
  //     llmContent: mockCurrentContext,
  //   });

  //   const result = await tool.execute(
  //     { sessionId: 'test-session', updates: mockUpdates },
  //     new AbortController().signal,
  //   );

  //   expect(result.llmContent).toContain('Validation failed');
  //   expect(result.returnDisplay).toContain('Invalid updates');
  // });
});