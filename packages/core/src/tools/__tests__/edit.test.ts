/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { promises as fs } from "fs";
import path from "path";
import { ToolName } from "../enum.js";
import { EditTool } from "../edit.js";
import { isWithinRoot } from "../../utils/file.js";

// Mock fs module
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    promises: {
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    }
  };
});

// Mock path module
vi.mock("path", async () => {
  const actual = await vi.importActual("path");
  return {
    ...actual,
    isAbsolute: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    normalize: vi.fn(),
  };
});

// Mock isWithinRoot utility
vi.mock("../../utils/file.js", () => ({
  isWithinRoot: vi.fn(),
}));

describe("EditTool", () => {
  const mockWorkingDir = "/test/workspace";
  const mockTool = EditTool({ workingDir: mockWorkingDir });
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks for path functions
    vi.mocked(path.isAbsolute).mockImplementation((p) => p.startsWith("/"));
    vi.mocked(path.dirname).mockImplementation((p) => p.split("/").slice(0, -1).join("/"));
    vi.mocked(path.basename).mockImplementation((p) => p.split("/").pop() || "");
    vi.mocked(path.normalize).mockImplementation((p) => p);
    
    // Default mock for isWithinRoot
    vi.mocked(isWithinRoot).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should have correct name and description", () => {
    expect(mockTool.name).toBe(ToolName.EDIT);
    expect(mockTool.description).toContain("Replaces text within a file");
  });

  it("should reject non-absolute file paths", async () => {
    vi.mocked(path.isAbsolute).mockReturnValue(false);
    
    const result = await mockTool.invoke({
      file_path: "relative/path/file.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("Error: File path must be absolute");
  });

  it("should reject paths outside working directory", async () => {
    vi.mocked(isWithinRoot).mockReturnValue(false);
    
    const result = await mockTool.invoke({
      file_path: "/outside/file.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("Error: File path must be within the root directory");
  });

  it("should create a new file when old_string is empty and file doesn't exist", async () => {
    // File doesn't exist
    vi.mocked(fs.access).mockRejectedValue({ code: "ENOENT" });
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/new-file.txt",
      old_string: "",
      new_string: "new content",
    });
    
    expect(result).toContain("Created new file");
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/test/workspace/new-file.txt",
      "new content",
      "utf8"
    );
  });

  it("should fail to create a file that already exists", async () => {
    // File exists
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue("existing content");
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/existing-file.txt",
      old_string: "",
      new_string: "new content",
    });
    
    expect(result).toContain("Failed to edit. Attempted to create a file that already exists");
  });

  it("should fail when trying to edit a non-existent file", async () => {
    // File doesn't exist
    vi.mocked(fs.access).mockRejectedValue({ code: "ENOENT" });
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/non-existent.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("File not found. Cannot apply edit");
  });

  it("should successfully replace text in an existing file", async () => {
    const fileContent = "line 1\nline 2\nold content\nline 4\nline 5";
    
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("Successfully modified file");
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/test/workspace/test-file.txt",
      "line 1\nline 2\nnew content\nline 4\nline 5",
      "utf8"
    );
  });

  it("should fail when old_string is not found in the file", async () => {
    const fileContent = "line 1\nline 2\nline 3\nline 4\nline 5";
    
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "non-existent content",
      new_string: "new content",
    });
    
    expect(result).toContain("Failed to edit, could not find the string to replace");
  });

  it("should handle multiple replacements when expected_replacements is set", async () => {
    const fileContent = "old content\nline 2\nold content\nline 4\nold content";
    
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "old content",
      new_string: "new content",
      expected_replacements: 3,
    });
    
    expect(result).toContain("Successfully modified file");
    expect(result).toContain("(3 replacements)");
    expect(fs.writeFile).toHaveBeenCalledWith(
      "/test/workspace/test-file.txt",
      "new content\nline 2\nnew content\nline 4\nnew content",
      "utf8"
    );
  });

  it("should fail when number of occurrences doesn't match expected_replacements", async () => {
    const fileContent = "old content\nline 2\nold content\nline 4\nline 5";
    
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "old content",
      new_string: "new content",
      expected_replacements: 3,
    });
    
    expect(result).toContain("Failed to edit, expected 3 occurrences but found 2");
  });

  it("should create directory structure if it doesn't exist", async () => {
    vi.mocked(fs.access)
      .mockRejectedValueOnce({ code: "ENOENT" }) // File doesn't exist
      .mockRejectedValueOnce({ code: "ENOENT" }); // Directory doesn't exist
    
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/new/dir/file.txt",
      old_string: "",
      new_string: "content",
    });
    
    expect(fs.mkdir).toHaveBeenCalledWith("/test/workspace/new/dir", { recursive: true });
    expect(result).toContain("Created new file");
  });

  it("should handle file read errors", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockRejectedValue(new Error("Permission denied"));
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("Error preparing edit");
  });

  it("should handle file write errors", async () => {
    const fileContent = "old content";
    
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.readFile).mockResolvedValue(fileContent);
    vi.mocked(fs.writeFile).mockRejectedValue(new Error("Disk full"));
    
    const result = await mockTool.invoke({
      file_path: "/test/workspace/test-file.txt",
      old_string: "old content",
      new_string: "new content",
    });
    
    expect(result).toContain("Error executing edit");
  });
});