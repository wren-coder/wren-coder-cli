/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";

interface WriteFileToolConfig {
    workingDir: string,
}

const DESC = "Write text to a file. Input: { path: string; content: string; append?: boolean }. Paths are relative to working directory unless absolute. Overwrites by default, or appends if append=true.";

/**
 * WriteFileTool
 * Writes (or appends) text to a file at the given path.
 * All file operations are scoped to the working directory.
 */
export const WriteFileTool = ({ workingDir }: WriteFileToolConfig) => tool(
    async ({
        path: filePath,
        content,
        append = false,
    }: {
        path: string;
        content: string;
        append?: boolean;
    }) => {
        try {
            // Resolve the path relative to working directory
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(workingDir, filePath);

            // Normalize path and verify it's within working directory
            const resolvedPath = path.normalize(absolutePath);
            if (!resolvedPath.startsWith(path.normalize(workingDir) + path.sep)) {
                return `Error: Path "${filePath}" resolves outside working directory`;
            }

            // Ensure directory exists
            await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

            if (append) {
                await fs.appendFile(resolvedPath, content, "utf-8");
                return `Appended to "${resolvedPath.replace(workingDir, '')}"`;
            } else {
                await fs.writeFile(resolvedPath, content, "utf-8");
                return `Wrote to "${resolvedPath.replace(workingDir, '')}"`;
            }
        } catch (err) {
            return `Error writing file "${filePath}": ${formatError(err)}`;
        }
    },
    {
        name: ToolName.WRITE_FILE,
        description: DESC,
        schema: z.object({
            path: z
                .string()
                .describe("The file path (relative to working directory or absolute)"),
            content: z
                .string()
                .describe("The text content to write into the file"),
            append: z
                .boolean()
                .optional()
                .describe("If true, append to the file instead of overwriting"),
        }),
    }
);