/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShellTool } from './shell.js';
import { SubAgentTool } from './subAgentTool.js';
import { Config } from '../config/config.js';

export function registerTools(config: Config) {
  return [
    new ShellTool(config),
    new SubAgentTool(config),
    // Other tools...
  ];
}