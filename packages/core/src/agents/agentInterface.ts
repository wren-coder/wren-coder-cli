/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAnnotation } from "../types/stateAnnotation.js";

export interface AgentInterface {
  getName(): string;
  getDescription(): string;
  invoke(state: typeof StateAnnotation.State): Promise<any>;
  stream?(state: typeof StateAnnotation.State): AsyncGenerator<any, void, unknown>;
}