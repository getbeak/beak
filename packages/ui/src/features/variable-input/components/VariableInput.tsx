import type { ValuePart, ValueSections } from '@beak/ui/features/variables/values';
import VariableEditor from '@beak/ui/features/variables-editor/components/VariableEditor';
import useForceReRender from '@beak/ui/hooks/use-force-rerender';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { requestFlight } from '@beak/ui/store/flight/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import useVariableContext from '../../variables/hooks/use-variable-context';
import { parseValueSections } from '../../variables/parser';
import renderValueSections from '../../variables/renderer';
import { type NormalizedSelection, normalizeSelection, trySetSelection } from '../utils/browser-selection';
import { detectRelevantCopiedValueSections } from '../utils/copying';
import { parseDomState } from '../utils/dom-state';
import { handlePaste } from '../utils/pasting';
import { sanitiseValueSections } from '../utils/sanitation';
import { determineInsertionMode, type VariableSelectionState } from '../utils/variables';
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
	/**
	 * When true, mask the rendered text with bullets (CSS text-security).
	 * Used for schema `type: 'token'` fields so secrets aren't shown in
	 * plaintext while editing. Keys + values still copy/paste normally —
	 * the masking is purely visual.
	 */
	mask?: boolean;

	onChange: (parts: ValueSections) => void;
	onUrlQueryStringDetection?: () => void;
}

const VariableInput = React.forwardRef<HTMLElement, VariableInputProps>((props, forwardedRef) => {
	const { disabled, requestId, placeholder, parts: incomingParts, onChange, readOnly, mask } = props;
	const dispatch = useDispatch();

	const [latestForceRerender, forceRerender] = useForceReRender();
	const [showSelector, setShowSelector] = useState(() => false);
	const [query, setQuery] = useState('');

	const { variableSets } = useAppSelector(s => s.global.variableSets);

	const context = useVariableContext(props.requestId);
	const editableRef = useRef<HTMLDivElement | null>(null);
	const unmanagedStateRef = useRef<UnmanagedState>({
		lastUpstreamReport: 0,
		ValueSections: incomingParts,
	});

	// Setup ref
	useEffect(() => {
		if (!editableRef.current) return;

		if (forwardedRef && typeof forwardedRef === 'function') forwardedRef(editableRef.current);

		const elem = editableRef.current;

		unmanagedStateRef.current = {
			lastUpstreamReport: 0,
			ValueSections: incomingParts,
		};

		if (readOnly) elem.contentEditable = 'false';

		elem.innerHTML = renderValueSections(unmanagedStateRef.current.ValueSections, variableSets);
	}, [requestId, readOnly, latestForceRerender]);

	// Handlers close over render-time state (showSelector, query, variableSets).
	// Previously the listener `useEffect` listed all of those in its deps so it
	// could pick up fresh closures — which meant we tore down + re-added every
	// DOM listener on every selector toggle and every keystroke that mutated
	// `query`. That rebind can race with the very `input`/`blur` event that
	// triggered the state change. We instead pin the listeners once per
	// requestId and delegate through a ref that always carries the latest
	// closures.
	const handlersRef = useRef({
		handleChange,
		handleKeyDown,
		handleCopy,
		handleBlur,
	});
	handlersRef.current = { handleChange, handleKeyDown, handleCopy, handleBlur };

	useEffect(() => {
		const elem = editableRef.current;

		if (!elem)
			return () => {
				/* */
			};

		const onInput = (e: Event) => handlersRef.current.handleChange(e);
		const onKeyDown = (e: KeyboardEvent) => handlersRef.current.handleKeyDown(e);
		const onCopy = (e: ClipboardEvent) => handlersRef.current.handleCopy(e);
		const onBlur = () => handlersRef.current.handleBlur();

		elem.addEventListener('input', onInput);
		elem.addEventListener('keydown', onKeyDown);
		elem.addEventListener('copy', onCopy);
		elem.addEventListener('blur', onBlur);
		elem.addEventListener('paste', handlePaste);

		return () => {
			elem.removeEventListener('input', onInput);
			elem.removeEventListener('keydown', onKeyDown);
			elem.removeEventListener('copy', onCopy);
			elem.removeEventListener('blur', onBlur);
			elem.removeEventListener('paste', handlePaste);
		};
	}, [requestId]);

	useEffect(() => {
		if (!editableRef.current) return;

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
			if (delta === '{') openSelector();

			return;
		}

		const { variableSelectionState, ValueSections } = unmanagedStateRef.current;

		// Sanity check, but by now the selector will be open
		if (!variableSelectionState) {
			// Ensure the selector is closed if there is no state too
			if (showSelector) closeSelector();

			return;
		}

		// Selector is open, so update query
		const part = ValueSections[variableSelectionState.queryStartSelection.partIndex];

		if (typeof part !== 'string') {
			if (showSelector) closeSelector();

			return;
		}

		const queryWithOpener = part.substring(variableSelectionState.queryStartSelection.offset - 1);
		const query = part.substring(variableSelectionState.queryStartSelection.offset);

		if (queryWithOpener === '') closeSelector();
		else setQuery(query);
	}

	async function handleCopy(event: ClipboardEvent) {
		const { anomalyDetected, valueParts } = parseDomState(editableRef.current, {
			onUrlQueryStringDetection: props.onUrlQueryStringDetection,
			onQueryStringBlur: () => editableRef.current?.blur(),
		});

		if (anomalyDetected || valueParts.length === 0) return;

		const relevantParts = detectRelevantCopiedValueSections(valueParts);

		if (relevantParts === null) return;

		const parsed = await parseValueSections(context, relevantParts);
		const clipboard = await navigator.clipboard.read();
		const html = await clipboard[0].getType('text/html');

		navigator.clipboard.write([
			new ClipboardItem({
				'text/plain': new Blob([parsed], { type: 'text/plain' }),
				'text/html': html,
			}),
		]);

		event.preventDefault();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!['Escape', 'Enter', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;

		event.preventDefault();

		if (event.key === 'Escape') closeSelector();

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
		if (!editableRef.current) return;

		const { anomalyDetected, valueParts } = parseDomState(editableRef.current, {
			onUrlQueryStringDetection: props.onUrlQueryStringDetection,
			onQueryStringBlur: () => editableRef.current?.blur(),
		});
		const { lastSelectionPosition } = unmanagedStateRef.current;

		unmanagedStateRef.current.ValueSections = valueParts;
		unmanagedStateRef.current.lastSelectionPosition = normalizeSelection(lastSelectionPosition);

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

		if (debounceHandler) window.clearTimeout(debounceHandler);

		unmanagedStateRef.current.debounceHandler = window.setTimeout(reportChange, 50);
	}

	function reportChange(ignoreSelectorCheck = false) {
		// Don't report changes upstream while the variable selector is open
		if (showSelector) {
			if (!ignoreSelectorCheck) return;
		}

		const { debounceHandler, lastSelectionPosition, ValueSections } = unmanagedStateRef.current;

		// Make sure we aren't double reporting!
		if (debounceHandler) window.clearTimeout(debounceHandler);

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

		if (typeof part !== 'string') return;

		unmanagedStateRef.current.variableSelectionState = {
			queryStartSelection: normalizeSelection(selection),
			queryTrailingLength: part.length - selection.offset,
		};
	}

	function insertVariable(variable: ValuePart) {
		const { ValueSections, variableSelectionState } = unmanagedStateRef.current;

		if (!variableSelectionState) return;

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
			} else {
				// append
				mutatedValueSections.splice(partIndex + 1, 0, variable);
			}

			const part = mutatedValueSections[finalPartIndex] as string;
			const partWithoutQuery = [part.substring(0, offset - 1), part.substr(part.length - queryTrailingLength)].join('');

			mutatedValueSections[finalPartIndex] = partWithoutQuery;
		} else if (mode === 'inject') {
			const part = mutatedValueSections[partIndex] as string;
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

		// rAF instead of `setTimeout(…, 100)`: we need to wait for React to
		// commit the selector-close render (since the selector portal sits over
		// the editable element), but a 100ms delay is wildly conservative and
		// is the visible source of "the caret disappears for a beat after I
		// pick a variable". rAF lands on the very next paint boundary.
		window.requestAnimationFrame(() => {
			reportChange();
			internalPartUpdate();
		});
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
			newParts[partIndex] = {
				...existingPart,
				payload: item,
			};
		}

		unmanagedStateRef.current.ValueSections = newParts;

		// Same rationale as `insertVariable`: rAF instead of `setTimeout(…, 100)`
		// so the saved-payload re-render appears on the next paint, not a tenth
		// of a second later.
		window.requestAnimationFrame(() => {
			reportChange();
			internalPartUpdate();
		});
	}

	function internalPartUpdate() {
		editableRef.current!.innerHTML = renderValueSections(unmanagedStateRef.current.ValueSections, variableSets);

		// Selection has to wait until after the innerHTML mutation has flushed
		// AND the browser has had a chance to lay out the new nodes — otherwise
		// `setStart` lands on a stale node reference and the caret disappears.
		// A microtask covers the React/DOM stack; a follow-up rAF covers the
		// paint boundary (matters for the chip-just-inserted case).
		queueMicrotask(() => {
			trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
		});
		window.requestAnimationFrame(() => {
			trySetSelection(editableRef.current, unmanagedStateRef.current.lastSelectionPosition);
		});
	}

	function closeSelector() {
		setShowSelector(false);
		setQuery('');

		if (!unmanagedStateRef.current.variableSelectionState) return;

		// const { queryStartSelection } = unmanagedStateRef.current.variableSelectionState;

		unmanagedStateRef.current.variableSelectionState = void 0;
	}

	return (
		<Box position='relative'>
			<UnmanagedInput innerRef={editableRef} placeholder={placeholder} mask={mask} />
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
				<VariableEditor requestId={props.requestId} editable={editableRef.current} onSave={variableEditSaved} />
			)}
		</Box>
	);
});

export default VariableInput;
