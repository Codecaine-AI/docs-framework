"use client";

import { SEQUENCE_AGENT_PATCH_OPERATIONS } from "@codecaine-ai/sequence/agent-schema";
import { Type, type TObject } from "@sinclair/typebox";

import type { ComponentAction } from "../../types";

export function liftSequenceOperations(): readonly ComponentAction[] {
  return SEQUENCE_AGENT_PATCH_OPERATIONS.map((descriptor) => ({
    action: `sequence.${descriptor.type}`,
    blockType: "sequence",
    description: descriptor.description,
    // Schema truth stays in the sequence package; Omit only removes the
    // envelope discriminant. The cast bridges the sequence package's exact
    // typebox pin (0.34.49) vs the hoisted workspace copy (^0.34) — same
    // structural TObject, different module identities at type level.
    params: Type.Omit(descriptor.params as unknown as TObject, ["type"]),
    forward: { authority: "sequence" },
  }));
}
