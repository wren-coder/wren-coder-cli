/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * A StructuredTool that runs a bash command and returns stdout (or stderr on error).
 */
export const ShellTool = tool(
    async ({ command }: { command: string }) => {
        try {
            const { stdout, stderr } = await execAsync(command, { shell: "/bin/bash" });
            if (stderr) {
                // Some commands write warnings to stderr but still succeed; you can adjust this as needed.
                return `STDERR: ${stderr}\nSTDOUT: ${stdout}`;
            }
            return stdout;
        } catch (err: any) {
            return `Error executing "${command}": ${err.message || err}`;
        }
    },
    {
        name: "shell",
        description:
            "Execute a Bash command on the host machine. Input must be a single string containing the full command (e.g. 'ls -la /tmp'). Returns the command’s stdout or stderr.",
        schema: z.object({
            command: z.string().describe("The full bash command to execute"),
        }),
    }
);
