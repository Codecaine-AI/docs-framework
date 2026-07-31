/**
 * bun test preload — de-duplicates React across the @codecaine-ai/canvas
 * git-submodule boundary and the @codecaine-ai/annotations `link:` boundary.
 *
 * external/canvas is a git submodule and annotations is a bun-linked sibling
 * repo; each may carry its own node_modules (installed by its own bun.lock),
 * so their sources can resolve react/react-dom to a second copy while this
 * repo's tests render with the root copy. Two React instances share no
 * dispatcher, so any test that mounts one of their components would die with
 * "Invalid hook call" — and the aborted renders leak broken state into later
 * test files in the same `bun test` process.
 *
 * mock.module() accepts resolved absolute paths, so point every React-family
 * module reachable from those packages at the root instances. No-op when a
 * package's node_modules is absent (resolution already unifies).
 *
 * Adapted from Spectre apps/frontend/src/test/real-modules.ts.
 */
import { mock } from "bun:test";
import * as RootReact from "react";
import * as RootJsxRuntime from "react/jsx-runtime";
import * as RootJsxDevRuntime from "react/jsx-dev-runtime";
import * as RootReactDom from "react-dom";
import * as RootReactDomClient from "react-dom/client";

{
	const reactFamily: Array<[string, object]> = [
		["react", RootReact],
		["react/jsx-runtime", RootJsxRuntime],
		["react/jsx-dev-runtime", RootJsxDevRuntime],
		["react-dom", RootReactDom],
		["react-dom/client", RootReactDomClient],
	];
	// `link:` deps only materialize inside the consuming workspace package's
	// node_modules, so root-relative resolution can miss them — try the
	// consuming workspaces too.
	const resolveFroms = [
		import.meta.dir,
		`${import.meta.dir}/packages/docs-viewer`,
		`${import.meta.dir}/packages/docs-model`,
	];
	for (const pkg of ["@codecaine-ai/canvas", "@codecaine-ai/annotations"]) {
		try {
			let pkgEntry: string | null = null;
			for (const from of resolveFroms) {
				try {
					pkgEntry = Bun.resolveSync(pkg, from);
					break;
				} catch {
					// Not resolvable from this dir — try the next.
				}
			}
			if (!pkgEntry) continue;
			const pkgDir = pkgEntry.slice(0, pkgEntry.lastIndexOf("/"));
			for (const [spec, rootNamespace] of reactFamily) {
				try {
					const pkgPath = Bun.resolveSync(spec, pkgDir);
					const rootPath = Bun.resolveSync(spec, import.meta.dir);
					if (pkgPath !== rootPath) {
						const copy = { ...rootNamespace };
						mock.module(pkgPath, () => copy);
					}
				} catch {
					// Spec not resolvable from this package — nothing to unify.
				}
			}
		} catch {
			// Package not installed — nothing to unify.
		}
	}
}
