/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import puppeteer from "puppeteer";
import { ToolName } from "./enum.js";
import { formatError } from "../utils/format-error.js";

interface ScreenshotToolConfig {
    workingDir: string,
}

const DESC =
    "Launches a headless browser, navigates to the given URL, and returns a full-page screenshot as a Base64-encoded PNG.";

export const ScreenshotTool = ({ workingDir }: ScreenshotToolConfig) => tool(
    async ({ url }: { url: string }) => {
        try {
            // Launch headless Chromium
            const browser = await puppeteer.launch();
            const page = await browser.newPage();

            // Navigate and wait for network to be idle
            await page.goto(url, { waitUntil: "networkidle2" });

            // Capture full-page screenshot
            const buffer = await page.screenshot({ fullPage: true });

            await browser.close();

            // Return Base64 string (data URI prefix optional)
            return buffer.toString();
        } catch (err) {
            return `Error taking screenshot of '${url}': ${formatError(err)}`;
        }
    },
    {
        name: ToolName.SCREENSHOT,
        description: DESC,
        schema: z.object({
            url: z
                .string()
                .url()
                .describe("The fully qualified URL of the page to screenshot"),
        }),
    }
);
