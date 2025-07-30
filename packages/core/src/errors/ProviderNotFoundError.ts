/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class ProviderNotFoundError extends Error {
    constructor(provider: string) {
        super(`Cannot find provider ${provider} to initialize LLM.`);
        this.name = "ProviderNotFoundError";
    }
}