/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        default: () => [],
        reducer: (all, one) =>
            Array.isArray(one) ? all.concat(one) : all.concat([one]),
    }),
    original_request: Annotation<string>,
    query: Annotation<boolean>,
    eval: Annotation<boolean>,
});