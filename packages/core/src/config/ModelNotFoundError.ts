/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const MODEL_NOT_FOUND_ERROR = 'ModelNotFoundError';
const MODEL_NOT_FOUND_ERROR_MESSAGE = (modelName: string) =>
  `Model ${modelName} not found.`;

export class ModelNotFoundError extends Error {
  constructor(modelName: string) {
    super(MODEL_NOT_FOUND_ERROR_MESSAGE(modelName));
    this.name = MODEL_NOT_FOUND_ERROR;
  }
}
