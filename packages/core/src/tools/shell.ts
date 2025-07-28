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

const execAsync = promisify(exec);

const DESC = "Execute a Bash command on the host machine. Input must be a single string containing the full command (e.g. 'ls -la /tmp'). Returns the command’s stdout or stderr.";

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
