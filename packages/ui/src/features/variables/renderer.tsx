import type { VariableSets } from '@getbeak/types/variable-sets';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { VariableManager } from '.';
import type { ValueSections } from './values';
import { getVariableSetItemName } from './values/variable-set-item';

/**
 * Zero-width space used as a caret-landing sentinel inside otherwise-empty
 * string spans and the synthetic gap-anchors between consecutive blobs.
 *
 * Chromium refuses to render the caret inside a zero-content inline element
 * that sits beside a `contenteditable=false` block — that's why users would
 * see the caret vanish after a trailing variable. Providing this sentinel
 * gives the caret a concrete glyph to anchor on, then the parser strips
 * `​` so it never leaks into the saved value sections.
 */
const CARET_ANCHOR = '​';

export default function renderValueSections(parts: ValueSections, variableSets: VariableSets) {
	const safeParts: ValueSections = Array.isArray(parts) ? parts : [];

	const nodes: React.ReactNode[] = [];

	safeParts.forEach((p, idx) => {
		// Insert a synthetic anchor span between two consecutive blobs so the
		// caret has somewhere to land when arrow-keying across them.
		const prev = idx > 0 ? safeParts[idx - 1] : null;
		const currentIsBlob = typeof p === 'object' && p !== null;
		const prevIsBlob = typeof prev === 'object' && prev !== null;
		if (prevIsBlob && currentIsBlob) {
			nodes.push(
				<span key={`anchor-${idx}`} data-anchor='gap'>
					{CARET_ANCHOR}
				</span>,
			);
		}

		if (typeof p === 'string') {
			// Empty parts need the caret anchor too — without it the caret at
			// offset 0 of an empty span is invisible next to a blob.
			if (p.length === 0) {
				nodes.push(
					<span key={`empty-${idx}`} data-index={idx} data-anchor='empty'>
						{CARET_ANCHOR}
					</span>,
				);
			} else {
				nodes.push(
					<span key={`text-${idx}-${p}`} data-index={idx}>
						{p}
					</span>,
				);
			}
			return;
		}

		if (typeof p !== 'object') {
			console.error(`Unknown value part ${p}:(${typeof p})`);
			return;
		}

		const rtv = VariableManager.getVariable(p.type);

		if (!rtv) {
			nodes.push(
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: renderToStaticMarkup, no reconciliation
					key={`missing-${idx}`}
					className={'bvs-blob'}
					contentEditable={false}
					data-index={idx}
					data-editable={false}
					data-missing='true'
					data-type={p.type}
					data-payload={void 0}
				>
					&nbsp;
					<span
						data-tooltip-id={'tt-variables-renderer-extension-missing'}
						data-tooltip-content={`Missing extension: ${p.type}`}
					>
						{'⚠ extension missing'}
					</span>
					&nbsp;
				</div>,
			);
			return;
		}

		const editable = 'editor' in rtv;
		const name = (() => {
			if (p.type === 'variable_set_item') {
				const payload = p.payload as { itemId: string };
				return getVariableSetItemName(payload, variableSets);
			}

			if (rtv.getContextAwareName !== void 0) return rtv.getContextAwareName(p.payload);

			return rtv.name;
		})();

		// Variable-set items resolve per-environment and read differently from
		// generated/computed values — tag a separate visual category for them.
		const category = p.type === 'variable_set_item' ? 'env' : rtv.external ? 'extension' : 'builtin';

		nodes.push(
			<div
				// biome-ignore lint/suspicious/noArrayIndexKey: renderToStaticMarkup, no reconciliation
				key={`blob-${idx}`}
				className={'bvs-blob'}
				contentEditable={false}
				data-index={idx}
				data-editable={editable}
				data-type={p.type}
				data-category={category}
				data-sensitive={rtv.sensitive ? 'true' : void 0}
				data-payload={p.payload ? JSON.stringify(p.payload) : void 0}
			>
				&nbsp;
				{name}
				&nbsp;
			</div>,
		);
	});

	// If the very last part is a blob, leave a trailing caret anchor so the
	// user can position the cursor and continue typing past it.
	const last = safeParts[safeParts.length - 1];
	if (last && typeof last === 'object') {
		nodes.push(
			<span key='trailing-anchor' data-anchor='tail'>
				{CARET_ANCHOR}
			</span>,
		);
	}

	return renderToStaticMarkup(<React.Fragment>{nodes}</React.Fragment>);
}
