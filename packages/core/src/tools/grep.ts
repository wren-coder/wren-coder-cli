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

interface GrepToolConfig {
    workingDir: string;
}

const MAX_FILE_SIZE = 1024 * 1024;

const DESC = `Search for a regex in files. Input: { pattern: string; files: string[] }. 
Paths are relative to working directory unless absolute. Returns map of path→matches or error.`;

export const GrepTool = ({ workingDir }: GrepToolConfig) => tool(
    async ({ pattern, files }: { pattern: string; files: string[] }) => {
        try {
            // Validate regex pattern first
            const rx = new RegExp(pattern, "g");
            const results: Record<string, string[]> = {};

            await Promise.all(
                files.map(async (filePath) => {
                    try {
                        // Resolve and validate path
                        const absolutePath = path.isAbsolute(filePath)
                            ? filePath
                            : path.join(workingDir, filePath);

                        const normalizedPath = path.normalize(absolutePath);
                        if (!normalizedPath.startsWith(path.normalize(workingDir) + path.sep)) {
                            results[filePath] = [`Error: Path is outside working directory`];
                            return;
                        }

                        // Check file size before reading
                        const stats = await fs.stat(normalizedPath);
                        if (stats.size > MAX_FILE_SIZE) {
                            results[filePath] = [`Error: File too large (${stats.size} > ${MAX_FILE_SIZE} bytes)`];
                            return;
                        }

                        const content = await fs.readFile(normalizedPath, "utf-8");
                        const matches = [...content.matchAll(rx)].map((m) => m[0]);
                        if (matches.length) {
                            // Return relative paths in results
                            const displayPath = path.relative(workingDir, normalizedPath);
                            results[displayPath] = matches;
                        }
                    } catch (err) {
                        results[filePath] = [`Error: ${formatError(err)}`];
                    }
                })
            );

            return Object.keys(results).length ? results : "No matches found";
        } catch (err) {
            return `Error grepping "${pattern}": ${formatError(err)}`;
        }
    },
    {
        name: ToolName.GREP,
        description: DESC,
        schema: z.object({
            pattern: z
                .string()
                .describe("The RegExp pattern to search for (no delimiters)"),
            files: z
                .array(z.string())
                .describe("Array of file paths to search in (relative to working directory or absolute)"),
        }),
    }
);