/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { glob } from "glob";
import path from "path";
import fs from "fs/promises";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";

interface GlobToolConfig {
    workingDir: string,
}

const DESC =
    "Searches for files matching a glob pattern in the user's workspace directory, returning absolute paths sorted by modification time (newest first). Input: { pattern: string }. Returns an array of matching file paths or an error message.";

export const GlobTool = ({ workingDir }: GlobToolConfig) => tool(
    async ({ pattern }: { pattern: string }) => {
        try {
            const fullPattern = path
                .join(workingDir, pattern)
                .split(path.sep)
                .join("/");

            console.log(
                `[GlobTool] Searching for files matching pattern: ${fullPattern} within ${workingDir}`
            );

            // Perform the glob search (returns POSIX relative paths)
            const relativeMatches: string[] = await glob(fullPattern, {
                cwd: workingDir,
                absolute: false,
                posix: true,
            });

            if (relativeMatches.length === 0) {
                return `No files found matching pattern '${pattern}' in ${workingDir}.`;
            }

            // Stat each file to get mtime, then sort by recency (last 24h newest first), then alphabetically
            const now = Date.now();
            const oneDayMs = 24 * 60 * 60 * 1000;

            const entries = await Promise.all(
                relativeMatches.map(async (rel) => {
                    const abs = path.resolve(workingDir, rel);
                    let mtime = 0;
                    try {
                        const st = await fs.stat(abs);
                        mtime = st.mtimeMs;
                    } catch {
                        /* ignore stat errors */
                    }
                    return { path: abs, mtime };
                })
            );

            entries.sort((a, b) => {
                const aRecent = now - a.mtime < oneDayMs;
                const bRecent = now - b.mtime < oneDayMs;
                if (aRecent && bRecent) {
                    return b.mtime - a.mtime;
                } else if (aRecent) {
                    return -1;
                } else if (bRecent) {
                    return 1;
                }
                return a.path.localeCompare(b.path);
            });

            const sortedPaths = entries.map((e) => e.path);
            return sortedPaths;
        } catch (err) {
            return `Error searching files for pattern '${pattern}': ${formatError(
                err
            )}`;
        }
    },
    {
        name: ToolName.GLOB,
        description: DESC,
        schema: z.object({
            pattern: z
                .string()
                .describe(
                    "The glob pattern to search for files (e.g., '**/*.js', 'src/**/*.ts')"
                ),
        }),
    }
);
