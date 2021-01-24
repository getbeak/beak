import { TypedObject } from '@beak/common/dist/helpers/typescript';
import { RealtimeValue, ValueParts, VariableGroupItem } from '@beak/common/dist/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { getImplementation } from '../../realtime-values';

import VariableSelector from './VariableSelector';

interface Position {
	top: number;
	left: number;
}

export interface VariableInputProps {
	disabled?: boolean;
	parts: ValueParts;
	onChange: (parts: ValueParts) => void;
}

const VariableInput: React.FunctionComponent<VariableInputProps> = ({ disabled, parts, onChange }) => {
	const [selectorPosition, setSelectorPosition] = useState<Position | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const valueRef = useRef<ValueParts>(parts);
	const lastKnownWriteRef = useRef(0);

	const [query, setQuery] = useState('');
	const [partIndex, setPartIndex] = useState<number>();
	const [, setNonce] = useState(0);
	const [queryOffset, setQueryOffset] = useState<number>();
	const { variableGroups } = useSelector(s => s.global.variableGroups);

	useEffect(() => {
		const now = Date.now();

		// Don't update from state if last known write was less than 150ms ago
		if (lastKnownWriteRef.current + 150 > now)
			return;

		valueRef.current = parts;
	}, [parts]);

	function updateParts(parts: ValueParts, options?: { forceRefUpdate?: boolean; immediateWrite?: boolean }) {
		const opts = { ...options };

		lastKnownWriteRef.current = opts.forceRefUpdate ? 0 : Date.now();

		if (opts.immediateWrite) {
			valueRef.current = parts;

			setNonce(Date.now());
		}

		onChange(parts);
	}

	function closeSelector() {
		setSelectorPosition(null);
		setQuery('');
		setQueryOffset(void 0);
		setPartIndex(void 0);
	}

	function insertVariable(_variableGroupName: string, itemId: string) {
		if (selectorPosition === null || partIndex === void 0 || queryOffset === void 0)
			return;

		const part = parts[partIndex] as string;
		const lastPart = parts.length === partIndex - 1;
		const atEnd = lastPart && part.length === queryOffset + query.length;
		const newPart: VariableGroupItem = {
			type: 'variable_group_item',
			payload: { itemId },
		};

		closeSelector();

		// Set the correct cursor position
		window.setTimeout(() => {
			const sel = window.getSelection()!;
			const range = sel.getRangeAt(0);

			range.setStart(ref.current as Node, partIndex + 2);

			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);
		}, 0);

		if (atEnd) {
			const newParts: ValueParts = [...parts, newPart];

			newParts[partIndex] = (parts[partIndex] as string).substring(0, queryOffset - 1);

			updateParts(newParts, { immediateWrite: true });

			return;
		}

		const newParts: ValueParts = [...parts];
		const [start, end] = [
			part.substring(0, queryOffset - 1),
			part.substring(queryOffset + query.length),
		];

		newParts.splice(partIndex, 1);
		newParts.splice(partIndex, 0, start, newPart, end);

		updateParts(newParts, { immediateWrite: true });
	}

	function showVariableSelector(newParts: ValueParts) {
		const sel = window.getSelection()!;
		const range = sel.getRangeAt(0);
		const elem = range.startContainer.parentElement! as HTMLElement;
		const rect = elem.getBoundingClientRect();
		const contentLength = (elem.textContent ?? '').length;
		const caretOffset = range.startOffset;
		const positionOffset = caretOffset / contentLength;
		const width = elem.offsetWidth;
		const offsetDelta = width * positionOffset;

		const queryOffset = range.startOffset;
		const partIndex = newParts.findIndex(p => p === elem.textContent);
		const part = (newParts[partIndex] as string);
		const [start, end] = [part.substring(0, queryOffset), part.substring(queryOffset)];
		const newerParts = [...newParts];

		newerParts[partIndex] = start;
		newerParts.splice(partIndex + 1, 0, end);

		updateParts(newerParts);
		setPartIndex(partIndex);
		setQueryOffset(queryOffset);
		setQuery(start.substring(queryOffset));
		setSelectorPosition({
			left: (rect.left + offsetDelta) - 5,
			top: rect.top + elem.offsetHeight,
		});
	}

	function change(event: React.FormEvent<HTMLDivElement>) {
		event.stopPropagation();
		event.preventDefault();

		// https://rawgit.com/w3c/input-events/v1/index.html#overview
		const delta = (event.nativeEvent as InputEvent).data;
		const newParts = Array.from(ref.current!.childNodes)
			.map(n => {
				if (n.nodeName === '#text' || n.nodeName === 'SPAN')
					return n.textContent || '';

				if (n.nodeName !== 'DIV')
					return null;

				const elem = n as HTMLElement;
				const type = elem.dataset.type ?? '';

				const impl = getImplementation(type);
				const value = impl.fromHtml(elem.dataset);

				return value as RealtimeValue;
			})
			.filter(f => f !== null && f !== '') as ValueParts;

		updateParts(newParts);

		// Check if we want to open variable selector
		if (delta === '{') {
			showVariableSelector(newParts);

			return;
		}

		// Scrub if the variable selector isn't open
		if (selectorPosition === null || partIndex === void 0 || queryOffset === void 0)
			return;

		const part = newParts[partIndex];

		if (typeof part !== 'string') {
			closeSelector();

			return;
		}

		const queryLength = part.length - queryOffset;

		if (queryLength === -1)
			closeSelector();
		else
			setQuery(part.substr(queryOffset));
	}

	function renderParts(parts: ValueParts) {
		return renderToStaticMarkup(
			<React.Fragment>
				{parts.map(p => {
					if (typeof p === 'string')
						return <span key={p}>{p}</span>;

					if (typeof p !== 'object')
						throw new Error('unknown part');

					const impl = getImplementation(p.type);
					const html = impl.toHtml(p, variableGroups);
					const dataProps = TypedObject.keys(html.dataset).reduce((acc, val) => ({
						...acc,
						[`data-payload-${val}`]: html.dataset[val],
					}), { 'data-type': html.type });

					return (
						<div
							className={'bvs-blob'}
							contentEditable={false}
							{...dataProps}
							key={html.key}
						>
							<strong>{html.renderer.title}</strong>
							{html.renderer.body && ` (${html.renderer.body})`}
						</div>
					);
				})}
			</React.Fragment>,
		);
	}

	function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
		const hasHtml = event.clipboardData.types.includes('text/html');

		if (!hasHtml)
			return;

		event.preventDefault();

		// TODO(afr): Bring back HTML pasting
		const html = event.clipboardData.getData('text/html');

		console.error('No HTML pasting allowed', html);
	}

	return (
		<React.Fragment>
			<Input
				contentEditable={!disabled}
				spellCheck={false}
				ref={ref}
				suppressContentEditableWarning
				onBlur={event => {
					if (!event.relatedTarget) {
						closeSelector();

						return;
					}

					const elem = event.relatedTarget as HTMLDivElement;

					if (!elem.className?.includes('variable-selector'))
						closeSelector();
				}}
				onInput={change}
				onKeyDown={event => {
					if (!['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
						return;

					event.preventDefault();

					if (event.key === 'Escape') {
						closeSelector();

						return;
					}
				}}
				onPaste={handlePaste}
				dangerouslySetInnerHTML={{ __html: renderParts(valueRef.current) }}
			/>
			{(ref.current && selectorPosition) && (
				<VariableSelector
					onDone={insertVariable}
					onClose={() => closeSelector()}
					query={query}
					parent={ref.current}
					position={selectorPosition}
				/>
			)}
		</React.Fragment>
	);
};

const Input = styled.article`
	font-size: 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	white-space: nowrap;
	overflow: hidden;

	> * {
		display:inline;
		white-space:nowrap;
	}
`;

export default VariableInput;