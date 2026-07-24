"use client";

import { Type } from "@sinclair/typebox";
import { defineComponentAction } from "../../define";
import { stepsPatch } from "../lib";
import type { ProcessOutlineStep } from "../lib";
import { ProcessOutlineStepSchema } from "../state";

export const setSteps = defineComponentAction({
  action: "process-outline.setSteps",
  blockType: "process-outline",
  description:
    "Bulk replace: swap the entire ordered step tree for the given steps. Parse process-outline notation with parseProcessOutline to build the tree from text.",
  params: Type.Object({
    steps: Type.Array(ProcessOutlineStepSchema, {
      description:
        "Complete replacement step tree; an empty array empties the process outline.",
    }),
  }),
  apply(_block, { steps }) {
    return { ok: true, props: stepsPatch(steps as ProcessOutlineStep[]) };
  },
});
