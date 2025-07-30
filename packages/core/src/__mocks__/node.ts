/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

// Setup the server with our mock handlers
export const server = setupServer(...handlers);