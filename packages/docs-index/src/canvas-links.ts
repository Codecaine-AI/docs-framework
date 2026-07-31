import type { InteractiveCanvasDocument } from "@codecaine-ai/canvas/schema";
import type { SpectreRef } from "@codecaine-ai/docs-model/spectre-ref";

/**
 * Docs-domain canvas sidecar links.
 *
 * The live @codecaine-ai/canvas schema no longer models a `links` field (it
 * was part of the old vendored canvas schema), but docs sidecar JSON written
 * by this system still carries it, and backlinks indexing / doc-move
 * rewriting read and rewrite it. These local types re-declare the persisted
 * shape so docs-index keeps its own contract with the sidecar bytes.
 *
 * NOTE (drift risk): the live canvas validator drops unknown fields when it
 * normalizes a document, so a canvas write that round-trips a sidecar through
 * `validateInteractiveCanvasDocument` (e.g. docs-server's canvas_apply_patch)
 * will strip `links` from the persisted file.
 */
export type CanvasDocLinkStatus = "resolved" | "stale" | "missing" | "unresolved";

export type CanvasDocLink = {
  id: string;
  objectId: string;
  /** Shared reference identity — same record as doc.json `reference` spans. */
  target: SpectreRef;
  status: CanvasDocLinkStatus;
  checkedAt?: string;
};

/** A canvas sidecar document as docs-index reads it: live schema + docs-domain links. */
export type CanvasDocumentWithLinks = InteractiveCanvasDocument & {
  links?: CanvasDocLink[];
};
