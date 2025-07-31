/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export function getToolExample(name: string) {
    switch (name) {
        case "glob":
            return `[tool_call: glob for pattern 'src/**/*.ts']`;
        case "read_file":
            return `[tool_call: read_file for absolute_path '/path/to/file.txt']`;
        case "write_file":
            return `[tool_call: write_file to create /path/to/file.txt with content 'Hello, World!']`;
        case "list_files":
            return `[tool_call: list_files for pattern '**/*.md']`;
        case "grep":
            return `[tool_call: grep for pattern 'function\\s+\\w+' in files ['src/index.ts']]`;
        case "delete_file":
            return `[tool_call: delete_file for path '/path/to/file.txt']`;
        case "run_shell":
            return `[tool_call: run_shell for 'ls -la']`;
        case "run_tests":
            return `[tool_call: run_tests for 'npm run test']`;
        case "screenshot":
            return `[tool_call: screenshot for url 'https://example.com']`;
        case "read_console_log":
            return `[tool_call: read_console_log for url 'https://example.com']`;
        default:
            return `[tool_call: ${name} for params]`;
    }
}