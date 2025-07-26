/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReadTaskContextTool } from './readTaskContext.js';
import { Config } from '../config/config.js';
import { ReadFileTool } from './read-file.js';
import { getErrorMessage } from '../utils/errors.js';

// Mock dependencies
vi.mock('./read-file.js');
vi.mock('../config/config.js');

const mockConfig = {
  getTargetDir: vi.fn().mockReturnValue('/mock/target/dir'),
} as unknown as Config;

const mockReadFileTool = {
  execute: vi.fn(),
} as unknown as ReadFileTool;

// Mock the ReadFileTool constructor to return our mock instance
vi.mocked(ReadFileTool).mockReturnValue(mockReadFileTool);

describe('ReadTaskContextTool', () => {
  let tool: ReadTaskContextTool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new ReadTaskContextTool(mockConfig);
  });

  it('should successfully read and parse a valid task context file', async () => {
    const mockContent = {
      objective: 'test objective',
      tasks: ['task1', 'task2'],
    };

    vi.mocked(mockReadFileTool.execute).mockResolvedValue({
      llmContent: JSON.stringify(mockContent),
    });

    const result = await tool.execute({ sessionId: 'test-session' }, new AbortController().signal);

    expect(result.llmContent).toEqual(mockContent);
    expect(result.returnDisplay).toBe('Task context loaded successfully.');
    expect(mockReadFileTool.execute).toHaveBeenCalledWith(
      { absolute_path: '/mock/target/dir/.wren/session/test-session/agent-context.json' },
      expect.any(AbortSignal),
    );
  });

  it('should handle invalid JSON content', async () => {
    vi.mocked(mockReadFileTool.execute).mockResolvedValue({
      llmContent: 'invalid-json',
    });

    const result = await tool.execute({ sessionId: 'test-session' }, new AbortController().signal);

    expect(result.llmContent).toContain('Error reading task context');
    expect(result.returnDisplay).toContain('Failed to read task context');
  });

  it('should handle file read errors', async () => {
    const mockError = new Error('File not found');
    vi.mocked(mockReadFileTool.execute).mockResolvedValue({
      llmContent: mockError,
    });

    const result = await tool.execute({ sessionId: 'test-session' }, new AbortController().signal);

    expect(result.llmContent).toContain(getErrorMessage(mockError));
    expect(result.returnDisplay).toContain(getErrorMessage(mockError));
  });

  // Uncomment this test if schema validation is enabled in the future
  // it('should handle schema validation errors', async () => {
  //   const mockContent = { invalid: 'data' };
  //   vi.mocked(mockReadFileTool.execute).mockResolvedValue({
  //     llmContent: JSON.stringify(mockContent),
  //   });

  //   const result = await tool.execute({ sessionId: 'test-session' }, new AbortController().signal);

  //   expect(result.llmContent).toContain('Task context validation failed');
  //   expect(result.returnDisplay).toContain('Invalid task context');
  // });
});