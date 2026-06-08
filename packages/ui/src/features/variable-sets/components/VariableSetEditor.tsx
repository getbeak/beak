import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import { useAppSelector } from '@beak/ui/store/redux';
import { duplicateItem, insertNewItem, moveItem, removeItem } from '@beak/ui/store/variable-sets/actions';
import { Box, Button, chakra, Flex, IconButton, Stack } from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers, Plus, Search, Variable as VariableIcon, X } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import EmptyState from './molecules/EmptyState';
import EnvChipBar from './molecules/EnvChipBar';
import SaveIndicator from './molecules/SaveIndicator';
import VariableCard, { VS_CARD_ATTR } from './molecules/VariableCard';

interface VariableSetEditorProps {
	variableSetName: string;
}

const MotionDiv = motion.create(chakra('div'));

const VariableSetEditor: React.FC<React.PropsWithChildren<VariableSetEditorProps>> = ({ variableSetName }) => {
	const dispatch = useDispatch();
	const variableSet = useAppSelector(s => s.global.variableSets.variableSets[variableSetName]);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const [query, setQuery] = React.useState('');
	const newItemRef = React.useRef<HTMLInputElement>(null);
	const searchRef = React.useRef<HTMLInputElement>(null);
	const containerRef = React.useRef<HTMLDivElement>(null);
	const lastItemCountRef = React.useRef<number>(0);

	const setKeys = variableSet ? TypedObject.keys(variableSet.sets) : [];
	const itemKeys = variableSet ? TypedObject.keys(variableSet.items) : [];
	const activeSetId = selectedSets[variableSetName] ?? setKeys[0];

	const trimmedQuery = query.trim().toLowerCase();
	const filteredItemKeys = !trimmedQuery
		? itemKeys
		: itemKeys.filter(k => (variableSet?.items[k] ?? '').toLowerCase().includes(trimmedQuery));

	React.useEffect(() => {
		if (!variableSet) return;
		if (itemKeys.length > lastItemCountRef.current && newItemRef.current) {
			newItemRef.current.focus();
			newItemRef.current.select();
		}
		lastItemCountRef.current = itemKeys.length;
	}, [itemKeys.length, variableSet]);

	React.useEffect(() => {
		if (!containerRef.current) return;
		const container = containerRef.current;

		function isTypingTarget(el: Element | null): boolean {
			if (!el) return false;
			const tag = el.tagName.toLowerCase();
			if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
			return (el as HTMLElement).isContentEditable;
		}

		function focusedItemId(): string | null {
			const active = document.activeElement;
			if (!active || !container.contains(active)) return null;
			const card = active.closest(`[${VS_CARD_ATTR}]`);
			return card?.getAttribute(VS_CARD_ATTR) ?? null;
		}

		function onKey(e: KeyboardEvent) {
			const meta = e.metaKey || e.ctrlKey;

			if (meta && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				searchRef.current?.focus();
				searchRef.current?.select();
				return;
			}

			const target = document.activeElement;
			const typing = isTypingTarget(target);
			const itemId = focusedItemId();
			if (!itemId) return;
			const index = itemKeys.indexOf(itemId);
			if (index === -1) return;

			if (meta && !e.shiftKey && e.key.toLowerCase() === 'd') {
				e.preventDefault();
				dispatch(duplicateItem({ id: variableSetName, itemId, newItemId: ksuid.generate('item').toString(), now: Date.now() }));
				return;
			}

			if (e.altKey && e.key === 'ArrowUp') {
				e.preventDefault();
				if (index > 0) dispatch(moveItem({ id: variableSetName, itemId, toIndex: index - 1 }));
				return;
			}

			if (e.altKey && e.key === 'ArrowDown') {
				e.preventDefault();
				if (index < itemKeys.length - 1) {
					dispatch(moveItem({ id: variableSetName, itemId, toIndex: index + 1 }));
				}
				return;
			}

			if (meta && e.key === 'Backspace' && !typing) {
				e.preventDefault();
				dispatch(removeItem({ id: variableSetName, itemId }));
				return;
			}
		}

		container.addEventListener('keydown', onKey);
		return () => container.removeEventListener('keydown', onKey);
	}, [dispatch, itemKeys, variableSetName]);

	if (!variableSet) return null;

	const hasSets = setKeys.length > 0;
	const hasItems = itemKeys.length > 0;
	const hasFilter = trimmedQuery.length > 0;

	return (
		<Flex direction='column' bg='bg.canvas' h='100%' w='100%' ref={containerRef as React.Ref<HTMLDivElement>}>
			<Flex
				align='center'
				gap='2'
				px='3'
				py='2'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
				flex='0 0 auto'
			>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='md'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, transparent)'
					color='accent.pink'
					flex='0 0 auto'
				>
					<Layers size={11} strokeWidth={2.2} />
				</Flex>
				<Box
					fontSize='12px'
					fontWeight='600'
					color='fg.default'
					letterSpacing='-0.005em'
					minW={0}
					overflow='hidden'
					textOverflow='ellipsis'
					whiteSpace='nowrap'
				>
					{variableSetName}
				</Box>
				<Flex align='center' gap='1.5' ml='2' color='fg.subtle' fontSize='10px' fontWeight='600'>
					<MetaPill icon={<VariableIcon size={10} strokeWidth={2.2} />} count={itemKeys.length} label='vars' />
					<MetaPill icon={<Layers size={10} strokeWidth={2.2} />} count={setKeys.length} label='envs' />
				</Flex>

				<Box flex='1 1 auto' />

				<SaveIndicator />
			</Flex>

			{!hasSets && <EmptyState variant='no-sets' variableSet={variableSetName} />}

			{hasSets && (
				<>
					<EnvChipBar variableSetName={variableSetName} />

					{hasItems && <SearchBar ref={searchRef} value={query} onChange={setQuery} />}

					<Box flex='1 1 auto' overflow='auto' px='3' py='3'>
						{!hasItems && <EmptyState variant='no-items' variableSet={variableSetName} />}

						{hasItems && (
							<Stack gap='1.5' maxW='960px' mx='auto'>
								{hasFilter && filteredItemKeys.length === 0 && (
									<Flex align='center' justify='center' py='8' color='fg.subtle' fontSize='12px' gap='2'>
										<Search size={12} strokeWidth={2} />
										{`No variables match "${query}"`}
									</Flex>
								)}

								<AnimatePresence initial={false}>
									{filteredItemKeys.map(itemId => {
										const index = itemKeys.indexOf(itemId);
										return (
											<MotionDiv
												key={itemId}
												layout
												initial={{ opacity: 0, y: -4 }}
												animate={{ opacity: 1, y: 0 }}
												exit={{ opacity: 0, height: 0 }}
												transition={{ duration: 0.16, ease: 'easeOut' }}
											>
												<VariableCard
													variableSetName={variableSetName}
													itemId={itemId}
													index={index}
													totalCount={itemKeys.length}
													activeSetId={activeSetId}
													autoFocusNameRef={index === itemKeys.length - 1 ? newItemRef : undefined}
												/>
											</MotionDiv>
										);
									})}
								</AnimatePresence>

								{!hasFilter && (
									<Flex justify='center' pt='1'>
										<Button
											size='sm'
											variant='ghost'
											gap='1.5'
											color='fg.muted'
											fontSize='12px'
											fontWeight='500'
											borderWidth='1px'
											borderColor='border.subtle'
											borderStyle='dashed'
											borderRadius='md'
											px='3'
											h='28px'
											_hover={{
												borderColor: 'accent.pink',
												color: 'accent.pink',
												bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
											}}
											onClick={() => dispatch(insertNewItem({ id: variableSetName, itemId: ksuid.generate('item').toString(), itemName: '' }))}
										>
											<Plus size={12} strokeWidth={2.2} />
											Add variable
										</Button>
									</Flex>
								)}
							</Stack>
						)}
					</Box>
				</>
			)}
		</Flex>
	);
};

interface SearchBarProps {
	value: string;
	onChange: (v: string) => void;
}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(({ value, onChange }, ref) => (
	<Flex
		align='center'
		gap='2'
		px='3'
		py='1.5'
		borderBottomWidth='1px'
		borderColor='border.subtle'
		bg='bg.surface'
		flex='0 0 auto'
	>
		<Flex
			align='center'
			gap='1.5'
			flex='1 1 auto'
			h='26px'
			px='2'
			borderRadius='sm'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
			transition='border-color .12s ease, background-color .12s ease'
			_focusWithin={{
				borderColor: 'accent.pink',
				bg: 'bg.surface',
			}}
		>
			<Box color='fg.subtle' flex='0 0 auto'>
				<Search size={11} strokeWidth={2} />
			</Box>
			<chakra.input
				ref={ref}
				type='text'
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder='Search variables…'
				flex='1 1 auto'
				bg='transparent'
				border='none'
				outline='none'
				fontSize='12px'
				color='fg.default'
				_placeholder={{ color: 'fg.subtle' }}
			/>
			<Box
				as='span'
				flex='0 0 auto'
				fontSize='9.5px'
				fontWeight='600'
				color='fg.disabled'
				letterSpacing='0.04em'
				display={value ? 'none' : 'inline-block'}
			>
				⌘K
			</Box>
			{value && (
				<IconButton
					aria-label='Clear search'
					size='2xs'
					variant='ghost'
					h='18px'
					w='18px'
					minW='18px'
					color='fg.subtle'
					onClick={() => onChange('')}
				>
					<X size={10} strokeWidth={2.4} />
				</IconButton>
			)}
		</Flex>
	</Flex>
));
SearchBar.displayName = 'SearchBar';

interface MetaPillProps {
	icon: React.ReactNode;
	count: number;
	label: string;
}

const MetaPill: React.FC<MetaPillProps> = ({ icon, count, label }) => (
	<Flex
		align='center'
		gap='1'
		px='1.5'
		py='0.5'
		borderRadius='sm'
		borderWidth='1px'
		borderColor='border.subtle'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
		fontVariantNumeric='tabular-nums'
	>
		{icon}
		<Box as='span'>{count}</Box>
		<Box as='span' color='fg.disabled'>
			{label}
		</Box>
	</Flex>
);

export default VariableSetEditor;
