import { entryMap, valueParts } from '@beak/state';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import TagListInput from '@beak/ui/components/molecules/TagListInput';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { Entries } from '@getbeak/types/body-editor-json';
import { ShieldCheck, ShieldOff } from 'lucide-react';
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
	return entryMap.isEntryValueEmpty(entry, valueParts.isEmpty);
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

const ChakraButton = chakra('button');

/**
 * Schema-mode "Required" pill. Lives at the head of the description cell
 * so the schema-side affordances (required + description + options) cluster
 * together — the row's value toggle stays bound to `enabled` regardless of
 * mode so users never have one control mean two different things.
 */
const RequiredPill: React.FC<{ required: boolean; onChange: (next: boolean) => void }> = ({ required, onChange }) => (
	<ChakraButton
		type='button'
		aria-pressed={required}
		aria-label={required ? 'Required field — click to mark optional' : 'Optional field — click to mark required'}
		title={required ? 'Required field — click to mark optional' : 'Optional field — click to mark required'}
		onClick={() => onChange(!required)}
		display='inline-flex'
		alignItems='center'
		gap='1'
		h='22px'
		px='2'
		flexShrink={0}
		borderRadius='full'
		borderWidth='1px'
		borderColor={required ? 'accent.indigo' : 'border.subtle'}
		bg={required ? 'color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)' : 'transparent'}
		color={required ? 'accent.indigo' : 'fg.subtle'}
		fontSize='11px'
		fontWeight='500'
		cursor='pointer'
		transition='color .12s ease, background-color .12s ease, border-color .12s ease'
		_hover={{ color: required ? 'accent.indigo' : 'fg.default' }}
		_focusVisible={{
			outline: 'none',
			boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-indigo) 30%, transparent)',
		}}
	>
		{required ? <ShieldCheck size={11} strokeWidth={2} /> : <ShieldOff size={11} strokeWidth={1.6} />}
		<Box as='span'>{required ? 'Required' : 'Optional'}</Box>
	</ChakraButton>
);

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

	// `valuesOnly` locks the schema — disable dragging regardless of what the
	// per-entry `canDrag` prop says, so users can't reorder fields that belong
	// to the linked request's contract.
	const dragAllowed = canDrag && !editorContext.valuesOnly;

	const [{ dragging }, dragRef, dragPreviewRef] = useDrag<DragItem, unknown, { dragging: boolean }>(
		() => ({
			type: DRAG_TYPE,
			item: { id, parentId },
			canDrag: () => dragAllowed,
			collect: monitor => ({ dragging: monitor.isDragging() }),
		}),
		[id, parentId, dragAllowed],
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
	// Empty-name rows aren't sent (the prepare-request layer drops them), and
	// without a name there's nowhere to type — so we mirror BasicTableEditor's
	// empty-key warning here: amber row wash + amber strip on the left edge.
	// missingRequired wins for the strip when both apply (it's the harder
	// error — value is missing too).
	const namedEntry = entry as { name?: string } | undefined;
	const emptyKey =
		entry !== undefined &&
		entry.parentId !== null &&
		namedEntry?.name !== undefined &&
		namedEntry.name.trim().length === 0 &&
		entry.enabled !== false;

	return (
		<Row
			ref={setRowRef}
			data-entry-id={id}
			data-entry-parent={parentId ?? ''}
			data-entry-depth={depth}
			data-drag-state={dragging ? 'dragging' : undefined}
			data-drop-state={dropState === 'none' ? undefined : dropState}
			data-missing-required={missingRequired ? 'true' : undefined}
			data-empty-key={emptyKey ? 'true' : undefined}
			data-values-only={editorContext.valuesOnly ? 'true' : undefined}
			css={{
				// missingRequired = required && enabled && value empty. The
				// asterisk on the key cell already says *why*; the left strip
				// gives at-a-glance scannability across long tables. No cell
				// wash — that read as an error state and made the row look
				// alarming rather than actionable.
				'&[data-missing-required="true"]::before': {
					opacity: 1,
					backgroundColor: 'var(--beak-colors-accent-alert)',
				},
				'&[data-empty-key="true"]': {
					backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-warning) 8%, transparent)',
				},
				'&[data-empty-key="true"]::before': {
					opacity: 1,
					backgroundColor: 'var(--beak-colors-accent-warning)',
				},
				// Missing-required wins for the left strip when both apply.
				'&[data-empty-key="true"][data-missing-required="true"]::before': {
					backgroundColor: 'var(--beak-colors-accent-alert)',
				},
			}}
		>
			<BodyFolderCell>{folder ?? null}</BodyFolderCell>
			<BodyToggleCell>{toggle}</BodyToggleCell>
			<BodyPrimaryCell depth={depth}>{primary}</BodyPrimaryCell>
			<BodyTypeCell>{type}</BodyTypeCell>
			<BodyInputValueCell>
				{editorContext.schemaMode ? (
					<Flex direction='column' w='100%' gap='1'>
						<Flex align='center' gap='1.5'>
							<RequiredPill
								required={entry?.required === true}
								onChange={next =>
									dispatch(
										editorContext.requiredChange({
											id,
											requestId: editorContext.requestId,
											required: next ? true : null,
										}),
									)
								}
							/>
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
						</Flex>
						{entry?.type === 'enum' && (
							<Box px='1'>
								<TagListInput
									value={entry.options ?? []}
									placeholder='Type a value and press Enter (e.g. free)'
									noun='option'
									onChange={next =>
										dispatch(
											editorContext.optionsChange({
												id,
												requestId: editorContext.requestId,
												options: next.length === 0 ? null : next,
											}),
										)
									}
								/>
							</Box>
						)}
					</Flex>
				) : (
					value
				)}
			</BodyInputValueCell>
			{editorContext.valuesOnly ? (
				<DescriptionCell description={entry?.description} />
			) : (
				<BodyAction>{actions}</BodyAction>
			)}
			<EntryDragHandle id={id} disabled={!dragAllowed} dragRef={dragRef as unknown as (el: HTMLElement | null) => void} />
		</Row>
	);
};

/**
 * `valuesOnly` description column — surfaces the field's schema description
 * as actual table content in the slot freed up by hiding the add/remove
 * action button. Single-line, truncated with a `title` for the full text
 * on hover. Empty when no description is set.
 */
const DescriptionCell: React.FC<{ description?: string }> = ({ description }) => (
	<Box
		display='flex'
		alignItems='center'
		minW={0}
		px='2'
		fontSize='11px'
		color={description ? 'fg.subtle' : 'fg.disabled'}
		fontStyle={description ? undefined : 'italic'}
		title={description ?? undefined}
		whiteSpace='nowrap'
		overflow='hidden'
		textOverflow='ellipsis'
	>
		{description ?? ''}
	</Box>
);

export default EntryRow;
