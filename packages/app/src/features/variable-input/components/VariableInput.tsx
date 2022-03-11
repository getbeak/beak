import RealtimeValueEditor from '@beak/app/features/realtime-value-editor/components/RealtimeValueEditor';
import useForceReRender from '@beak/app/hooks/use-force-rerender';
import { checkShortcut } from '@beak/app/lib/keyboard-shortcuts';
import { requestFlight } from '@beak/app/store/flight/actions';
import { RealtimeValuePart, ValueParts } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { getRealtimeValue } from '../../realtime-values';
import { NormalizedSelection, normalizeSelection, trySetSelection } from '../utils/browser-selection';
import { handlePaste } from '../utils/pasting';
import renderValueParts from '../utils/render-value-parts';
import { determineInsertionMode, VariableSelectionState } from '../utils/variables';
import VariableSelector from './molecules/VariableSelector';
import UnmanagedInput from './organisms/UnmanagedInput';

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
	const dispatch = useDispatch();
	const { variableGroups } = useSelector(s => s.global.variableGroups);

	const forceRerender = useForceReRender();
	const [showSelector, setShowSelector] = useState(() => false);
	const [query, setQuery] = useState('');

	const editableRef = useRef<HTMLDivElement | null>(null);
	const placeholderRef = useRef<HTMLDivElement | null>(null);
	const unmanagedStateRef = useRef<UnmanagedState>({
		lastUpstreamReport: 0,
		valueParts: incomingParts,
	});

	// Setup ref
	useEffect(() => {
		if (!editableRef.current)
			return;

		const elem = editableRef.current;

		elem.innerHTML = renderValueParts(
			unmanagedStateRef.current.valueParts,
			variableGroups,
		);

		elem.addEventListener('input', handleChange);
		elem.addEventListener('keydown', handleKeyDown);
		elem.addEventListener('blur', handleBlur);
		elem.addEventListener('paste', handlePaste);
	}, []);

	useEffect(() => {
		if (!editableRef.current)
			return;

		// Pretend it's an input, as it technically is
		(editableRef.current as HTMLInputElement).disabled = Boolean(disabled);
	}, [disabled]);

	useEffect(() => {
		// Update unmanaged state if the change comes in more than 100ms after our last known write
		if (unmanagedStateRef.current.lastUpstreamReport + 100 < Date.now()) {
			unmanagedStateRef.current.valueParts = incomingParts;

			forceRerender();
		}

		if (document.activeElement !== editableRef.current)
			return;

		// trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
	}, [incomingParts]);

	function handleChange(naiveEvent: Event) {
		const event = naiveEvent as InputEvent;

		// https://rawgit.com/w3c/input-events/v1/index.html#overview
		const delta = event.data;

		event.stopPropagation();
		event.preventDefault();

		reconcile();

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

		const query = part.substring(variableSelectionState.queryStartSelection.offset);

		if (query === '')
			closeSelector();
		else
			setQuery(query);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key))
			return;

		event.preventDefault();

		if (event.key === 'Escape')
			closeSelector();

		// If a flight is about to happen, make sure the data is correct!
		if (checkShortcut('global.execute-request', event)) {
			event.stopPropagation();
			reportChange();

			// Wait for the reported change to hit
			window.setTimeout(() => dispatch(requestFlight()), 0);
		}
	}

	function handleBlur() {
		closeSelector();
		reportChange();
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
				// eslint-disable-next-line no-console
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

		const { lastSelectionPosition } = unmanagedStateRef.current;

		unmanagedStateRef.current.valueParts = reconcilledParts;
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(lastSelectionPosition);

		if (placeholderRef.current)
			placeholderRef.current.style.display = reconcilledParts.length === 0 ? 'block' : 'none';

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

		unmanagedStateRef.current.debounceHandler = window.setTimeout(reportChange, 600);
	}

	function reportChange() {
		// Don't report changes upstream while the variable selector is open
		if (showSelector)
			return;

		const { debounceHandler, lastSelectionPosition, valueParts } = unmanagedStateRef.current;

		// Make sure we aren't double reporting!
		if (debounceHandler)
			window.clearTimeout(debounceHandler);

		unmanagedStateRef.current.lastUpstreamReport = Date.now();
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(lastSelectionPosition);

		onChange(valueParts);
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

		// eslint-disable-next-line no-new
		new Promise(() => {
			reportChange();
			internalPartUpdate();
		});
	}

	function variableEditSaved(partIndex: number, type: string, item: any) {
		const valueParts = unmanagedStateRef.current.valueParts;
		const part = unmanagedStateRef.current.valueParts[partIndex];

		if (typeof part !== 'object' || part.type !== type) {
			// eslint-disable-next-line no-console
			console.error(`Part ordering change mid edit, cannot continue. expected ${type}`);

			return;
		}

		const newParts = [...valueParts];
		const existingPart = newParts[partIndex] as RealtimeValuePart;

		(newParts[partIndex] as RealtimeValuePart) = {
			...existingPart,
			payload: item,
		};

		unmanagedStateRef.current.valueParts = newParts;

		// eslint-disable-next-line no-new
		new Promise(() => {
			reportChange();
			forceRerender();
		});
	}

	function internalPartUpdate() {
		editableRef.current!.innerHTML = renderValueParts(
			unmanagedStateRef.current.valueParts,
			variableGroups,
		);

		// eslint-disable-next-line no-new
		new Promise(() => {
			trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
		});
	}

	function closeSelector() {
		setShowSelector(false);
		setQuery('');

		unmanagedStateRef.current.variableSelectionState = void 0;
	}

	return (
		<Wrapper>
			<UnmanagedInput innerRef={editableRef} />
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
					onSave={variableEditSaved}
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
	pointer-events: none;
`;

export default VariableInput;
