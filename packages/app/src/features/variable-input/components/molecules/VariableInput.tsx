import RealtimeValueEditor from '@beak/app/features/realtime-value-editor/components/RealtimeValueEditor';
import useDebounce from '@beak/app/hooks/use-debounce';
import { RealtimeValuePart, ValueParts } from '@beak/common/dist/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { getRealtimeValue } from '../../realtime-values';
import { RealtimeValue } from '../../realtime-values/types';
import { getVariableGroupItemName } from '../../realtime-values/values/variable-group-item';
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

interface RtvEditorContext {
	realtimeValue: RealtimeValue<any>;
	item: any;
	parent: HTMLDivElement;
	partIndex: number;
}

const VariableInput: React.FunctionComponent<VariableInputProps> = ({ disabled, parts, onChange }) => {
	const [selectorPosition, setSelectorPosition] = useState<Position | null>(null);
	const [rtvEditorContext, setRtvEditorContext] = useState<RtvEditorContext | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const lastKnownWriteRef = useRef(0);

	const valueRef = useRef<ValueParts>([]);
	const [localValue, setLocalValue] = useState<ValueParts>([]);

	const [query, setQuery] = useState('');
	const [partIndex, setPartIndex] = useState<number>();
	const [queryOffset, setQueryOffset] = useState<number>();
	const { variableGroups } = useSelector(s => s.global.variableGroups);

	useEffect(() => {
		// Don't update from state if last known write was less than 150ms ago
		if (lastKnownWriteRef.current + 200 > Date.now())
			return;

		valueRef.current = parts;
		setLocalValue(parts);
	}, [parts]);

	useDebounce(() => {
		lastKnownWriteRef.current = Date.now();

		onChange(localValue);
	}, 300, [localValue]);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			const target = event.target as HTMLDivElement;

			if (target.className !== 'bvs-blob')
				return;

			const { index, type, payload } = target.dataset;

			if (!type)
				return;

			const rtv = getRealtimeValue(type);

			if (!rtv.editor)
				return;

			setRtvEditorContext({
				realtimeValue: rtv,
				item: JSON.parse(payload!),
				parent: target,
				partIndex: Number(index!),
			});
		};

		ref.current?.addEventListener('click', onClick);

		return () => {
			ref.current?.removeEventListener('click', onClick);
		};
	}, []);

	function updateParts(parts: ValueParts, options?: { immediateWrite?: boolean }) {
		const opts = { ...options };

		setLocalValue(parts);

		if (opts.immediateWrite) {
			lastKnownWriteRef.current = Date.now();
			valueRef.current = parts;

			onChange(parts);
		}
	}

	function closeSelector() {
		setSelectorPosition(null);
		setQuery('');
		setQueryOffset(void 0);
		setPartIndex(void 0);
	}

	function insertVariable(value: RealtimeValuePart) {
		if (selectorPosition === null || partIndex === void 0 || queryOffset === void 0)
			return;

		const part = parts[partIndex] as string;
		const lastPart = parts.length === partIndex - 1;
		const atEnd = lastPart && part.length === queryOffset + query.length;

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
			const newParts: ValueParts = [...parts, value];

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
		newParts.splice(partIndex, 0, start, value, end);

		updateParts(newParts, { immediateWrite: true });
	}

	function showVariableSelector(newParts: ValueParts) {
		const sel = window.getSelection()!;
		const range = sel.getRangeAt(0);
		const elem = range.startContainer! as HTMLElement;

		const rect = elem.parentElement!.getBoundingClientRect();
		const contentLength = (elem.textContent ?? '').length;
		const caretOffset = range.startOffset;
		const positionOffset = caretOffset / contentLength;
		const width = rect.width;
		const offsetDelta = width * positionOffset;

		const queryOffset = range.startOffset;
		const partIndex = newParts.findIndex(p => p === elem.textContent);
		const part = (newParts[partIndex] as string);
		const [start, end] = [part.substring(0, queryOffset), part.substring(queryOffset)];
		const newerParts = [...newParts];

		newerParts[partIndex] = start;
		newerParts.splice(partIndex + 1, 0, end);

		setPartIndex(partIndex);
		setQueryOffset(queryOffset);
		setQuery(start.substring(queryOffset));
		setSelectorPosition({
			left: rect.left + offsetDelta,
			top: rect.top + rect.height + 5,
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
				const type = elem.dataset.type!;
				const impl = getRealtimeValue(type);
				const purePayload = elem.dataset.payload;

				if (!impl) {
					console.error(`Unknown RTV ${type}`);

					return null;
				}

				return {
					type,
					payload: purePayload ? JSON.parse(purePayload) : void 0,
				} as RealtimeValuePart;
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
				{parts.map((p, idx) => {
					if (typeof p === 'string')
						return <span key={p}>{p}</span>;

					if (typeof p !== 'object')
						return `[Unknown value part ${p}:(${typeof p})]`;

					const impl = getRealtimeValue(p.type);

					if (!impl) {
						console.error(`Unknown RTV ${p} ${typeof p} ${p.type}`);

						return null;
					}

					const name = (() => {
						if (p.type === 'variable_group_item')
							return getVariableGroupItemName(p.payload, variableGroups);

						return impl.name;
					})();

					return (
						<div
							className={'bvs-blob'}
							contentEditable={false}
							data-index={idx}
							data-type={p.type}
							data-payload={p.payload ? JSON.stringify(p.payload) : void 0}
							key={uuid.v4()}
						>
							{name}
						</div>
					);
				})}
			</React.Fragment>,
		);
	}

	function handlePaste(event: React.ClipboardEvent<HTMLElement>) {
		// NOTE(afr): This is a temporary solution, more feature rich version needed
		// later. Parsing the clipboard HTML to preserve value part blobs will be sick
		event.preventDefault();

		const plainText = event.clipboardData.getData('text/plain');

		document.execCommand('insertText', false, plainText);
	}

	return (
		<React.Fragment>
			<Input
				contentEditable={!disabled}
				spellCheck={false}
				ref={ref}
				suppressContentEditableWarning
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
			{(ref.current && rtvEditorContext) && (
				<RealtimeValueEditor
					realtimeValue={rtvEditorContext.realtimeValue}
					item={rtvEditorContext.item}
					parent={rtvEditorContext.parent}
					onClose={item => {
						setRtvEditorContext(null);

						if (item === null)
							return;

						// save part based on rtvEditorContext.partIndex
						const part = parts[rtvEditorContext.partIndex];
						const type = rtvEditorContext.realtimeValue.type;

						if (typeof part !== 'object' || type !== part.type) {
							console.error(`Part ordering change mid edit, cannot continue. expected ${type}`);

							return;
						}

						const newParts = [...parts];

						(newParts[rtvEditorContext.partIndex] as RealtimeValuePart).payload = item;

						updateParts(newParts, { immediateWrite: true });
					}}
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
