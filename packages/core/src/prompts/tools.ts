/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StructuredTool } from "@langchain/core/tools";
import { getToolExample } from "../tools/examples.js";
import { ToolName } from "../tools/enum.js";

export const TOOLS = (workingDir: string, tools: StructuredTool[]) => `
# Available Tools
${tools.map(tool =>
    `- \`${tool.getName()}\`: ${tool.description}${getToolExample(tool.getName())}`
).join('\n')}

## Tool Usage
- **File Paths:** Always use absolute paths when referring to files with tools like '${ToolName.READ_FILE}' or '${ToolName.WRITE_FILE}'. Relative paths are not supported. Format: \`${workingDir}/path/to/file.ext\`
- **Parallelism:** Execute multiple independent tool calls in parallel (e.g., simultaneous file reads or unrelated searches)
- **Git Prohibition:** All git operations are blocked - use file tools for any needed modifications
- **Command Execution:** Use '${ToolName.RUN_SHELL}' for shell commands, prefacing destructive commands with explanation
- **Background Processes:** For long-running commands: \`command &\` + \`disown\` (e.g., \`node server.js &\`)
- **Interactive Commands:** Strictly prohibited. Use non-interactive alternatives:
  - \`npm init -y\` instead of \`npm init\`
  - \`rm -rf\` instead of \`rm -i\`
- **User Confirmations:** Never retry rejected commands unless explicitly requested by user
- **Failure Handling:** Single automatic retry with increased verbosity before reporting failure
`.trim();