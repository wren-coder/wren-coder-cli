/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";

const DESC = "Read text from a file. Input: { path: string }. Returns file contents or an error message.";

/**
 * ReadFileTool
 * Reads the contents of a file at the given path.
 */
export const ReadFileTool = tool(
    async ({ path }: { path: string }) => {
        try {
            const data = await fs.readFile(path, "utf-8");
            return data;
        } catch (err) {
            return `Error reading file "${path}":  ${formatError(err)}`;
        }
    },
    {
        name: ToolName.READ_FILE,
        description: DESC,
        schema: z.object({
            path: z
                .string()
                .describe("The filesystem path of the file to read"),
        }),
    }
);
