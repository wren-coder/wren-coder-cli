/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { setSimulate429 } from './src/utils/testUtils.js';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/__mocks__/node.js';

// Initialize MSW server for mocking API calls
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Disable 429 simulation globally for all tests
setSimulate429(false);
