import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { parseProcessOutline } from "@codecaine-ai/docs-model";
import type { DocBlock } from "@codecaine-ai/docs-model/doc-schema";
import type { DocBlockRenderContext } from "../../../render/block-registry";
import { descriptors } from "../descriptor";
import { ProcessOutlineDocsBlock } from "../ProcessOutlineDocsBlock";

const NOTATION = `Run mode
  -> Get epoch-size candidates from the ranked worker system
       -> Exclude locked, cooled-down, or unschedulable work
  -> Drain the epoch with workers
       -> Spawn workers through the kernel until the epoch is drained
       > workers produce tentative evidence; the epoch boundary makes the map authoritative
  -> Finish the epoch
       -> Run the full build`;

/** Derived nodes for direct component renders; the descriptor path reads from blocks. */
const STEPS = parseProcessOutline(NOTATION);

const RENDER_CTX: DocBlockRenderContext = {
  renderText: () => null,
  renderChildren: () => null,
  renderMarkdown: () => null,
};

afterEach(() => {
  cleanup();
});

describe("ProcessOutlineDocsBlock", () => {
  it("renders the step tree as nested step lines", () => {
    render(<ProcessOutlineDocsBlock id="process-outline-1" steps={STEPS} />);

    const section = document.querySelector('[data-docs-block-type="process-outline"]');
    expect(section?.getAttribute("data-source-id")).toBe("process-outline-1");
    expect(document.querySelector('[data-process-outline-depth="0"]')?.textContent).toContain(
      "Run mode",
    );
    expect(document.querySelectorAll('[data-process-outline-node="true"]')).toHaveLength(7);
    expect(document.body.textContent).toContain(
      "Spawn workers through the kernel until the epoch is drained",
    );
  });

  it("renders a lone clarification note as a single-bullet card off the step line", () => {
    render(<ProcessOutlineDocsBlock id="process-outline-note" steps={STEPS} />);

    const note = document.querySelector('[data-process-outline-note="true"]');
    expect(note?.textContent).toBe(
      "workers produce tentative evidence; the epoch boundary makes the map authoritative",
    );
    expect(note?.querySelector("div.docs-process-outline__note-card")).not.toBeNull();
    expect(note?.querySelectorAll('[data-process-outline-note-item="true"]')).toHaveLength(1);
    expect(note?.getAttribute("data-process-outline-node")).toBeNull();
    // No list elements anywhere — host document li styles must never leak in.
    expect(note?.querySelector("ul, ol, li")).toBeNull();
  });

  it("groups consecutive note siblings into one card with a bullet per note", () => {
    const steps = parseProcessOutline(`Refresh
  -> Keep the ranked queue current
       > workers produce tentative evidence
       > the epoch boundary makes the map authoritative again
       -> Save the boundary`);
    render(<ProcessOutlineDocsBlock id="process-outline-note-group" steps={steps} />);

    const notes = document.querySelectorAll('[data-process-outline-note="true"]');
    expect(notes).toHaveLength(1);
    const cards = notes[0].querySelectorAll("div.docs-process-outline__note-card");
    expect(cards).toHaveLength(1);
    const bullets = cards[0].querySelectorAll('div[data-process-outline-note-item="true"]');
    expect(Array.from(bullets).map((bullet) => bullet.textContent)).toEqual([
      "workers produce tentative evidence",
      "the epoch boundary makes the map authoritative again",
    ]);
    // The trailing step after the note run stays a rail node.
    expect(document.body.textContent).toContain("Save the boundary");
    expect(document.querySelectorAll('[data-process-outline-node="true"]')).toHaveLength(3);
  });

  it("renders code chips and loop keywords with the prototype emphasis rules", () => {
    render(
      <ProcessOutlineDocsBlock
        id="process-outline-emphasis"
        steps={parseProcessOutline("Repeat `worker` until the epoch is drained")}
      />,
    );

    expect(document.querySelector('[data-process-outline-code="true"]')?.textContent).toBe("worker");
    expect(
      Array.from(document.querySelectorAll("[data-process-outline-keyword]")).map(
        (node) => node.textContent,
      ),
    ).toEqual(["Repeat", "until"]);
  });

  it("injects the var-driven rail stylesheet once with an opaque rail fallback", () => {
    render(<ProcessOutlineDocsBlock id="process-outline-style-a" steps={STEPS} />);
    render(<ProcessOutlineDocsBlock id="process-outline-style-b" steps={STEPS} />);

    const styles = document.querySelectorAll("#docs-process-outline-style");
    expect(styles).toHaveLength(1);
    const css = styles[0]?.textContent ?? "";

    // All rail geometry derives from the --po-* vars; every knob rides a
    // style-rail token with the prototype defaults as fallback.
    expect(css).toContain("--po-line: var(--docs-process-outline-line-height, 22px)");
    expect(css).toContain("--po-gap: var(--docs-process-outline-row-gap, 7px)");
    expect(css).toContain("--po-indent: var(--docs-process-outline-indent, 36px)");
    expect(css).toContain("--po-arrow-gap: var(--docs-process-outline-arrow-gap, 4px)");
    expect(css).toContain("--po-stroke: var(--docs-process-outline-stroke, 1.5px)");
    expect(css).toContain("--po-arrow: var(--docs-process-outline-arrow-size, 6px)");
    expect(css).toContain("font-size: var(--docs-process-outline-text-size, 12.5px)");
    // Children indent by the full per-level indent; the elbow hangs off it.
    expect(css).toContain("padding-left: var(--po-indent)");
    expect(css).toContain("left: calc(-1 * var(--po-indent))");
    // Elbow lands on the first-line center; trunk overlaps into both gaps.
    expect(css).toContain("height: calc(var(--po-gap) + 2px + var(--po-line) / 2)");
    expect(css).toContain("bottom: calc(-1 * var(--po-gap) - 2px)");
    // The shaft fills the indent and runs through the arrowhead's open
    // middle to just shy of its tip — one drawn arrow, never detached.
    expect(css).toContain("width: calc(var(--po-indent) - 2px)");
    // Arrowhead centers on the first line, anchored to the text column edge;
    // arrow-gap is pure text offset (padding on the step line), so the knob
    // spaces tip-to-text without moving or resizing the drawn arrow.
    expect(css).toContain("top: calc(var(--po-line) / 2 - var(--po-arrow) / 2 - 0.75px)");
    expect(css).toContain("left: calc(-1.2 * var(--po-arrow) - 1px)");
    expect(css).toContain("padding-left: var(--po-arrow-gap)");
    // The trunk never dangles toward a trailing note.
    expect(css).toContain(
      ":not(\n      :has(~ .docs-process-outline__node:not(.docs-process-outline__node--note))\n    )::after",
    );
    // Note-card typography inherits the step text by default: same ink, same
    // size, same line rhythm; the note tokens are pure overrides.
    expect(css).toContain(
      "color: var(--docs-process-outline-note-fg, var(--docs-process-outline-ink, var(--foreground)))",
    );
    expect(css).toContain("font-size: var(--docs-process-outline-note-text-size, inherit)");
    // Border-only card: no background at defaults.
    expect(css).toContain("background: var(--docs-process-outline-note-bg, transparent)");
    // Rail fallback is opaque — alpha stacking at elbow/trunk overlaps reads broken.
    expect(css).toContain("var(--docs-process-outline-rail, #909498)");
    expect(css).not.toContain("--docs-process-outline-rail, color-mix");
  });

  it("replaces a stale injected stylesheet in place (HMR-safe)", () => {
    // Simulate Vite HMR: an old module load left the tag behind with frozen CSS.
    document.getElementById("docs-process-outline-style")?.remove();
    const stale = document.createElement("style");
    stale.id = "docs-process-outline-style";
    stale.textContent = "/* stale css from a previous module load */";
    document.head.appendChild(stale);

    render(<ProcessOutlineDocsBlock id="process-outline-hmr" steps={STEPS} />);

    const styles = document.querySelectorAll("#docs-process-outline-style");
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).not.toContain("stale css");
    expect(styles[0]?.textContent).toContain(".docs-process-outline");
  });

  it("renders a quiet placeholder when there are no steps", () => {
    const { container } = render(<ProcessOutlineDocsBlock id="process-outline-empty" steps={[]} />);

    expect(container.querySelector('[data-process-outline-empty="true"]')?.textContent).toBe(
      "empty process outline — no steps yet",
    );
    expect(container.querySelector('[data-process-outline-flow="true"]')).toBeNull();
  });
});

describe("process-outline descriptor", () => {
  it("renders a structured-steps block through the descriptor path", () => {
    const block: DocBlock = {
      id: "process-outline-steps",
      type: "process-outline",
      props: {
        steps: [
          {
            text: "Run mode",
            steps: [
              {
                text: "Drain the epoch with workers",
                steps: [
                  { text: "Spawn workers through the kernel" },
                  { text: "workers produce tentative evidence", kind: "note" },
                  { text: "the epoch boundary makes the map authoritative", kind: "note" },
                ],
              },
            ],
          },
        ],
      },
      children: [],
    };

    render(<>{descriptors[0].render(block, RENDER_CTX)}</>);

    const wrapper = document.querySelector('[data-block-id="process-outline-steps"]');
    expect(wrapper?.getAttribute("data-doc-block")).toBe("process-outline");
    expect(wrapper?.getAttribute("data-docs-target-type")).toBe("process-outline");
    expect(wrapper?.querySelectorAll('[data-process-outline-node="true"]')).toHaveLength(3);
    // Both notes collapse into one bulleted card.
    expect(wrapper?.querySelectorAll('[data-process-outline-note="true"]')).toHaveLength(1);
    expect(wrapper?.querySelectorAll('[data-process-outline-note-item="true"]')).toHaveLength(2);
  });

  it("renders an empty-steps block through the descriptor path as the placeholder", () => {
    const block: DocBlock = {
      id: "process-outline-empty",
      type: "process-outline",
      props: { steps: [] },
      children: [],
    };

    render(<>{descriptors[0].render(block, RENDER_CTX)}</>);

    const wrapper = document.querySelector('[data-block-id="process-outline-empty"]');
    expect(wrapper?.getAttribute("data-doc-block")).toBe("process-outline");
    expect(wrapper?.querySelector('[data-process-outline-empty="true"]')?.textContent).toBe(
      "empty process outline — no steps yet",
    );
    expect(wrapper?.querySelector('[data-process-outline-flow="true"]')).toBeNull();
  });
});
