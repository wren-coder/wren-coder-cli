/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { formatError } from "../utils/format-error.js";
import glob from "fast-glob";
import { ToolName } from "./enum.js";
import path from "path";

interface ListFilesToolConfig {
    workingDir: string,
}

const DESC = "Find filesystem paths matching a glob. Input: { pattern: string }. Returns array of file paths or error.";

/**
 * ListFilesTool
 * Finds files matching a glob pattern.
 */
export const ListFilesTool = ({ workingDir }: ListFilesToolConfig) => tool(
    async ({ pattern }: { pattern: string }) => {
        try {
            const absolutePattern = path.isAbsolute(pattern)
                ? pattern
                : path.join(workingDir, pattern);
            return (await glob(absolutePattern, { cwd: workingDir })).join("\n");
        } catch (err: unknown) {
            return `Error listing files for "${pattern}": ${formatError(err)}`;
        }
    },
    {
        name: ToolName.LIST_FILES,
        description: DESC,
        schema: z.object({
            pattern: z.string().describe("A glob pattern, e.g. 'src/**/*.ts' to match all .ts files"),
        }),
    }
);