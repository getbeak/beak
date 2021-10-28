import RealtimeValueEditor from '@beak/app/features/realtime-value-editor/components/RealtimeValueEditor';
import useForceReRender from '@beak/app/hooks/use-force-rerender';
import { RealtimeValuePart, ValueParts } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getRealtimeValue } from '../../realtime-values';
import { NormalizedSelection, normalizeSelection, trySetSelection } from '../utils/browser-selection';
import { handlePaste } from '../utils/pasting';
import renderValueParts from '../utils/render-value-parts';
import { determineInsertionMode, VariableSelectionState } from '../utils/variables';
import VariableSelector from './molecules/VariableSelector';

interface UnmanagedState {
	valueParts: ValueParts;
	debounceHandler?: number;
	lastUpstreamReport: number;
	lastSelectionPosition?: NormalizedSelection;
	variableSelectionState?: VariableSelectionState;
}

export interface VariableInputProps {
	placeholder?: string;
	disabled?: boolean;
	parts: ValueParts;

	onChange: (parts: ValueParts) => void;
	onUrlQueryStringDetection?: () => void;
}

const VariableInput: React.FunctionComponent<VariableInputProps> = props => {
	const { disabled, placeholder, parts: incomingParts, onChange } = props;
	const { variableGroups } = useSelector(s => s.global.variableGroups);

	const forceRerender = useForceReRender();
	const [showSelector, setShowSelector] = useState(false);
	const [query, setQuery] = useState('');

	const editableRef = useRef<HTMLDivElement | null>(null);
	const placeholderRef = useRef<HTMLDivElement | null>(null);
	const unmanagedStateRef = useRef<UnmanagedState>({
		lastUpstreamReport: 0,
		valueParts: [],
	});

	trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	window.setTimeout(() => {
		trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	}, 10);

	useEffect(() => {
		if (!showSelector)
			return;

		trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	}, [showSelector]);

	useEffect(() => {
		if (!query)
			return;

		trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	}, [query]);

	useEffect(() => {
		// Update unmanaged state if the change comes in more than 100ms after our last known write
		if (unmanagedStateRef.current.lastUpstreamReport + 100 < Date.now()) {
			unmanagedStateRef.current.valueParts = incomingParts;

			forceRerender();
		}

		if (document.activeElement !== editableRef.current)
			return;

		trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	}, [incomingParts]);

	function handleChange(event: React.FormEvent<HTMLDivElement>) {
		event.stopPropagation();
		event.preventDefault();

		reconcile();

		// https://rawgit.com/w3c/input-events/v1/index.html#overview
		const delta = (event.nativeEvent as InputEvent).data;

		if (!showSelector) {
			if (delta === '{')
				openSelector();

			return;
		}

		const { variableSelectionState, valueParts } = unmanagedStateRef.current;

		// Santiy check, but by now the selector will be open
		if (!variableSelectionState)
			return;

		// Selector is open, so update query
		const part = valueParts[variableSelectionState.queryStartSelection.partIndex];

		if (typeof part !== 'string')
			return;

		const query = part.substring(variableSelectionState.queryStartSelection.offset)

		if (query === '')
			closeSelector();
		else
			setQuery(query);
	}

	function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
		if (!['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
			return;

		event.preventDefault();

		if (event.key === 'Escape')
			closeSelector();
	}

	function reconcile() {
		if (!editableRef.current)
			return;

		const reconcilledParts: ValueParts = [];
		const children = editableRef.current.childNodes;

		// If we detect some invalid state, we just ask React to re-render to clear out any
		// unsafe/unknown code for us
		let anonomlyDetected = false;

		Array.from(children).forEach(n => {
			// Detect simple text content
			if (n.nodeName === '#text' || n.nodeName === 'SPAN') {
				let originalTextContent = n.textContent || '';

				// Handle optional query string detection here
				if (props.onUrlQueryStringDetection && originalTextContent.includes('?')) {
					const textContext = originalTextContent.replaceAll('?', '');

					// eslint-disable-next-line no-param-reassign
					n.textContent = textContext;
					originalTextContent = textContext;

					props.onUrlQueryStringDetection();
					editableRef.current?.blur();
				}

				if (originalTextContent)
					reconcilledParts.push(originalTextContent);

				return;
			}

			// Handle weird browser edge case
			if (children.length === 1 && n.nodeName === 'BR')
				return;

			// Detect unallowed div content
			if (n.nodeName !== 'DIV') {
				anonomlyDetected = true;

				return;
			}

			const elem = n as HTMLElement;
			const type = elem.dataset.type!;
			const impl = getRealtimeValue(type);

			if (!impl) {
				console.error(`Unknown RTV ${type}`);
				anonomlyDetected = true;

				return;
			}

			const purePayload = elem.dataset.payload;

			reconcilledParts.push({
				type,
				payload: purePayload ? JSON.parse(purePayload) : void 0,
			} as RealtimeValuePart);

			return;
		});

		unmanagedStateRef.current.valueParts = reconcilledParts;
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(unmanagedStateRef.current.lastSelectionPosition);

		placeholderRef.current!.style.display = reconcilledParts.length === 0 ? 'block' : 'none';

		// This means something really weird has happened, such as an unknown element getting into our DOM state. If
		// that happens we just tell React to re-render and override with the state that we know about
		if (anonomlyDetected) {
			unmanagedStateRef.current.lastSelectionPosition = void 0;

			forceRerender();
		} else {
			debounceChange();
		}
	}

	function debounceChange() {
		const { debounceHandler } = unmanagedStateRef.current;

		if (debounceHandler)
			window.clearTimeout(debounceHandler);

		unmanagedStateRef.current.debounceHandler = window.setTimeout(reportChange, 300);
	}

	function reportChange() {
		// Don't report changes upstream while the variable selector is open
		if (showSelector)
			return;

		unmanagedStateRef.current.lastUpstreamReport = Date.now();
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(unmanagedStateRef.current.lastSelectionPosition);

		onChange(unmanagedStateRef.current.valueParts);
	}

	function openSelector() {
		setShowSelector(true);

		const selection = normalizeSelection(unmanagedStateRef.current.lastSelectionPosition);
		const part = unmanagedStateRef.current.valueParts[selection.partIndex];

		if (typeof part !== 'string')
			return;

		unmanagedStateRef.current.variableSelectionState = {
			queryStartSelection: normalizeSelection(selection),
			queryTrailingLength: part.length - selection.offset,
		};
	}

	function insertVariable(variable: RealtimeValuePart) {
		const { valueParts, variableSelectionState } = unmanagedStateRef.current;

		if (!variableSelectionState)
			return;

		const { queryStartSelection, queryTrailingLength } = variableSelectionState;
		const { offset, partIndex } = queryStartSelection;
		const queryLength = query.length;
		const mode = determineInsertionMode(valueParts, variableSelectionState, queryLength);
		const newPartSelectionIndex = mode === 'append' ? partIndex + 2 : partIndex + 1;

		if (['prepend', 'append'].includes(mode)) {
			let finalPartIndex = partIndex;

			if (mode === 'prepend') {
				finalPartIndex += 1;
				unmanagedStateRef.current.valueParts.splice(partIndex, 0, variable);
			} else { // append
				unmanagedStateRef.current.valueParts.splice(partIndex + 1, 0, variable);
			}

			const part = (valueParts[finalPartIndex] as string);
			const partWithoutQuery = [
				part.substring(0, offset - 1),
				part.substr(part.length - queryTrailingLength),
			].join('');

			unmanagedStateRef.current.valueParts[finalPartIndex] = partWithoutQuery;
		} else if (mode === 'inject') {
			const part = (valueParts[partIndex] as string);
			const pre = part.substring(0, offset - 1);
			const post = part.substr(part.length - queryTrailingLength);

			unmanagedStateRef.current.valueParts[partIndex] = pre;
			unmanagedStateRef.current.valueParts.splice(partIndex + 1, 0, variable);
			unmanagedStateRef.current.valueParts.splice(partIndex + 2, 0, post);
		} else {
			closeSelector();

			return;
		}

		const newSelectionPosition = {
			partIndex: newPartSelectionIndex,
			isTextNode: false,
			offset: 0,
		};

		unmanagedStateRef.current.lastSelectionPosition = newSelectionPosition;

		closeSelector();
		reportChange();
		forceRerender();

		window.setTimeout(() => {
			trySetSelection(editableRef.current, newSelectionPosition);
		}, 0);
	}

	function closeSelector() {
		setShowSelector(false);
		setQuery('');
		unmanagedStateRef.current.variableSelectionState = void 0;
	}

	return (
		<Wrapper>
			<Input
				contentEditable={!disabled}
				spellCheck={false}
				ref={editableRef}
				suppressContentEditableWarning
				onInput={handleChange}
				onBlur={reportChange}
				onKeyDown={handleKeyDown}
				onPaste={handlePaste}
				dangerouslySetInnerHTML={{
					__html: renderValueParts(
						unmanagedStateRef.current.valueParts,
						variableGroups,
					),
				}}
			/>
			{placeholder && (
				<Placeholder
					ref={placeholderRef}
					$shown={unmanagedStateRef.current.valueParts.length === 0}
				>
					{placeholder}
				</Placeholder>
			)}
			{showSelector && editableRef && (
				<VariableSelector
					editableElement={editableRef.current!}
					sel={unmanagedStateRef.current.lastSelectionPosition!}
					query={query}
					onDone={insertVariable}
					onClose={closeSelector}
				/>
			)}
			{editableRef.current && (
				<RealtimeValueEditor
					editable={editableRef.current}
					onClose={() => { /* */ }}
				/>
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	position: relative;
`;

const Placeholder = styled.div<{ $shown: boolean }>`
	display: ${p => p.$shown ? 'block' : 'none'};
	position: absolute;
	top: 7px; left: 7px;
	color: ${p => p.theme.ui.textMinor};
`;

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
