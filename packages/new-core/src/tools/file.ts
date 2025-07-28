/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import { dirname } from "path";

/**
 * ReadFileTool
 * Reads the contents of a file at the given path.
 */
export const ReadFileTool = tool(
    async ({ path }: { path: string }) => {
        try {
            const data = await fs.readFile(path, "utf-8");
            return data;
        } catch (err: any) {
            return `Error reading file "${path}": ${err.message || err}`;
        }
    },
    {
        name: "read_file",
        description: "Read text from a file. Input: { path: string }. Returns file contents or an error message.",
        schema: z.object({
            path: z
                .string()
                .describe("The filesystem path of the file to read"),
        }),
    }
);


/**
 * WriteFileTool
 * Writes (or appends) text to a file at the given path.
 */
export const WriteFileTool = tool(
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
        } catch (err: any) {
            return `Error writing file "${path}": ${err.message || err}`;
        }
    },
    {
        name: "write_file",
        description:
            "Write text to a file. Input: { path: string; content: string; append?: boolean }. Overwrites by default, or appends if append=true.",
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
