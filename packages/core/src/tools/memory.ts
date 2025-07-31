/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { promises as fs } from "fs";
import { dirname, join } from "path";
import { homedir } from "os";

const CONFIG_DIR = ".wren";
const GLOBAL_MEMORY_FILE = "MEMORY.md";
const MEMORY_SECTION_HEADER = "## Added Memories";

interface MemoryToolConfig {
    workingDir: string,
}

/** Where to store the global memory file. */
function getGlobalMemoryFilePath(): string {
    return join(homedir(), CONFIG_DIR, GLOBAL_MEMORY_FILE);
}

/** Ensure there’s a blank line before appending a new item. */
function ensureNewlineSeparation(content: string): string {
    if (content.length === 0) return "";
    if (content.endsWith("\n\n")) return "";
    if (content.endsWith("\n")) return "\n";
    return "\n\n";
}

/** Safely stringify unknown errors. */
function formatError(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try { return JSON.stringify(err); }
    catch { return String(err); }
}

/**
 * save_memory
 * Saves a short fact to long‑term memory, under ~/.wren/MEMORY.md.
 */
export const SaveMemoryTool = () => tool(
    async ({ fact }: { fact: string }) => {
        const memoryFile = getGlobalMemoryFilePath();
        const entry = `- ${fact.trim().replace(/^(-+\s*)+/, "").trim()}`;

        if (!fact || fact.trim() === "") {
            return `Error: "fact" must be a non-empty string.`;
        }

        try {
            // ensure directory
            await fs.mkdir(dirname(memoryFile), { recursive: true });

            // read existing content (if any)
            let content = "";
            try {
                content = await fs.readFile(memoryFile, "utf-8");
            } catch {
                // missing file is fine
            }

            const idx = content.indexOf(MEMORY_SECTION_HEADER);
            if (idx === -1) {
                // no header yet
                const sep = ensureNewlineSeparation(content);
                content += `${sep}${MEMORY_SECTION_HEADER}\n${entry}\n`;
            } else {
                // insert under existing header
                const before = content.slice(0, idx + MEMORY_SECTION_HEADER.length);
                const after = content.slice(idx + MEMORY_SECTION_HEADER.length);
                const sep = ensureNewlineSeparation(after);
                content = `${before}\n${entry}${sep}${after.trimStart()}\n`;
            }

            await fs.writeFile(memoryFile, content, "utf-8");
            return `Okay, I've remembered: "${fact.trim()}"`;
        } catch (err: unknown) {
            const msg = formatError(err);
            return `Error saving memory: ${msg}`;
        }
    },
    {
        name: "save_memory",
        description:
            "Save a clear, concise fact to long‑term memory. Input: { fact: string }.",
        schema: z.object({
            fact: z
                .string()
                .min(1, "Fact must be non-empty")
                .describe(
                    "A short, self-contained statement to remember (e.g. 'My favorite color is blue')"
                ),
        }),
    }
);
