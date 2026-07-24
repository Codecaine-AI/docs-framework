"use client";

import { Type } from "@sinclair/typebox";
import type { DocBlock, DocValidationIssue } from "../../doc-schema";
import type { BlockStateDefinition } from "../types";
import { readStepTree, stepNodes } from "./lib";
import type { ProcessOutlineNode, ProcessOutlineStep } from "./lib";

export const ProcessOutlineStepSchema = Type.Recursive(
  (This) =>
    Type.Object(
      {
        text: Type.String(),
        kind: Type.Optional(
          Type.Union([Type.Literal("step"), Type.Literal("note")]),
        ),
        steps: Type.Optional(Type.Array(This)),
      },
      { additionalProperties: false },
    ),
  { $id: "ProcessOutlineStep" },
);

/** The block is the ordered step forest; an empty array is a legal empty outline. */
export const ProcessOutlineState = Type.Object(
  {
    steps: Type.Array(ProcessOutlineStepSchema),
  },
  { additionalProperties: false },
);

/** Notes are leaves — a `kind: "note"` step must not carry child steps. */
function checkNoteLeaves(
  steps: readonly ProcessOutlineStep[],
  basePath: string,
  issues: DocValidationIssue[],
): void {
  steps.forEach((step, index) => {
    if (step.kind === "note" && step.steps && step.steps.length > 0) {
      issues.push({
        path: `${basePath}[${index}].steps`,
        message: `Note step "${step.text}" has child steps — notes are leaves.`,
      });
    }
    if (step.steps) checkNoteLeaves(step.steps, `${basePath}[${index}].steps`, issues);
  });
}

export const processOutlineState: BlockStateDefinition = {
  schema: ProcessOutlineState,
  carriesText: false,
  check(props, basePath) {
    const issues: DocValidationIssue[] = [];
    checkNoteLeaves((props.steps ?? []) as ProcessOutlineStep[], `${basePath}.steps`, issues);
    return issues;
  },
};

/** Step tree for actions/serialization. Tolerant, always fresh objects. */
export function readProcessOutlineStepTree(block: DocBlock): ProcessOutlineStep[] {
  return readStepTree(block.props.steps);
}

/** Derived-node view of the same tree, with computed depths. */
export function readProcessOutlineSteps(block: DocBlock): ProcessOutlineNode[] {
  return stepNodes(readProcessOutlineStepTree(block));
}
