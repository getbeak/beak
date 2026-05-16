import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import type { Entries } from '@getbeak/types/body-editor-json';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';
import { useContext, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';

import { JsonEditorContext } from '../../contexts/json-editor-context';
import {
	BodyAction,
	BodyFolderCell,
	BodyInputValueCell,
	BodyInputWrapper,
	BodyPrimaryCell,
	BodyToggleCell,
	BodyTypeCell,
} from '../atoms/Cells';
import { Row } from '../atoms/Structure';
import EntryDragHandle from './EntryDragHandle';

/**
 * Does this entry's current value count as "filled in" for the purposes of
 * schema validation? Containers (object / array) and types with intrinsic
 * presence (boolean, null) always count as filled. String / number entries
 * are empty when no parts are present or every part is a literal empty
 * string — variable blobs are treated as filled because they resolve to a
 * value at flight time.
 */
function isEntryValueEmpty(entry: Entries | undefined): boolean {
	if (!entry) return true;
	if (entry.type === 'object' || entry.type === 'array') return false;
	if (entry.type === 'boolean' || entry.type === 'null') return false;
	const parts = entry.value;
	if (!parts || parts.length === 0) return true;
	return parts.every(p => typeof p === 'string' && p.length === 0);
}

export interface EntryRowProps {
	id: string;
	depth: number;
	parentId: string | null;
	canDrag?: boolean;
	folder?: React.ReactNode;
	toggle: React.ReactNode;
	primary: React.ReactNode;
	type: React.ReactNode;
	value: React.ReactNode;
	actions: React.ReactNode;
}

const DRAG_TYPE = 'json-entry';

interface DragItem {
	id: string;
	parentId: string | null;
}

type DropState = 'none' | 'before' | 'after' | 'inside';

/**
 * One JSON-editor row. Mounts the 7-column grid, the drag source, and the
 * drop target. Hit-testing for the drop position uses the vertical mouse
 * position over the row:
 *   - top 25% → 'before'
 *   - bottom 25% → 'after'
 *   - middle 50% on a container → 'inside' (so users can drag an entry into
 *     a sibling object/array without expanding it first)
 *   - middle 50% on a leaf → 'after' (fallback so drops still land somewhere)
 */
const EntryRow: React.FC<EntryRowProps> = ({
	id,
	depth,
	parentId,
	canDrag = false,
	folder,
	toggle,
	primary,
	type,
	value,
	actions,
}) => {
	const dispatch = useDispatch();
	const editorContext = useContext(JsonEditorContext)!;
	const entries = useAppSelector(editorContext.editorSelector);
	const rowRef = useRef<HTMLDivElement | null>(null);

	const isContainer = useMemo(() => {
		const entry = entries[id];
		return entry ? ['array', 'object'].includes(entry.type) : false;
	}, [entries, id]);

	// Block descendants from being valid drop targets — we already reject the
	// move in the reducer, but blocking here gives the user immediate feedback
	// (no drop indicator, default cursor) instead of a silent failure.
	const isDescendant = (dragId: string, candidateId: string): boolean => {
		let cursor: string | null = candidateId;
		while (cursor) {
			if (cursor === dragId) return true;
			cursor = entries[cursor]?.parentId ?? null;
		}
		return false;
	};

	const [{ dragging }, dragRef, dragPreviewRef] = useDrag<DragItem, unknown, { dragging: boolean }>(
		() => ({
			type: DRAG_TYPE,
			item: { id, parentId },
			canDrag: () => canDrag,
			collect: monitor => ({ dragging: monitor.isDragging() }),
		}),
		[id, parentId, canDrag],
	);

	const [{ dropState }, dropRef] = useDrop<DragItem, unknown, { dropState: DropState }>(
		() => ({
			accept: DRAG_TYPE,
			canDrop: item => item.id !== id && !isDescendant(item.id, id),
			collect: monitor => {
				if (!monitor.isOver({ shallow: true }) || !monitor.canDrop()) return { dropState: 'none' as const };
				const offset = monitor.getClientOffset();
				const rect = rowRef.current?.getBoundingClientRect();
				if (!offset || !rect) return { dropState: 'none' as const };
				const ratio = (offset.y - rect.top) / rect.height;
				if (ratio < 0.25) return { dropState: 'before' as const };
				if (ratio > 0.75) return { dropState: 'after' as const };
				return { dropState: isContainer ? ('inside' as const) : ('after' as const) };
			},
			drop: (item, monitor) => {
				if (!monitor.isOver({ shallow: true })) return;
				const offset = monitor.getClientOffset();
				const rect = rowRef.current?.getBoundingClientRect();
				if (!offset || !rect) return;
				const ratio = (offset.y - rect.top) / rect.height;
				const op = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : isContainer ? 'inside' : 'after';
				dispatch(editorContext.moveEntry({ requestId: editorContext.requestId, id: item.id, targetId: id, op }));
			},
		}),
		[id, isContainer, editorContext],
	);

	// Combine drag-preview + drop refs onto the row element. The drag *handle*
	// itself owns the drag-source ref so dragging only initiates when the user
	// grabs the grip — not when they click in a cell.
	const setRowRef = (el: HTMLDivElement | null) => {
		rowRef.current = el;
		dropRef(el);
		dragPreviewRef(el);
	};

	const entry = entries[id];
	const missingRequired =
		!editorContext.schemaMode && entry?.required === true && entry?.enabled !== false && isEntryValueEmpty(entry);

	return (
		<Row
			ref={setRowRef}
			data-entry-id={id}
			data-entry-parent={parentId ?? ''}
			data-entry-depth={depth}
			data-drag-state={dragging ? 'dragging' : undefined}
			data-drop-state={dropState === 'none' ? undefined : dropState}
			data-missing-required={missingRequired ? 'true' : undefined}
			css={{
				'&[data-missing-required="true"]::before': {
					opacity: 1,
					backgroundColor: 'var(--beak-colors-accent-alert)',
				},
			}}
		>
			<BodyFolderCell>{folder ?? null}</BodyFolderCell>
			<BodyToggleCell>{toggle}</BodyToggleCell>
			<BodyPrimaryCell depth={depth}>{primary}</BodyPrimaryCell>
			<BodyTypeCell>{type}</BodyTypeCell>
			<BodyInputValueCell
				css={
					missingRequired
						? {
								display: 'flex',
								alignItems: 'center',
								gap: '0',
							}
						: undefined
				}
			>
				{editorContext.schemaMode ? (
					<Flex direction='column' w='100%'>
						<BodyInputWrapper>
							<DebouncedInput
								type='text'
								placeholder='What is this for?'
								value={entry?.description ?? ''}
								onChange={next =>
									dispatch(
										editorContext.descriptionChange({
											id,
											requestId: editorContext.requestId,
											description: next || null,
										}),
									)
								}
							/>
						</BodyInputWrapper>
						{entry?.type === 'enum' && (
							<BodyInputWrapper>
								<DebouncedInput
									type='text'
									value={(entry.options ?? []).join(', ')}
									placeholder='Comma-separated allowed values (e.g. free, pro, enterprise)'
									onChange={next => {
										const parsed = next
											.split(',')
											.map(s => s.trim())
											.filter(s => s.length > 0);
										dispatch(
											editorContext.optionsChange({
												id,
												requestId: editorContext.requestId,
												options: parsed.length === 0 ? null : parsed,
											}),
										);
									}}
								/>
							</BodyInputWrapper>
						)}
					</Flex>
				) : (
					value
				)}
				{missingRequired && (
					<Box
						flexShrink={0}
						mr='2'
						display='inline-flex'
						alignItems='center'
						color='accent.alert'
						data-tooltip-id='tt-schema-row-description'
						data-tooltip-content='Required by schema but the value is empty'
					>
						<AlertCircle size={12} strokeWidth={2} />
					</Box>
				)}
			</BodyInputValueCell>
			<BodyAction>{actions}</BodyAction>
			<EntryDragHandle id={id} disabled={!canDrag} dragRef={dragRef as unknown as (el: HTMLElement | null) => void} />
		</Row>
	);
};

export default EntryRow;
