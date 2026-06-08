import VariableSelector from '@beak/ui/features/variable-input/components/molecules/VariableSelector';
import type { ValuePart } from '@beak/ui/features/variables/values';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	$createTextNode,
	$getSelection,
	$isRangeSelection,
	$isTextNode,
	COMMAND_PRIORITY_LOW,
	KEY_ESCAPE_COMMAND,
} from 'lexical';
import React, { useCallback, useEffect, useState } from 'react';

import { $createVariableChipNode } from '../nodes/VariableChipNode';

interface TriggerState {
	anchorRect: { top: number; left: number; width: number; height: number };
	query: string;
}

interface VariableTriggerPluginProps {
	requestId?: string;
}

const VariableTriggerPlugin: React.FC<VariableTriggerPluginProps> = ({ requestId }) => {
	const [editor] = useLexicalComposerContext();
	const [trigger, setTrigger] = useState<TriggerState | null>(null);

	const close = useCallback(() => setTrigger(null), []);

	useEffect(() => {
		// Listen for *all* selection updates after a text mutation. If the caret
		// is sitting inside a `{<query>` run with no whitespace, the selector is
		// open. The moment the user kills the `{` or types whitespace, it closes.
		// Mirrors the legacy "openSelector on '{', then track query" behaviour
		// but reads off the canonical editor state instead of a side channel.
		return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
			if (dirtyElements.size === 0 && dirtyLeaves.size === 0 && trigger === null) return;

			editorState.read(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
					if (trigger) setTrigger(null);
					return;
				}

				const anchorNode = selection.anchor.getNode();
				const offset = selection.anchor.offset;

				if (!$isTextNode(anchorNode)) {
					if (trigger) setTrigger(null);
					return;
				}

				const text = anchorNode.getTextContent();
				const before = text.slice(0, offset);
				const openIdx = before.lastIndexOf('{');

				if (openIdx < 0) {
					if (trigger) setTrigger(null);
					return;
				}

				const querySegment = before.slice(openIdx + 1);
				if (/\s/.test(querySegment)) {
					if (trigger) setTrigger(null);
					return;
				}

				const domSelection = window.getSelection();
				if (!domSelection || domSelection.rangeCount === 0) return;
				const range = domSelection.getRangeAt(0).cloneRange();
				const rect = range.getBoundingClientRect();
				const anchorRect = {
					top: rect.top,
					left: rect.left,
					width: rect.width || 1,
					height: rect.height || 16,
				};

				setTrigger(prev => {
					if (prev && prev.query === querySegment && prev.anchorRect.left === anchorRect.left) return prev;
					return { anchorRect, query: querySegment };
				});
			});
		});
	}, [editor, trigger]);

	useEffect(() => {
		if (!trigger) return;
		return editor.registerCommand(
			KEY_ESCAPE_COMMAND,
			() => {
				close();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, trigger, close]);

	const onDone = useCallback(
		(value: ValuePart) => {
			if (typeof value !== 'object' || value === null) {
				close();
				return;
			}

			editor.update(() => {
				const selection = $getSelection();
				if (!$isRangeSelection(selection) || !selection.isCollapsed()) return;

				const anchorNode = selection.anchor.getNode();
				if (!$isTextNode(anchorNode)) return;

				const offset = selection.anchor.offset;
				const text = anchorNode.getTextContent();
				const before = text.slice(0, offset);
				const openIdx = before.lastIndexOf('{');
				if (openIdx < 0) return;

				const after = text.slice(offset);
				const newPrefix = text.slice(0, openIdx);

				anchorNode.setTextContent(newPrefix);

				const chip = $createVariableChipNode(value.type, value.payload);
				anchorNode.insertAfter(chip);

				if (after.length > 0) {
					const tail = $createTextNode(after);
					chip.insertAfter(tail);
					tail.select(0, 0);
				} else {
					chip.selectNext();
				}
			});

			close();
		},
		[editor, close],
	);

	if (!trigger) return null;

	const rootElement = editor.getRootElement();
	if (!rootElement) return null;

	return (
		<VariableSelector
			requestId={requestId}
			editableElement={rootElement as HTMLDivElement}
			sel={{ partIndex: 0, offset: 0, isTextNode: false }}
			query={trigger.query}
			anchorRect={trigger.anchorRect}
			onClose={close}
			onDone={onDone}
		/>
	);
};

export default VariableTriggerPlugin;
