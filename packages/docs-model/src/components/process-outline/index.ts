"use client";

import type { ComponentBundle } from "../types";
import { insertStep } from "./actions/insert-step";
import { moveStep } from "./actions/move-step";
import { removeStep } from "./actions/remove-step";
import { setSteps } from "./actions/set-steps";
import { setStepText } from "./actions/set-step-text";
import { processOutlineAgentView } from "./agent-view";
import { manifest } from "./manifest";
import { processOutlineState } from "./state";

export const processOutlineComponent: ComponentBundle = {
  manifest,
  states: {
    "process-outline": processOutlineState,
  },
  actions: [setSteps, insertStep, setStepText, removeStep, moveStep],
  agentView: processOutlineAgentView,
};

export { insertStep } from "./actions/insert-step";
export { moveStep } from "./actions/move-step";
export { removeStep } from "./actions/remove-step";
export { setSteps } from "./actions/set-steps";
export { setStepText } from "./actions/set-step-text";
export { processOutlineAgentView } from "./agent-view";
export { manifest } from "./manifest";
export * from "./lib";
export * from "./state";
