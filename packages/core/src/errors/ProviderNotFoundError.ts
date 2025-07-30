/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Provider } from "../types/provider.js";

export class ProviderNotFoundError extends Error {
    constructor(provider: Provider) {
        super(`Cannot find provider ${provider} to initialize LLM.}`)
    }
}