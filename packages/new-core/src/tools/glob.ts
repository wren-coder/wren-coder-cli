/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { glob } from "glob";
import path from "path";
import os from "os";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";

const DESC =
    "Searches for files matching a glob pattern in the user's workspace directory. Input: { pattern: string }. Returns an array of matching file paths or an error message.";

export const GlobTool = tool(
    async ({ pattern }: { pattern: string }) => {
        try {
            // Resolve the base workspace directory
            const workspaceDir = path.join(os.homedir(), "workspace");
            // Build the full glob pattern scoped to ~/workspace
            const fullPattern = path
                .join(workspaceDir, pattern)
                .split(path.sep)
                .join("/");

            console.log(
                `[GlobTool] Searching for files matching pattern: ${fullPattern} within ${workspaceDir}`
            );

            // Perform the glob search (returns relative paths by default)
            const matches: string[] = await glob(fullPattern, {
                cwd: workspaceDir,
                absolute: false,
                posix: true,
            });

            if (matches.length === 0) {
                return `No files found matching pattern '${pattern}' in ${workspaceDir}.`;
            }

            return matches;
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
