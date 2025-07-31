/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateAnnotation } from "../types/stateAnnotation.js";

export interface AgentInterface {
  getName(): string;
  getDescription(): string;
  stream(state: typeof StateAnnotation.State): Promise<typeof StateAnnotation.State>;
}
