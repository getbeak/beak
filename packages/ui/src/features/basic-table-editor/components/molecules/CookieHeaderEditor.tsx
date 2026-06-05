import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, chakra } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
	type CookieHeaderPair,
	isPlainStringValue,
	parseCookieHeader,
	serialiseCookieHeader,
	valueSectionsToPlainString,
} from '../../cookie-header';
import { BodyAction, BodyInputValueCell, BodyInputWrapper, BodyPrimaryCell } from '../atoms/Cells';
import { Row } from '../atoms/Structure';

interface CookieHeaderEditorProps {
	value: ValueSections;
	readOnly?: boolean;
	onChange: (next: ValueSections) => void;
}

/**
 * Inline sub-editor that opens under a header row whose name is
 * `Cookie`. Renders each `name=value` pair as a child row that re-uses
 * the parent table's column grid — same inputs, same focus underline,
 * same hover behaviour — so the panel reads as a continuation of the
 * header table rather than a separately-styled island.
 *
 * Cookie values composed of variable references aren't round-trippable
 * through a string-level parser, so for those we collapse to a small
 * note and let the user keep editing through the value cell above.
 */
const MotionPanel = motion.create(
	chakra('div', {
		base: {
			gridColumn: '1 / -1',
			borderBottomWidth: '1px',
			borderColor: 'border.subtle',
			overflow: 'hidden',
			bg: 'bg.canvas',
		},
	}),
);

const MotionRow = motion.create(Row);

const ChakraButton = chakra('button');

const CookieHeaderEditor: React.FC<CookieHeaderEditorProps> = ({ value, readOnly, onChange }) => {
	const plain = useMemo(() => isPlainStringValue(value), [value]);
	const text = useMemo(() => valueSectionsToPlainString(value), [value]);
	// The parsed view is derived from the serialised header — empty-named
	// pairs never round-trip (they'd be ambiguous in `name=value; ...`
	// notation), so we layer a local draft on top for in-flight rows the
	// user is still typing into.
	const parsed = useMemo(() => parseCookieHeader(text), [text]);
	const [draftEmptyCount, setDraftEmptyCount] = useState(0);
	const lastTextRef = useRef(text);

	useEffect(() => {
		// External edits to the value cell wipe local drafts — the user
		// switched contexts, the empty placeholders no longer apply.
		if (lastTextRef.current !== text) {
			lastTextRef.current = text;
			setDraftEmptyCount(0);
		}
	}, [text]);

	const pairs = useMemo(() => {
		if (draftEmptyCount === 0) return parsed;
		const drafts = Array.from({ length: draftEmptyCount }, () => ({ name: '', value: '' }));
		return [...parsed, ...drafts];
	}, [parsed, draftEmptyCount]);

	function commit(next: CookieHeaderPair[]) {
		const namedCount = next.filter(p => p.name.length > 0).length;
		setDraftEmptyCount(next.length - namedCount);
		const serialised = serialiseCookieHeader(next);
		lastTextRef.current = serialised;
		onChange([serialised]);
	}

	function updatePair(index: number, patch: Partial<CookieHeaderPair>) {
		commit(pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
	}

	function addPair() {
		commit([...pairs, { name: '', value: '' }]);
	}

	function removePair(index: number) {
		commit(pairs.filter((_, i) => i !== index));
	}

	return (
		<MotionPanel
			key='cookie-panel'
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: 'auto', opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.16, ease: 'easeOut' }}
		>
			{!plain && (
				<Box px='3' py='2' fontSize='11px' color='fg.subtle' lineHeight='1.4'>
					<Box as='strong' color='fg.muted' fontWeight='600' mr='1'>
						{'Variable cookie:'}
					</Box>
					{
						'this Cookie header references a variable — structured editing is paused so your reference stays intact. Edit the value cell above to make changes.'
					}
				</Box>
			)}

			{plain && (
				<Box>
					<AnimatePresence initial={false}>
						{pairs.map((pair, idx) => (
							<MotionRow
								key={`pair-${idx}`}
								layout
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.14, ease: 'easeOut' }}
								data-cookie-pair='true'
							>
								<Box />
								<Box display='flex' alignItems='center' justifyContent='center' color='fg.subtle' fontSize='10px'>
									{idx + 1}
								</Box>
								<BodyPrimaryCell>
									<BodyInputWrapper>
										<DebouncedInput
											type='text'
											value={pair.name}
											disabled={readOnly}
											placeholder='cookie name'
											onChange={v => updatePair(idx, { name: v })}
										/>
									</BodyInputWrapper>
								</BodyPrimaryCell>
								<BodyInputValueCell>
									<BodyInputWrapper>
										<DebouncedInput
											type='text'
											value={pair.value}
											disabled={readOnly}
											placeholder='value'
											onChange={v => updatePair(idx, { value: v })}
										/>
									</BodyInputWrapper>
								</BodyInputValueCell>
								<BodyAction>
									{!readOnly && (
										<ChakraButton
											type='button'
											aria-label='Remove cookie'
											title='Remove this cookie pair'
											onClick={() => removePair(idx)}
											display='inline-flex'
											alignItems='center'
											justifyContent='center'
											w='18px'
											h='18px'
											border='none'
											bg='transparent'
											color='fg.subtle'
											cursor='pointer'
											borderRadius='sm'
											transition='color .12s ease, background-color .12s ease'
											_hover={{
												color: 'accent.alert',
												bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)',
											}}
										>
											<X size={11} strokeWidth={2.2} />
										</ChakraButton>
									)}
								</BodyAction>
							</MotionRow>
						))}
					</AnimatePresence>

					{!readOnly && <AddPairRow onAdd={addPair} empty={pairs.length === 0} />}
				</Box>
			)}
		</MotionPanel>
	);
};

/**
 * Mirrors `TrailingGhostRow` from the parent table — a clickable
 * full-width row whose chrome reads as the next-line affordance, so
 * adding a pair feels like adding a regular table row rather than
 * pressing a separate button.
 */
const AddPairRow: React.FC<{ onAdd: () => void; empty: boolean }> = ({ onAdd, empty }) => (
	<Row
		role='button'
		tabIndex={0}
		aria-label={empty ? 'Add the first cookie' : 'Add cookie'}
		data-empty='true'
		onClick={onAdd}
		onKeyDown={event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				onAdd();
			}
		}}
		css={{
			cursor: 'pointer',
			borderBottomStyle: 'dashed',
			color: 'var(--beak-colors-fg-subtle)',
			transition: 'background-color .12s ease, color .12s ease, border-color .12s ease',
			'&:hover': {
				backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 6%, transparent)',
				color: 'var(--beak-colors-accent-pink)',
				borderBottomColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 36%, transparent)',
			},
			'&:focus-visible': {
				outline: 'none',
				backgroundColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
				color: 'var(--beak-colors-accent-pink)',
				boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)',
			},
			'&::before': { display: 'none' },
		}}
	>
		<Box
			gridColumn='3 / -1'
			display='inline-flex'
			alignItems='center'
			gap='1.5'
			h='100%'
			pl='10px'
			fontSize='12px'
			fontWeight='500'
			letterSpacing='0.005em'
		>
			<Plus size={11} strokeWidth={2.2} />
			<Box as='span'>{empty ? 'Add your first cookie' : 'Add cookie'}</Box>
		</Box>
	</Row>
);

export default CookieHeaderEditor;
