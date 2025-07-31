/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { spawn } from "child_process";
import { formatError } from "../utils/format-error.js";
import { ToolName } from "./enum.js";
import { CompressionConfig, processLargeContext } from "../utils/compression.js";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

interface ShellToolConfig {
    workingDir: string,
    llm: BaseChatModel,
    compressionConfig: CompressionConfig;
    timeout?: number; // Timeout in milliseconds (default: 30 seconds)
}

const DESC = `Execute a Bash command on the host machine. Input must be a single string containing the full command (e.g. 'ls -la'). 
Commands are executed in the configured working directory (workingDir). 
Returns the command's stdout or stderr. Large outputs are automatically compressed.`;

/**
 * A StructuredTool that runs a bash command with timeout support.
 */
export const ShellTool = ({ workingDir, llm, compressionConfig, timeout = 30000 }: ShellToolConfig) => tool(
    async ({ command }: { command: string }) => {
        try {
            // Dangerous command check
            const dangerousPatterns = [
                'rm -rf', 'chmod 777', 'dd if=', 'mkfs',
                '> /dev/', '| sudo', '&& sudo', '; sudo'
            ];
            if (dangerousPatterns.some(pattern => command.includes(pattern))) {
                return `Error: Potentially dangerous command blocked.`;
            }

            // Use spawn instead of exec for better timeout control
            return await new Promise<string>((resolve) => {
                const child = spawn(command, {
                    shell: "/bin/bash",
                    cwd: workingDir,
                    stdio: ['ignore', 'pipe', 'pipe']
                });

                // Set timeout
                const timeoutId = setTimeout(() => {
                    child.kill('SIGTERM');
                    resolve(`Error: Command timed out after ${timeout}ms`);
                }, timeout);

                let stdout = '';
                let stderr = '';

                child.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                child.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                child.on('close', async (code) => {
                    clearTimeout(timeoutId);

                    const output = code === 0 ? stdout : `STDERR: ${stderr}\nSTDOUT: ${stdout}`;

                    try {
                        const result = await processLargeContext(output, llm, compressionConfig);
                        resolve(result.content);
                    } catch (err) {
                        resolve(`Error processing output: ${formatError(err)}`);
                    }
                });

                child.on('error', (err) => {
                    clearTimeout(timeoutId);
                    resolve(`Error executing command: ${formatError(err)}`);
                });
            });
        } catch (err) {
            return `Error executing "${command}": ${formatError(err)}`;
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