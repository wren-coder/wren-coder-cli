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
import { processLargeContext } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ReadFileToolConfig {
    workingDir: string,
    llm?: BaseChatModel, // Optional LLM for compression
}

const DESC = "Read text from a file. Input: { path: string }. Returns file contents or an error message. Large files will be automatically compressed.";

/**
 * ReadFileTool
 * Reads the contents of a file at the given path.
 * Automatically compresses large files to stay within context limits.
 */
export const ReadFileTool = ({ workingDir, llm }: ReadFileToolConfig) => tool(
    async ({ path }: { path: string }) => {
        try {
            const data = await fs.readFile(path, "utf-8");
            
            // If we have an LLM, use it to compress large files
            if (llm && data.length > 10000) { // Arbitrary threshold for compression
                const result = await processLargeContext(data, llm);
                return result.content;
            }
            
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
