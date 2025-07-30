/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi } from "vitest";
import { Provider } from "../types/provider.js";
import { Model } from "../types/model.js";
import { createLlmFromConfig, isAgentSpecificConfig } from "./adapter.js";
import { ProviderNotFoundError } from "../errors/ProviderNotFoundError.js";

// Mock console.warn to avoid noise in test output
vi.spyOn(console, 'warn').mockImplementation(() => { });

describe("adapter", () => {
    describe("isAgentSpecificConfig", () => {
        it("should return true for agent-specific configs", () => {
            const config = {
                agentModels: {
                    coder: {
                        provider: Provider.DEEPSEEK,
                        model: Model.DEEPSEEK_CHAT,
                    },
                    planner: {
                        provider: Provider.DEEPSEEK,
                        model: Model.DEEPSEEK_CHAT,
                    },
                    evaluator: {
                        provider: Provider.DEEPSEEK,
                        model: Model.DEEPSEEK_CHAT,
                    }
                }
            };

            expect(isAgentSpecificConfig(config)).toBe(true);
        });

        it("should return false for default configs", () => {
            const config = {
                defaultModel: {
                    provider: Provider.DEEPSEEK,
                    model: Model.DEEPSEEK_CHAT,
                }
            };

            expect(isAgentSpecificConfig(config)).toBe(false);
        });
    });

    describe("createLlmFromConfig", () => {
        it("should create a DeepSeek model when provider is deepseek", async () => {
            const config = {
                provider: Provider.DEEPSEEK,
                model: Model.DEEPSEEK_CHAT,
                temperature: 0.7,
                topP: 0.9,
            };

            const llm = await createLlmFromConfig(config);
            expect(llm).toBeDefined();
            // Check that it's a DeepSeek model by checking its constructor name
            expect(llm.constructor.name).toContain("ChatDeepSeek");
        });

        it("should throw an error for unknown providers", () => {
            const config = {
                // @ts-expect-error - Testing unknown provider
                provider: "unknown-provider",
                model: Model.DEEPSEEK_CHAT,
                temperature: 0.7,
            };

            expect(() => createLlmFromConfig(config)).toThrowError(ProviderNotFoundError);
        });

        it("should apply temperature and topP parameters", async () => {
            const config = {
                provider: Provider.DEEPSEEK,
                model: Model.DEEPSEEK_CHAT,
                temperature: 0.5,
                topP: 0.8,
            };

            const llm = await createLlmFromConfig(config);
            expect(llm).toBeDefined();
        });

        it("should set default maxRetries when not provided", async () => {
            const config = {
                provider: Provider.DEEPSEEK,
                model: Model.DEEPSEEK_CHAT,
            };

            const llm = await createLlmFromConfig(config);
            expect(llm).toBeDefined();
        });

        it("should use provided maxRetries when specified", async () => {
            const config = {
                provider: Provider.DEEPSEEK,
                model: Model.DEEPSEEK_CHAT,
                maxRetries: 5,
            };

            const llm = await createLlmFromConfig(config);
            expect(llm).toBeDefined();
        });
    });
});