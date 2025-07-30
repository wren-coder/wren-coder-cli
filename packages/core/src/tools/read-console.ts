/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import puppeteer from "puppeteer";
import { ToolName } from "./enum.js";

interface ReadConsoleLogToolConfig {
    workingDir: string,
}

const DESC =
    "Launches a headless browser, navigates to the given URL, and returns all console messages emitted during page load as an array of {type, text} objects.";

export const ReadConsoleLogTool = ({ workingDir }: ReadConsoleLogToolConfig) => tool(
    async ({ url }: { url: string }) => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Collect console messages
        const logs: Array<{ type: string; text: string }> = [];
        page.on("console", (msg) => {
            logs.push({
                type: msg.type(),       // e.g. "log", "error", "warning"
                text: msg.text(),       // the console output
            });
        });

        try {
            await page.goto(url, { waitUntil: "networkidle2" });
        } catch (e: any) {
            logs.push({ type: "navigation_error", text: e.message });
        } finally {
            await browser.close();
        }

        if (logs.length === 0) {
            return `No console messages emitted by ${url}.`;
        }
        return logs;
    },
    {
        name: ToolName.READ_CONSOLE_LOG,
        description: DESC,
        schema: z.object({
            url: z.string().url().describe("The fully qualified URL to visit"),
        }),
    }
);
