"use client";

import type { ComponentBundle } from "../types";
import { serializeProcessOutline } from "./lib";
import { readProcessOutlineSteps } from "./state";

export const processOutlineAgentView: ComponentBundle["agentView"] = (block) => {
  switch (block.type) {
    case "process-outline": {
      // The fence body is process-outline notation serialized from the step tree.
      return "```process-outline\n" + serializeProcessOutline(readProcessOutlineSteps(block)) + "\n```";
    }
    default:
      return null;
  }
};
