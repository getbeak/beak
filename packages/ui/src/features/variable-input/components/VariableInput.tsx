import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ValuePart, ValueSections } from '@beak/ui/features/variables/values';
import VariableEditor from '@beak/ui/features/variables-editor/components/VariableEditor';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { requestFlight } from '@beak/ui/store/flight/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import styled from 'styled-components';

import useVariableContext from '../../variables/hooks/use-variable-context';
import { parseValueSections } from '../../variables/parser';
import renderValueSections from '../../variables/renderer';
import { NormalizedSelection, normalizeSelection, trySetSelection } from '../utils/browser-selection';
import { detectRelevantCopiedValueSections } from '../utils/copying';
import { handlePaste } from '../utils/pasting';
import { sanitiseValueSections } from '../utils/sanitation';
import { determineInsertionMode, VariableSelectionState } from '../utils/variables';
import VariableSelector from './molecules/VariableSelector';
import UnmanagedInput from './organisms/UnmanagedInput';

interface UnmanagedState {
	ValueSections: ValueSections;
	debounceHandler?: number;
	lastUpstreamReport: number;
	lastSelectionPosition?: NormalizedSelection;
	variableSelectionState?: VariableSelectionState;
}

export interface VariableInputProps {
	disabled?: boolean;
	placeholder?: string;
	requestId?: string;
	parts: ValueSections;
	readOnly?: boolean;

	onChange: (parts: ValueSections) => void;
	onUrlQueryStringDetection?: () => void;
}

const VariableInput = React.forwardRef<HTMLElement, VariableInputProps>((props, forwardedRef) => {
	const { disabled, requestId, placeholder, parts: incomingParts, onChange, readOnly } = props;
	const dispatch = useDispatch();

	const [latestForceRerender, forceRerender] = useForceReRender();
	const [showSelector, setShowSelector] = useState(() => false);
	const [query, setQuery] = useState('');

	const { variableSets } = useAppSelector(s => s.global.variableSets);
	const selectedGroups = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);

	const context = useVariableContext(props.requestId);
	const editableRef = useRef<HTMLDivElement | null>(null);
	const placeholderRef = useRef<HTMLDivElement | null>(null);
	const unmanagedStateRef = useRef<UnmanagedState>({
		lastUpstreamReport: 0,
		ValueSections: incomingParts,
	});

	// Setup ref
	useEffect(() => {
		if (!editableRef.current)
			return;

		if (forwardedRef && typeof forwardedRef === 'function')
			forwardedRef(editableRef.current);

		const elem = editableRef.current;

		unmanagedStateRef.current = {
			lastUpstreamReport: 0,
			ValueSections: incomingParts,
		};

		if (readOnly)
			elem.contentEditable = 'false';

		elem.innerHTML = renderValueSections(
			unmanagedStateRef.current.ValueSections,
			variableSets,
		);
	}, [requestId, readOnly, latestForceRerender]);

	useEffect(() => {
		const elem = editableRef.current;

		if (!elem) return () => { /* */ };

		elem.addEventListener('input', handleChange);
		elem.addEventListener('keydown', handleKeyDown);
		elem.addEventListener('copy', handleCopy);
		elem.addEventListener('blur', handleBlur);
		elem.addEventListener('paste', handlePaste);

		return () => {
			elem.removeEventListener('input', handleChange);
			elem.removeEventListener('keydown', handleKeyDown);
			elem.removeEventListener('copy', handleCopy);
			elem.removeEventListener('blur', handleBlur);
			elem.removeEventListener('paste', handlePaste);
		};
	}, [requestId, showSelector, query, variableSets, selectedGroups]);

	useEffect(() => {
		if (!editableRef.current)
			return;

		// Pretend it's an input, as it technically is
		// (editableRef.current as HTMLInputElement).disabled = Boolean(disabled);
		editableRef.current.setAttribute('disabled', String(Boolean(disabled)));
	}, [requestId, disabled]);

	useEffect(() => {
		// Update unmanaged state if the change comes in more than 100ms after our last known write
		if (unmanagedStateRef.current.lastUpstreamReport + 100 < Date.now()) {
			unmanagedStateRef.current.ValueSections = incomingParts;

			forceRerender();
		}
	}, [JSON.stringify(incomingParts)]);

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

		const { variableSelectionState, ValueSections } = unmanagedStateRef.current;

		// Sanity check, but by now the selector will be open
		if (!variableSelectionState) {
			// Ensure the selector is closed if there is no state too
			if (showSelector)
				closeSelector();

			return;
		}

		// Selector is open, so update query
		const part = ValueSections[variableSelectionState.queryStartSelection.partIndex];

		if (typeof part !== 'string') {
			if (showSelector)
				closeSelector();

			return;
		}

		const queryWithOpener = part.substring(variableSelectionState.queryStartSelection.offset - 1);
		const query = part.substring(variableSelectionState.queryStartSelection.offset);

		if (queryWithOpener === '')
			closeSelector();
		else
			setQuery(query);
	}

	async function handleCopy(event: ClipboardEvent) {
		const { anomalyDetected, ValueSections } = parseDomState();

		if (anomalyDetected || ValueSections.length === 0)
			return;

		const relevantParts = detectRelevantCopiedValueSections(ValueSections);

		if (relevantParts === null)
			return;

		const parsed = await parseValueSections(context, relevantParts);
		const clipboard = await navigator.clipboard.read();
		const html = await clipboard[0].getType('text/html');

		navigator.clipboard.write([new ClipboardItem({
			'text/plain': new Blob([parsed], { type: 'text/plain' }),
			'text/html': html,
		})]);

		event.preventDefault();
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

	function parseDomState() {
		if (!editableRef.current)
			return { anomalyDetected: false, ValueSections: [] };

		const reconciledParts: ValueSections = [];
		const children = editableRef.current.childNodes;

		// If we detect some invalid state, we just ask React to re-render to clear out any
		// unsafe/unknown code for us
		let anomalyDetected = false;

		Array.from(children).forEach(n => {
			// Detect simple text content
			if (n.nodeName === '#text' || n.nodeName === 'SPAN') {
				let originalTextContent = (n.textContent || '').replaceAll(
					/(?:[\u00a0]+)/g,
					// eslint-disable-next-line newline-per-chained-call
					substring => new Array(substring.length).fill(' ').join(''),
				);

				// Handle optional query string detection here
				// TODO(afr): Pass query body back to parent component
				if (props.onUrlQueryStringDetection && originalTextContent.includes('?')) {
					const textContext = originalTextContent.replaceAll('?', '');

					// eslint-disable-next-line no-param-reassign
					n.textContent = textContext;
					originalTextContent = textContext;

					props.onUrlQueryStringDetection();
					editableRef.current?.blur();
				}

				reconciledParts.push(originalTextContent);

				return;
			}

			// Handle weird browser edge case
			if (n.nodeName === 'BR')
				return;

			// Detect un-allowed div content
			if (n.nodeName !== 'DIV') {
				console.error(`Unknown node detected in variable input ${n.nodeName}`);
				anomalyDetected = true;

				return;
			}

			const elem = n as HTMLElement;
			const type = elem.dataset.type!;

			// TODO(afr): Detect if payload is corrected, if it is ignore and mark the
			// entire variable as an anomaly
			const purePayload = elem.dataset.payload;

			reconciledParts.push({
				type,
				payload: purePayload ? JSON.parse(purePayload) : void 0,
			});

			return;
		});

		return { anomalyDetected, ValueSections: reconciledParts };
	}

	function reconcile() {
		if (!editableRef.current)
			return;

		const { anomalyDetected, ValueSections } = parseDomState();
		const { lastSelectionPosition } = unmanagedStateRef.current;

		unmanagedStateRef.current.ValueSections = ValueSections;
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(lastSelectionPosition);

		if (placeholderRef.current)
			placeholderRef.current.style.display = ValueSections.length === 0 ? 'block' : 'none';

		// This means something really weird has happened, such as an unknown element getting into our DOM state. If
		// that happens we just tell React to re-render and override with the state that we know about
		if (anomalyDetected) {
			console.error('Anomaly detected while parsing dom state!');

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

		unmanagedStateRef.current.debounceHandler = window.setTimeout(reportChange, 50);
	}

	function reportChange(ignoreSelectorCheck = false) {
		// Don't report changes upstream while the variable selector is open
		if (showSelector) {
			if (!ignoreSelectorCheck)
				return;
		}

		const { debounceHandler, lastSelectionPosition, ValueSections } = unmanagedStateRef.current;

		// Make sure we aren't double reporting!
		if (debounceHandler)
			window.clearTimeout(debounceHandler);

		unmanagedStateRef.current.lastUpstreamReport = Date.now();
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(lastSelectionPosition);

		// Cleanup the format before we pass it back to the store. If we do this internally it'll mess up some of the
		// DOM <-> State management. Very bad design from me.
		onChange(sanitiseValueSections(ValueSections));
	}

	function openSelector() {
		setShowSelector(true);

		const selection = normalizeSelection(unmanagedStateRef.current.lastSelectionPosition);
		const part = unmanagedStateRef.current.ValueSections[selection.partIndex];

		if (typeof part !== 'string')
			return;

		unmanagedStateRef.current.variableSelectionState = {
			queryStartSelection: normalizeSelection(selection),
			queryTrailingLength: part.length - selection.offset,
		};
	}

	function insertVariable(variable: ValuePart) {
		const { ValueSections, variableSelectionState } = unmanagedStateRef.current;

		if (!variableSelectionState)
			return;

		const { queryStartSelection, queryTrailingLength } = variableSelectionState;
		const { offset, partIndex } = queryStartSelection;
		const queryLength = query.length;
		const mode = determineInsertionMode(ValueSections, variableSelectionState, queryLength);
		const newPartSelectionIndex = mode === 'append' ? partIndex + 2 : partIndex + 1;
		const mutatedValueSections = [...ValueSections];

		if (['prepend', 'append'].includes(mode)) {
			let finalPartIndex = partIndex;

			if (mode === 'prepend') {
				finalPartIndex += 1;
				mutatedValueSections.splice(partIndex, 0, variable);
			} else { // append
				mutatedValueSections.splice(partIndex + 1, 0, variable);
			}

			const part = (mutatedValueSections[finalPartIndex] as string);
			const partWithoutQuery = [
				part.substring(0, offset - 1),
				part.substr(part.length - queryTrailingLength),
			].join('');

			mutatedValueSections[finalPartIndex] = partWithoutQuery;
		} else if (mode === 'inject') {
			const part = (mutatedValueSections[partIndex] as string);
			const pre = part.substring(0, offset - 1);
			const post = part.substr(part.length - queryTrailingLength);

			mutatedValueSections[partIndex] = pre;
			mutatedValueSections.splice(partIndex + 1, 0, variable);
			mutatedValueSections.splice(partIndex + 2, 0, post);
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
		unmanagedStateRef.current.ValueSections = mutatedValueSections;

		closeSelector();

		window.setTimeout(() => {
			reportChange();
			internalPartUpdate();
		}, 100);
	}

	function variableEditSaved(partIndex: number, type: string, item: any) {
		const ValueSections = unmanagedStateRef.current.ValueSections;
		const part = unmanagedStateRef.current.ValueSections[partIndex];

		if (typeof part !== 'object' || part.type !== type) {
			console.error(`Part ordering change mid edit, cannot continue. expected ${type}`);

			return;
		}

		const newParts = [...ValueSections];
		const existingPart = newParts[partIndex] as ValuePart;

		if (typeof existingPart !== 'string') {
			(newParts[partIndex]) = {
				...existingPart,
				payload: item,
			};
		}

		unmanagedStateRef.current.ValueSections = newParts;

		window.setTimeout(() => {
			reportChange();
			internalPartUpdate();
		}, 100);
	}

	function internalPartUpdate() {
		editableRef.current!.innerHTML = renderValueSections(
			unmanagedStateRef.current.ValueSections,
			variableSets,
		);

		// eslint-disable-next-line no-new
		new Promise(() => {
			trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
		});
	}

	function closeSelector() {
		setShowSelector(false);
		setQuery('');

		if (!unmanagedStateRef.current.variableSelectionState)
			return;

		// const { queryStartSelection } = unmanagedStateRef.current.variableSelectionState;

		// if (editableRef.current) {
		// 	const node = editableRef.current.childNodes[queryStartSelection.partIndex];

		// 	if (node && node.nodeName === 'SPAN') {
		// 		const span = node as HTMLSpanElement;

		// 		console.log('span', span.innerText);
		// 		console.log('queryStartSelection.offset', queryStartSelection.offset);
		// 		console.log('queryStartSelection.partIndex', queryStartSelection.partIndex);

		// 		span.innerText = span.innerText.substring(0, queryStartSelection.offset);
		// 	}
		// }

		unmanagedStateRef.current.variableSelectionState = void 0;
	}

	return (
		<Wrapper>
			<UnmanagedInput innerRef={editableRef} />
			{placeholder && (
				<Placeholder
					ref={placeholderRef}
					$shown={unmanagedStateRef.current.ValueSections.length === 0}
				>
					{placeholder}
				</Placeholder>
			)}
			{showSelector && editableRef && (
				<VariableSelector
					requestId={props.requestId}
					editableElement={editableRef.current!}
					sel={unmanagedStateRef.current.lastSelectionPosition!}
					query={query}
					onDone={insertVariable}
					onClose={closeSelector}
				/>
			)}
			{editableRef.current && (
				<VariableEditor
					requestId={props.requestId}
					editable={editableRef.current}
					onSave={variableEditSaved}
				/>
			)}
		</Wrapper>
	);
});

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
