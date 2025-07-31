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
import { CompressionConfig, processLargeContext } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import path from "path";

interface ReadFileToolConfig {
    workingDir: string,
    llm: BaseChatModel,
    compressionConfig: CompressionConfig
}

const DESC = "Read text from a file. Input: { path: string }. Returns file contents or an error message. Large files will be automatically compressed.";

/**
 * ReadFileTool
 * Reads the contents of a file at the given path.
 * Automatically compresses large files to stay within context limits.
 */
export const ReadFileTool = ({ workingDir, llm, compressionConfig }: ReadFileToolConfig) => tool(
    async ({ path: filePath }: { path: string }) => {
        try {
            const absolutePath = path.isAbsolute(filePath)
                ? filePath
                : path.join(workingDir, filePath);

            if (!absolutePath.startsWith(path.resolve(workingDir))) {
                return `Error: Path "${filePath}" is outside the working directory`;
            }

            const data = await fs.readFile(absolutePath, "utf-8");
            const result = await processLargeContext(data, llm, compressionConfig);
            return result.content;
        } catch (err) {
            return `Error reading file "${filePath}": ${formatError(err)}`;
        }
    },
    {
        name: ToolName.READ_FILE,
        description: DESC,
        schema: z.object({
            path: z
                .string()
                .describe("The filesystem path of the file to read (relative to working directory or absolute)"),
        }),
    }
);