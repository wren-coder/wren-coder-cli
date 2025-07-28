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

const DESC = "Search for a regex in a list of files. Input: { pattern: string; files: string[] }. Returns map of path→matches or error.";

export const GrepTool = tool(
    async ({
        pattern,
        files,
    }: {
        pattern: string;
        files: string[];
    }) => {
        try {
            const rx = new RegExp(pattern, "g");
            const results: Record<string, string[]> = {};
            await Promise.all(
                files.map(async (path) => {
                    const content = await fs.readFile(path, "utf-8");
                    const matches = [...content.matchAll(rx)].map((m) => m[0]);
                    if (matches.length) results[path] = matches;
                })
            );
            return results;
        } catch (err) {
            return `Error grepping "${pattern}":  ${formatError(err)}`;
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
                .describe("Array of file paths to search in"),
        }),
    }
);