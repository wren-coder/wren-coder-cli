/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import puppeteer, { Browser, ConsoleMessage, Page } from "puppeteer";
import { ToolName } from "./enum.js";
import path from "path";

interface ConsoleLogEntry {
    type: string;
    text: string;
}

interface ReadConsoleLogToolConfig {
    workingDir: string;
    timeout?: number; // Navigation timeout in milliseconds
    headless?: boolean; // Whether to run in headless mode
}

const DESC =
    "Launches a headless browser, navigates to the given URL, and returns all console messages emitted during page load as an array of {type, text} objects.";

export const ReadConsoleLogTool = ({
    workingDir,
    timeout = 30000,
    headless = true
}: ReadConsoleLogToolConfig) => tool(
    async ({ url }: { url: string }): Promise<ConsoleLogEntry[] | string> => {
        let browser: Browser | null = null;
        try {
            browser = await puppeteer.launch({
                headless,
                userDataDir: path.join(workingDir, 'puppeteer_data')
            });
            const page: Page = await browser.newPage();

            // Collect console messages
            const logs: ConsoleLogEntry[] = [];
            const onConsole = (msg: ConsoleMessage) => {
                logs.push({
                    type: msg.type(),
                    text: msg.text(),
                });
            };
            page.on("console", onConsole);

            try {
                await page.goto(url, {
                    waitUntil: "networkidle2",
                    timeout
                });
            } catch (e: unknown) {
                const error = e as Error;
                logs.push({
                    type: "navigation_error",
                    text: error.message
                });
            } finally {
                page.off("console", onConsole);
                if (browser) {
                    await browser.close();
                }
            }

            return logs.length > 0 ? logs : `No console messages emitted by ${url}.`;
        } catch (e: unknown) {
            const error = e as Error;
            return `Error capturing console logs: ${error.message}`;
        }
    },
    {
        name: ToolName.READ_CONSOLE_LOG,
        description: DESC,
        schema: z.object({
            url: z.string().url().describe("The fully qualified URL to visit"),
        }),
    }
);