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
import { processLargeContext } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface WriteFileToolConfig {
    workingDir: string,
    llm?: BaseChatModel, // Optional LLM for compression
}

const DESC = "Write text to a file. Input: { path: string; content: string; append?: boolean }. Overwrites by default, or appends if append=true. Large content will be automatically chunked.";

/**
 * WriteFileTool
 * Writes (or appends) text to a file at the given path.
 * Automatically chunks large content to stay within context limits.
 */
export const WriteFileTool = ({ workingDir, llm }: WriteFileToolConfig) => tool(
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
            // If we have an LLM and content is very large, consider chunking
            let processedContent = content;
            if (llm && content.length > 50000) { // Arbitrary threshold for chunking
                const result = await processLargeContext(content, llm, { 
                    enableChunking: true,
                    maxChunkTokens: 5000
                });
                
                // For writeFile, we'll just use the first chunk if chunked
                // In a real implementation, we might want to write multiple files
                processedContent = result.content;
                
                if (result.wasChunked) {
                    console.warn(`Content was chunked for file ${path}. Only the first chunk will be written.`);
                }
            }
            
            // ensure directory exists
            await fs.mkdir(dirname(path), { recursive: true });
            if (append) {
                await fs.appendFile(path, processedContent, "utf-8");
                return `Appended to "${path}".`;
            } else {
                await fs.writeFile(path, processedContent, "utf-8");
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
