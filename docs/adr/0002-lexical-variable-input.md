# 0002 — Replace the bespoke contenteditable VariableInput with a Lexical-backed editor

- **Status:** Accepted
- **Date:** 2026-06-08
- **Deciders:** Alexander Forbes-Reed

## Context

`VariableInput` (`packages/ui/src/features/variable-input/`) is the
text input every request editor relies on — URL, headers, path
parameters, body fields, variable-set values, and workflow node
properties all wrap it. It accepts plain text *and* atomic variable
"chips" (built-in values, variable-set items, and extension-provided
variables) interleaved inline. Type `{`, pick a variable from a
fuzzy-searched dropdown, get an inline pill; click the pill, open a
state-modal to tweak its payload; copy + paste between inputs and the
structured chip data survives.

The current implementation is ~440 lines of `VariableInput.tsx` plus
six surrounding utility modules (`dom-state.ts`,
`browser-selection.ts`, `copying.ts`, `pasting.ts`, `sanitation.ts`,
`variable-insertion.ts`, `variables.ts`) sitting on a `contenteditable`
div the renderer manages imperatively via `innerHTML` and hand-rolled
DOM walking. It carries a substantial maintenance tax we have absorbed
for five years:

- Caret behaviour around `contenteditable=false` blobs is
  Chromium-specific — we inject zero-width-space "anchor" spans
  between, after, and inside otherwise-empty regions so the caret has
  somewhere to land (see `renderer.tsx`'s `CARET_ANCHOR`).
- Selection state is reconciled imperatively after every mutation via
  `parseDomState` + `normalizeSelection`, with `queueMicrotask` +
  `requestAnimationFrame` double-flushes to defeat stale node
  references (`VariableInput.tsx:403–408`).
- Clipboard is wired by hand: copy reads `window.getSelection`,
  parses, evaluates variables to runtime values for `text/plain`, and
  re-serialises the original HTML for round-tripping; paste goes
  through `sanitize-html` to strip everything except our own blob
  shape.
- No undo/redo beyond what the browser gives us, no explicit IME
  composition handling, no test coverage.

Editor frameworks have moved on. In 2025/2026 several React-first
libraries model exactly this primitive — an atomic inline widget the
caret hops as a single character, with first-class JSON serialisation
and a custom-MIME clipboard. The two frontrunners for our shape are
**Lexical** (Meta) and **CodeMirror 6**; Hoppscotch's `SmartEnvInput`
is the industry peer's answer in the same domain (it uses CodeMirror
6). See [`../features/variable-input.feature`](../features/variable-input.feature)
for the behavioural contract.

## Decision

Replace the bespoke contenteditable implementation with a
**Lexical-backed** `VariableInput`. Single-PR hard cutover: V2 lands,
the legacy `variable-input/` folder is deleted, V2 is renamed into its
canonical path. No long-lived feature flag.

Five concrete sub-decisions follow, documented in one place because
they are tightly coupled.

### 1. Editor framework — Lexical

Meta-maintained, React-first, monthly releases. `DecoratorNode` mounts
arbitrary React inside the editor flow (`React.createPortal` per
instance) and is treated as an atomic character by the selection model
— backspace deletes the whole node, arrow keys hop it, copy includes
it. `exportJSON` / `importJSON` plus the
`application/x-lexical-editor` clipboard MIME round-trip the chip's
structured `{ type, payload }` between editors without custom paste
plumbing.

Bundle weight: `lexical` + `@lexical/react` lands at ~30–60 kB gzip
in our shipped form, well inside the budget we already pay for Monaco.

Rejected: **CodeMirror 6** is closer to "atomic widget" by API shape
(`Decoration.replace` + `EditorView.atomicRanges` is literally the
spec), is smaller, and is what Hoppscotch chose. But the chip's
interior is heavily React (themed gradients, hover states, the
`useAppSelector`-driven `variable_set_item` name resolution) and CM6
requires we mount React into widget DOM ourselves for every chip;
Lexical does that natively. **TipTap v3 / ProseMirror** — capable,
bigger bundle, recurring selection-inside-NodeView bugs we don't want
to chase. **Plate / Slate / Remirror / BlockNote / Yoopta / Novel** —
block-editor frameworks, wrong shape for a single-line input.

### 2. Chip DOM contract is reused, not re-invented

`VariableChipNode` extends `DecoratorNode<React.ReactElement>`. Its
`createDOM` returns a `<div class="bvs-blob">` with the same
`data-type` / `data-payload` / `data-category` / `data-sensitive` /
`data-missing` / `data-editable` attributes the legacy renderer wrote.
Existing chip CSS (gradient, category tints, hover/active states)
keeps working without a single change. The chip's interior is a
`ChipBody` React component that resolves the display name via
`VariableManager.getVariable` and (for `variable_set_item`)
`useAppSelector(variableSets)` so context-aware names react to
variable-set edits.

### 3. ValueSections stays the canonical wire format

Beak's project files, IPC payloads, and Redux store all speak
`ValueSections = (string | { type, payload })[]`. The new
implementation does **not** change that wire format. Two boundary
helpers in `variable-input/utils/value-sections-conversion.ts`
translate: `$populateFromValueSections` seeds the editor on mount,
`$readValueSections` walks the editor state on change. Mid-edit the
editor's `EditorState` is canonical; we debounce 50 ms before
reporting the next ValueSections upstream (matches legacy's debounce).
External upstream changes within 100 ms of our last write are ignored
(mirror of the legacy `lastUpstreamReport` guard) so the editor
doesn't snap backwards mid-keystroke.

### 4. `{` trigger and chip click reuse existing UI, on a clean callback

`VariableTriggerPlugin` watches editor updates and opens the existing
`VariableSelector` when the caret sits in a `{<query>` run. The query
updates as the user types; Escape, whitespace, or clicking away
closes. On selection, the plugin removes the trigger text and inserts
a `VariableChipNode` at the position.

The state-modal popover (`VariableEditor`) is refactored as part of
the cutover. Its callback signature changes from `(partIndex, type,
payload) => void` — a positional index into `ValueSections` that
forced the legacy renderer to write `data-index` on every chip — to
`(nodeKey, payload) => void`. The variable-input owns chip-click
detection internally (a small `ChipClickPlugin` in V2; the legacy
analogue would have used DOM `data-key` had it survived), translates
the click to the underlying Lexical node's key, and the popover hands
that key back on save. The `ChipDataIndexPlugin` scaffolding from the
side-by-side phase is deleted in the cutover.

The shared `VariableSelector` gains one optional `anchorRect` prop —
a `{ top, left, width, height }` override for the positioning math —
introduced during the side-by-side phase and retained because the new
implementation needs a caret-anchored rect rather than a part-index
lookup.

### 5. Hard cutover, with a vitest + Playwright safety net

The cutover lands in a single PR:

1. Refactor `VariableEditor`'s callback signature to `(nodeKey,
   payload) => void`; update the V2 click plugin to issue the new
   shape.
2. Delete `packages/ui/src/features/variable-input/` (the legacy
   implementation, the `data-index` indirection, the
   `ChipDataIndexPlugin`).
3. Rename `variable-input-v2/` → `variable-input/`.
4. Drop `feature-flag.ts` and the `useVariableInputV2Flag` hook;
   every call site imports the same path as before.
5. Reduce the playground to a single (V2) instance.

The PR is gated by:

- **Every scenario in `variable-input.feature` passes by manual
  exercise in the playground.**
- **A vitest suite** covering ValueSections ↔ Lexical round-trip
  (including the sparse-default `mergeCollectionDefaults` shape),
  clipboard MIME write/read, `{` trigger position math, masking, the
  new `(nodeKey, payload)` save callback, and the "missing variable
  type" render. Target: ≥ 80 % statements over `variable-input/`
  after the rename. The legacy folder has zero tests today, so any
  coverage is strictly a win.
- **A Playwright suite** that drives the playground through the ten
  scenarios already encoded in `VariableInputPlayground` (`empty`,
  `plain`, `single-chip`, `text-chip-text`, `two-chips`,
  `trailing-chip`, `leading-chip`, `long-text`, `masked`,
  `missing-var`) and asserts caret position + copy/paste round-trip
  against the spec.

Rollback is `git revert` on the cutover commit — cheap because the
cutover is a single, contained change.

## Consequences

- ~440 lines of `VariableInput.tsx` + six utility modules disappear.
  The new `VariableInputV2.tsx` is ~290 lines, the chip node is ~215,
  the plugins total ~370, and the conversion helpers are ~80 — net
  surface area is comparable, but the imperative DOM/selection
  management is gone in favour of Lexical's tested primitives.
- `VariableEditor`'s callback contract changes from positional
  `partIndex` to a stable `nodeKey`. The `data-index` indirection that
  forced the legacy renderer to walk the DOM on every render is
  retired entirely.
- Clipboard round-trips through `application/x-lexical-editor` by
  default; we also keep importing the legacy `.bvs-blob` HTML shape
  (via `importDOM`) for one release so anyone who copied from an
  older Beak build can paste cleanly.
- Bundle grows by ~30–60 kB gzip from `lexical` + `@lexical/react`.
  Inside our budget; nothing close to Monaco.
- The renderer's flight code path and the project-file format are
  unchanged. Anything that consumes `ValueSections` —
  `parseValueSections`, `mergeCollectionDefaults`, IPC, the on-disk
  JSON — sees no diff.
- Test surface grows from zero to a real vitest + Playwright suite.
  Future contributors get an executable safety net the legacy
  implementation never had.

### Migration path

One PR, ordered:

1. Land vitest + Playwright suites against the (already-built) V2
   implementation in the playground.
2. Walk every scenario in the spec by hand and check off.
3. Refactor `VariableEditor`'s callback signature; update the V2
   click plugin to match.
4. Delete `variable-input/`, rename `variable-input-v2/` →
   `variable-input/`, remove the feature-flag plumbing and the
   `ChipDataIndexPlugin`.
5. Update call sites only if their import path moved (it shouldn't —
   the rename preserves the canonical path).

## Alternatives considered

The library shortlist is in §1. Architectural alternatives we rejected
at the feature level:

- **Keep contenteditable, refactor the existing modules.**
  Most-of-the-fix; none of the wins. The caret/IME/undo bugs are
  inherent to the substrate; reshuffling our seven utility files
  doesn't change that.
- **Long-lived feature flag with side-by-side implementations.**
  Carries two implementations indefinitely; doubles the test burden;
  users on the flag-off path are second-class. We have one PR's
  worth of cutover risk to absorb, not a year's.
- **Multi-line scope creep.** Tempting (body editors want wrapping)
  but doubles the test matrix and changes the legacy prop shape.
  Single-line for V2; multi-line is a follow-up ADR if and when we
  want it.
- **Leave the `data-index` indirection in place.** Cheaper to write,
  but means every chip render walks the editor state to stamp a
  number onto a DOM attribute the popover then reads back. The
  callback refactor is small enough — and the indirection
  surprising enough on second read — to do it in the cutover.

## References

- [Lexical Decorator Nodes](https://lexical.dev/docs/concepts/nodes)
- [`application/x-lexical-editor` MIME](https://lexical.dev/docs/api/modules/lexical_clipboard)
- [Hoppscotch SmartEnvInput (CodeMirror 6 in the same domain)](https://github.com/hoppscotch/hoppscotch)
- `packages/ui/src/features/variable-input/components/VariableInput.tsx`
  — the implementation this ADR retires.
- `packages/ui/src/features/variable-input-v2/` — the implementation
  this ADR retires *into* the canonical path.
- `packages/ui/src/features/variables-editor/components/VariableEditor.tsx`
  — the state-modal popover both implementations share; refactored
  to take a `nodeKey` callback in the cutover.
- [`../features/variable-input.feature`](../features/variable-input.feature)
  — behavioural contract.
