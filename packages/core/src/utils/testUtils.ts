/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

let simulate429 = false;

export function setSimulate429(value: boolean): void {
  simulate429 = value;
}

export function getSimulate429(): boolean {
  return simulate429;
}