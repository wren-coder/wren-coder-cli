/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";
import { processLargeContext } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ShellToolConfig {
    workingDir: string,
    llm: BaseChatModel, // Optional LLM for compression
}

const execAsync = promisify(exec);

const DESC = "Execute a Bash command on the host machine. Input must be a single string containing the full command (e.g. 'ls -la /tmp'). Returns the command's stdout or stderr.";

/**
 * A StructuredTool that runs a bash command and returns stdout (or stderr on error).
 * Automatically compresses large outputs to stay within context limits.
 */
export const ShellTool = ({ workingDir, llm }: ShellToolConfig) => tool(
    async ({ command }: { command: string }) => {
        try {
            const { stdout, stderr } = await execAsync(command, { shell: "/bin/bash" });
            let output = stdout;

            if (stderr) {
                // Some commands write warnings to stderr but still succeed; you can adjust this as needed.
                output = `STDERR: ${stderr}
STDOUT: ${stdout}`;
            }

            const result = await processLargeContext(output, llm);
            return result.content;


            return output;
        } catch (err) {
            return `Error executing "${command}":  ${formatError(err)}`;
        }
    },
    {
        name: ToolName.RUN_SHELL,
        description: DESC,
        schema: z.object({
            command: z.string().describe("The full bash command to execute"),
        }),
    }
);
