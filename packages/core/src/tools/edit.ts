/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";
import { ToolName } from "./enum.js";
import { createPatch } from "diff";
import { makeRelative, shortenPath } from "../utils/paths.js";
import { isNodeError } from "../utils/errors.js";
import { isWithinRoot } from "../utils/file.js";
import { DEFAULT_DIFF_OPTIONS } from "../types/diff.js";

// Define the parameters schema for the Edit tool
const EditToolParamsSchema = z.object({
  file_path: z.string().describe("The absolute path to the file to modify. Must start with '/'."),
  old_string: z.string().describe(
    "The exact literal text to replace, preferably unescaped. For single replacements (default), include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. For multiple replacements, specify expected_replacements parameter. If this string is not the exact literal text (i.e. you escaped it) or does not match exactly, the tool will fail."
  ),
  new_string: z.string().describe(
    "The exact literal text to replace `old_string` with, preferably unescaped. Provide the EXACT text. Ensure the resulting code is correct and idiomatic."
  ),
  expected_replacements: z.number().optional().describe(
    "Number of replacements expected. Defaults to 1 if not specified. Use when you want to replace multiple occurrences."
  ),
});

export const EditToolResultSchema = z.object({
  llmContent: z.string(),
  returnDisplay: z.union([
    z.string(),
    z.object({
      fileDiff: z.string(),
      fileName: z.string(),
    }),
  ]),
});

// Define the configuration interface
interface EditToolConfig {
  targetDir: string;
}

// Define the tool description
const DESC = `
Replaces text within a file. By default, replaces a single occurrence, but can replace multiple occurrences when \`expected_replacements\` is specified. This tool requires providing significant context around the change to ensure precise targeting. Always use the read_file tool to examine the file's current content before attempting a text replacement.

The user has the ability to modify the \`new_string\` content. If modified, this will be stated in the response.

Expectation for required parameters:
1. \`file_path\` MUST be an absolute path; otherwise an error will be thrown.
2. \`old_string\` MUST be the exact literal text to replace (including all whitespace, indentation, newlines, and surrounding code etc.).
3. \`new_string\` MUST be the exact literal text to replace \`old_string\` with (also including all whitespace, indentation, newlines, and surrounding code etc.). Ensure the resulting code is correct and idiomatic.
4. NEVER escape \`old_string\` or \`new_string\`, that would break the exact literal text requirement.

**Important:** If ANY of the above are not satisfied, the tool will fail. CRITICAL for \`old_string\`: Must uniquely identify the single instance to change. Include at least 3 lines of context BEFORE and AFTER the target text, matching whitespace and indentation precisely. If this string matches multiple locations, or does not match exactly, the tool will fail.

**Multiple replacements:** Set \`expected_replacements\` to the number of occurrences you want to replace. The tool will replace ALL occurrences that match \`old_string\` exactly. Ensure the number of replacements matches your expectation.`;

// Helper function to check if a file exists (simplified version)
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function to normalize line endings
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

// Main tool implementation
export const EditTool = ({ targetDir }: EditToolConfig) =>
  tool(
    async (params: z.infer<typeof EditToolParamsSchema>) => {
      try {
        // Validate input parameters
        const validatedParams = EditToolParamsSchema.parse(params);

        // Validate file path
        if (!path.isAbsolute(validatedParams.file_path)) {
          return {
            llmContent: `Error: File path must be absolute: ${validatedParams.file_path}`,
            returnDisplay: `Error: File path must be absolute: ${validatedParams.file_path}`,
          };
        }

        if (!isWithinRoot(validatedParams.file_path, targetDir)) {
          return {
            llmContent: `Error: File path must be within the root directory (${targetDir}): ${validatedParams.file_path}`,
            returnDisplay: `Error: File path must be within the root directory (${targetDir}): ${validatedParams.file_path}`,
          };
        }

        // Calculate the edit outcome
        const expectedReplacements = validatedParams.expected_replacements ?? 1;
        let currentContent: string | null = null;
        let fileExistsFlag = false;
        let isNewFile = false;
        let finalNewString = validatedParams.new_string;
        let finalOldString = validatedParams.old_string;
        let occurrences = 0;
        let error: { display: string; raw: string } | undefined = undefined;

        try {
          currentContent = await fs.readFile(validatedParams.file_path, 'utf8');
          // Normalize line endings to LF for consistent processing.
          currentContent = normalizeLineEndings(currentContent);
          fileExistsFlag = true;
        } catch (err: unknown) {
          if (!isNodeError(err) || err.code !== 'ENOENT') {
            // Rethrow unexpected FS errors (permissions, etc.)
            throw err;
          }
          fileExistsFlag = false;
        }

        if (validatedParams.old_string === '' && !fileExistsFlag) {
          // Creating a new file
          isNewFile = true;
        } else if (!fileExistsFlag) {
          // Trying to edit a non-existent file (and old_string is not empty)
          error = {
            display: `File not found. Cannot apply edit. Use an empty old_string to create a new file.`,
            raw: `File not found: ${validatedParams.file_path}`,
          };
        } else if (currentContent !== null) {
          // Editing an existing file
          // Simplified version of ensureCorrectEdit logic
          // In a real implementation, you'd want to properly validate the strings
          // and potentially interact with an LLM for correction

          finalOldString = validatedParams.old_string;
          finalNewString = validatedParams.new_string;
          occurrences = (currentContent.match(new RegExp(finalOldString, 'g')) || []).length;

          if (validatedParams.old_string === '') {
            // Error: Trying to create a file that already exists
            error = {
              display: `Failed to edit. Attempted to create a file that already exists.`,
              raw: `File already exists, cannot create: ${validatedParams.file_path}`,
            };
          } else if (occurrences === 0) {
            error = {
              display: `Failed to edit, could not find the string to replace.`,
              raw: `Failed to edit, 0 occurrences found for old_string in ${validatedParams.file_path}. No edits made. The exact text in old_string was not found. Ensure you're not escaping content incorrectly and check whitespace, indentation, and context. Use read_file tool to verify.`,
            };
          } else if (occurrences !== expectedReplacements) {
            const occurenceTerm =
              expectedReplacements === 1 ? 'occurrence' : 'occurrences';
            error = {
              display: `Failed to edit, expected ${expectedReplacements} ${occurenceTerm} but found ${occurrences}.`,
              raw: `Failed to edit, Expected ${expectedReplacements} ${occurenceTerm} but found ${occurrences} for old_string in file: ${validatedParams.file_path}`,
            };
          }
        } else {
          // Defensive case
          error = {
            display: `Failed to read content of file.`,
            raw: `Failed to read content of existing file: ${validatedParams.file_path}`,
          };
        }

        // Apply the replacement if no error occurred
        let newContent: string;
        if (error) {
          return {
            llmContent: error.raw,
            returnDisplay: `Error: ${error.display}`,
          };
        }

        if (isNewFile) {
          newContent = finalNewString;
        } else {
          // If oldString is empty and it's not a new file, do not modify the content.
          if (finalOldString === '' && !isNewFile) {
            newContent = currentContent!;
          } else {
            newContent = currentContent!.replaceAll(finalOldString, finalNewString);
          }
        }

        // Write the file
        try {
          const dirName = path.dirname(validatedParams.file_path);
          if (!(await fileExists(dirName))) {
            await fs.mkdir(dirName, { recursive: true });
          }
          await fs.writeFile(validatedParams.file_path, newContent, 'utf8');

          // Prepare display result
          let displayResult: z.infer<typeof EditToolResultSchema>["returnDisplay"];
          if (isNewFile) {
            displayResult = `Created ${shortenPath(makeRelative(validatedParams.file_path, targetDir))}`;
          } else {
            // Generate diff for display
            const fileName = path.basename(validatedParams.file_path);
            const fileDiff = createPatch(
              fileName,
              currentContent ?? '',
              newContent,
              'Current',
              'Proposed',
              DEFAULT_DIFF_OPTIONS,
            );
            displayResult = { fileDiff, fileName };
          }

          const llmSuccessMessageParts = [
            isNewFile
              ? `Created new file: ${validatedParams.file_path} with provided content.`
              : `Successfully modified file: ${validatedParams.file_path} (${occurrences} replacements).`,
          ];

          return {
            llmContent: llmSuccessMessageParts.join(' '),
            returnDisplay: displayResult,
          };
        } catch (writeErr) {
          const errorMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
          return {
            llmContent: `Error executing edit: ${errorMsg}`,
            returnDisplay: `Error writing file: ${errorMsg}`,
          };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          llmContent: `Error preparing edit: ${errorMsg}`,
          returnDisplay: `Error preparing edit: ${errorMsg}`,
        };
      }
    },
    {
      name: ToolName.EDIT, // Assuming ToolName.EDIT exists
      description: DESC,
      schema: EditToolParamsSchema,
    }
  );