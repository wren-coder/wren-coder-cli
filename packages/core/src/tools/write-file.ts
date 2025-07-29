/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import { dirname } from "path";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";

interface WriteFileToolConfig {
    workingDir: string,
}

const DESC = "Write text to a file. Input: { path: string; content: string; append?: boolean }. Overwrites by default, or appends if append=true.";

/**
 * WriteFileTool
 * Writes (or appends) text to a file at the given path.
 */
export const WriteFileTool = ({ workingDir }: WriteFileToolConfig) => tool(
    async ({
        path,
        content,
        append = false,
    }: {
        path: string;
        content: string;
        append?: boolean;
    }) => {
        try {
            // ensure directory exists
            await fs.mkdir(dirname(path), { recursive: true });
            if (append) {
                await fs.appendFile(path, content, "utf-8");
                return `Appended to "${path}".`;
            } else {
                await fs.writeFile(path, content, "utf-8");
                return `Wrote to "${path}".`;
            }
        } catch (err) {
            return `Error writing file "${path}":  ${formatError(err)}`;
        }
    },
    {
        name: ToolName.WRITE_FILE,
        description: DESC,
        schema: z.object({
            path: z
                .string()
                .describe("The filesystem path of the file to write"),
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
