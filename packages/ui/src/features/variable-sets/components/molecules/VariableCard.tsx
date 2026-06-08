import { TypedObject } from '@beak/common/helpers/typescript';
import ksuid from '@beak/ksuid';
import { valueParts } from '@beak/state';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { generateValueIdent } from '@beak/ui/services/variable-sets/utils';
import { useAppSelector } from '@beak/ui/store/redux';
import { duplicateItem, moveItem, removeItem, updateItemName, updateValue } from '@beak/ui/store/variable-sets/actions';
import { Box, chakra, Flex, IconButton, Menu, Portal } from '@chakra-ui/react';
import type { VariableSetValue } from '@getbeak/types/variable-sets';
import { ChevronDown, ChevronUp, Copy, Equal, GitCompareArrows, MoreVertical, Share2, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

export const VS_CARD_ATTR = 'data-vs-card-item-id';

interface VariableCardProps {
	variableSetName: string;
	itemId: string;
	index: number;
	totalCount: number;
	activeSetId?: string;
	autoFocusNameRef?: React.Ref<HTMLInputElement>;
}

const VariableCard: React.FC<VariableCardProps> = ({
	variableSetName,
	itemId,
	index,
	totalCount,
	activeSetId,
	autoFocusNameRef,
}) => {
	const dispatch = useDispatch();
	const variableSet = useAppSelector(s => s.global.variableSets.variableSets[variableSetName]);
	const [expanded, setExpanded] = React.useState(false);

	if (!variableSet) return null;

	const itemName = variableSet.items[itemId] ?? '';
	const setKeys = TypedObject.keys(variableSet.sets);
	const hasMultipleEnvs = setKeys.length > 1;
	const activeIdent = activeSetId ? generateValueIdent(activeSetId, itemId) : undefined;
	const activeValue = activeIdent ? variableSet.values[activeIdent] : undefined;
	const otherSetIds = setKeys.filter(k => k !== activeSetId);
	const diffCount = otherSetIds.reduce((n, setId) => {
		const v = variableSet.values[generateValueIdent(setId, itemId)];
		return valuesEqual(activeValue, v) ? n : n + 1;
	}, 0);

	function copyAllValues() {
		const lines: string[] = [];
		for (const setId of setKeys) {
			const value = variableSet.values[generateValueIdent(setId, itemId)];
			lines.push(`${variableSet.sets[setId]}=${flatten(value)}`);
		}
		void navigator.clipboard.writeText(lines.join('\n'));
	}

	function copyActiveToAllEnvs() {
		if (!activeSetId) return;
		const source = variableSet.values[generateValueIdent(activeSetId, itemId)];
		// Asset values aren't broadcast across environments — that would
		// silently overwrite each env's file. Skip the copy when the
		// source is an asset; the user can attach explicitly per env.
		if (!source || isAsset(source)) return;
		const payload = toTextSections(source) ?? [''];
		for (const setId of otherSetIds) {
			dispatch(updateValue({ id: variableSetName, setId, itemId, updated: payload }));
		}
	}

	async function confirmDelete() {
		const result = await ipcDialogService.showMessageBox({
			title: `Remove ${itemName || 'variable'}?`,
			message: `Are you sure you want to remove ${itemName || 'this variable'}?`,
			detail: 'All values across every environment will be lost.',
			type: 'warning',
			buttons: ['Remove', 'Cancel'],
			defaultId: 1,
			cancelId: 1,
		});
		if (result.response === 1) return;
		dispatch(removeItem({ id: variableSetName, itemId }));
	}

	return (
		<Box
			{...{ [VS_CARD_ATTR]: itemId }}
			role='group'
			borderWidth='1px'
			borderColor='border.subtle'
			borderRadius='md'
			bg='bg.surface'
			transition='border-color .12s ease, box-shadow .12s ease'
			_hover={{ borderColor: 'border.default' }}
			_focusWithin={{
				borderColor: 'accent.pink',
				boxShadow: '0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
			}}
		>
			<Box display='grid' gridTemplateColumns='minmax(140px, 200px) minmax(0, 1fr) auto' gap='1.5' p='1.5'>
				<Box minW={0} display='flex' alignItems='center'>
					<DebouncedInput
						type='text'
						value={itemName}
						placeholder='variable_name'
						innerRef={autoFocusNameRef}
						onChange={v => dispatch(updateItemName({ id: variableSetName, itemId, updatedName: v }))}
						style={{
							width: '100%',
							background: 'transparent',
							border: '1px solid transparent',
							borderRadius: '4px',
							color: 'var(--beak-colors-fg-default)',
							caretColor: 'var(--beak-colors-accent-pink)',
							fontSize: '13px',
							fontWeight: 600,
							letterSpacing: '-0.005em',
							padding: '4px 6px',
							outline: 'none',
						}}
					/>
				</Box>

				<Box minW={0} display='flex' alignItems='center'>
					<ValueShell isActive>
						{isAsset(activeValue) ? (
							<Box flex='1 1 auto' fontSize='xs' color='accent.pink' fontFamily='mono' px='2' py='1'>
								{`📎 ${activeValue.filename ?? `sha:${activeValue.ref.sha256.slice(0, 10)}`}`}
							</Box>
						) : (
							<VariableInput
								parts={toTextSections(activeValue) ?? ['']}
								placeholder='empty'
								onChange={parts => {
									if (!activeSetId) return;
									dispatch(updateValue({ id: variableSetName, setId: activeSetId, itemId, updated: parts }));
								}}
							/>
						)}
					</ValueShell>
				</Box>

				<Flex align='center' gap='1' flex='0 0 auto'>
					{hasMultipleEnvs && <DiffPill diffCount={diffCount} expanded={expanded} onClick={() => setExpanded(e => !e)} />}

					<Flex
						align='center'
						gap='0.5'
						opacity={0.45}
						_groupHover={{ opacity: 1 }}
						css={{ '[data-vs-card-item-id]:focus-within &': { opacity: 1 } }}
						transition='opacity .12s ease'
					>
						<RowIcon
							label='Duplicate variable'
							onClick={() =>
								dispatch(
									duplicateItem({ id: variableSetName, itemId, newItemId: ksuid.generate('item').toString(), now: Date.now() }),
								)
							}
							hoverColor='accent.pink'
						>
							<Copy size={12} strokeWidth={2} />
						</RowIcon>
						<RowIcon
							label='Move up'
							disabled={index === 0}
							onClick={() => dispatch(moveItem({ id: variableSetName, itemId, toIndex: index - 1 }))}
						>
							<ChevronUp size={13} strokeWidth={2.2} />
						</RowIcon>
						<RowIcon
							label='Move down'
							disabled={index === totalCount - 1}
							onClick={() => dispatch(moveItem({ id: variableSetName, itemId, toIndex: index + 1 }))}
						>
							<ChevronDown size={13} strokeWidth={2.2} />
						</RowIcon>

						<Menu.Root>
							<Menu.Trigger asChild>
								<IconButton
									aria-label='More'
									title='More actions'
									size='2xs'
									variant='ghost'
									h='22px'
									w='22px'
									minW='22px'
									color='fg.subtle'
									_hover={{
										color: 'fg.default',
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
									}}
								>
									<MoreVertical size={12} strokeWidth={2} />
								</IconButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='220px'>
										<Menu.Item
											value='copy-active-to-all'
											onClick={copyActiveToAllEnvs}
											disabled={!hasMultipleEnvs}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<Share2 size={12} strokeWidth={2} />
											Copy active value to all envs
										</Menu.Item>
										<Menu.Item value='copy-all' onClick={copyAllValues} fontSize='12px' gap='2' borderRadius='sm' py='1.5' px='2'>
											<Copy size={12} strokeWidth={2} />
											Copy all values to clipboard
										</Menu.Item>
										<Menu.Item
											value='duplicate'
											onClick={() =>
												dispatch(
													duplicateItem({
														id: variableSetName,
														itemId,
														newItemId: ksuid.generate('item').toString(),
														now: Date.now(),
													}),
												)
											}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<Copy size={12} strokeWidth={2} />
											Duplicate variable
										</Menu.Item>
										<Menu.Separator />
										<Menu.Item
											value='delete'
											onClick={confirmDelete}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
											color='accent.alert'
											_hover={{
												bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)',
											}}
										>
											<Trash2 size={12} strokeWidth={2} />
											Delete variable
										</Menu.Item>
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.Root>
					</Flex>
				</Flex>
			</Box>

			{expanded && hasMultipleEnvs && otherSetIds.length > 0 && (
				<Box px='1.5' pb='1.5'>
					<Box
						display='grid'
						gridTemplateColumns='minmax(140px, 200px) minmax(0, 1fr) auto'
						gap='1.5'
						borderTopWidth='1px'
						borderColor='border.subtle'
						pt='1.5'
					>
						{otherSetIds.map(setId => {
							const v = variableSet.values[generateValueIdent(setId, itemId)];
							const differs = !valuesEqual(activeValue, v);
							return (
								<React.Fragment key={setId}>
									<Flex align='center' justifyContent='flex-end' pr='2' minW={0} gap='1.5'>
										<Box
											as='span'
											w='5px'
											h='5px'
											borderRadius='full'
											bg={differs ? 'accent.warning' : 'fg.disabled'}
											flex='0 0 auto'
										/>
										<Box
											as='span'
											fontSize='11px'
											fontWeight='600'
											color={differs ? 'fg.muted' : 'fg.subtle'}
											letterSpacing='0.005em'
											overflow='hidden'
											textOverflow='ellipsis'
											whiteSpace='nowrap'
											title={variableSet.sets[setId] || 'unnamed'}
										>
											{variableSet.sets[setId] || 'unnamed'}
										</Box>
									</Flex>
									<Box minW={0}>
										<ValueShell isActive={false}>
											{isAsset(v) ? (
												<Box flex='1 1 auto' fontSize='xs' color='accent.pink' fontFamily='mono' px='2' py='1'>
													{`📎 ${v.filename ?? `sha:${v.ref.sha256.slice(0, 10)}`}`}
												</Box>
											) : (
												<VariableInput
													parts={toTextSections(v) ?? ['']}
													placeholder='empty'
													onChange={parts => dispatch(updateValue({ id: variableSetName, setId, itemId, updated: parts }))}
												/>
											)}
										</ValueShell>
									</Box>
									<Box />
								</React.Fragment>
							);
						})}
					</Box>
				</Box>
			)}
		</Box>
	);
};

interface DiffPillProps {
	diffCount: number;
	expanded: boolean;
	onClick: () => void;
}

const DiffPill: React.FC<DiffPillProps> = ({ diffCount, expanded, onClick }) => {
	const hasDiff = diffCount > 0;
	return (
		<ChakraButton
			type='button'
			onClick={onClick}
			aria-expanded={expanded}
			aria-label={hasDiff ? `${diffCount} environments differ` : 'all environments match'}
			title={hasDiff ? `${diffCount} env${diffCount === 1 ? '' : 's'} differ — click to expand` : 'Same across envs'}
			display='inline-flex'
			alignItems='center'
			gap='1'
			h='22px'
			px='1.5'
			borderRadius='full'
			borderWidth='1px'
			borderColor={hasDiff ? 'color-mix(in srgb, var(--beak-colors-accent-warning) 40%, transparent)' : 'border.subtle'}
			bg={
				hasDiff
					? 'color-mix(in srgb, var(--beak-colors-accent-warning) 12%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-fg-default) 4%, transparent)'
			}
			color={hasDiff ? 'accent.warning' : 'fg.subtle'}
			fontSize='10.5px'
			fontWeight='600'
			fontVariantNumeric='tabular-nums'
			letterSpacing='0.005em'
			cursor='pointer'
			transition='all .12s ease'
			_hover={{
				borderColor: hasDiff ? 'color-mix(in srgb, var(--beak-colors-accent-warning) 70%, transparent)' : 'border.default',
				color: hasDiff ? 'accent.warning' : 'fg.default',
			}}
		>
			{hasDiff ? <GitCompareArrows size={11} strokeWidth={2} /> : <Equal size={11} strokeWidth={2.2} />}
			<Box as='span'>{hasDiff ? `+${diffCount}` : 'same'}</Box>
			{expanded ? <ChevronUp size={10} strokeWidth={2.4} /> : <ChevronDown size={10} strokeWidth={2.4} />}
		</ChakraButton>
	);
};

interface RowIconProps {
	label: string;
	disabled?: boolean;
	onClick: () => void;
	hoverColor?: string;
	children: React.ReactNode;
}

const RowIcon: React.FC<RowIconProps> = ({ label, disabled, onClick, hoverColor, children }) => (
	<IconButton
		aria-label={label}
		title={label}
		size='2xs'
		variant='ghost'
		h='22px'
		w='22px'
		minW='22px'
		color='fg.subtle'
		disabled={disabled}
		onClick={onClick}
		_hover={{
			color: hoverColor ?? 'fg.default',
			bg: hoverColor
				? `color-mix(in srgb, var(--beak-colors-${hoverColor.replace('.', '-')}) 14%, transparent)`
				: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
		}}
	>
		{children}
	</IconButton>
);

interface ValueShellProps {
	isActive: boolean;
	children: React.ReactNode;
}

const ValueShell: React.FC<ValueShellProps> = ({ isActive, children }) => (
	<Box
		w='100%'
		borderRadius='sm'
		bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 5%, transparent)' : 'transparent'}
		transition='background-color .12s ease'
		css={{
			'& > div > article': {
				width: '100%',
				border: '1px solid transparent',
				borderRadius: '4px',
				background: 'transparent',
				padding: '4px 8px',
				margin: '0',
				fontSize: '12px',
				color: 'var(--beak-colors-fg-default)',
				transition: 'background-color .12s ease, border-color .12s ease, box-shadow .12s ease',
			},
			'& > div > article:hover': {
				background: 'color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 45%, transparent)',
			},
			'& > div > article:focus-within': {
				outline: 'none',
				background: 'var(--beak-colors-bg-surface)',
				borderColor: 'var(--beak-colors-accent-pink)',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
			},
		}}
	>
		{children}
	</Box>
);

function valuesEqual(a: VariableSetValue | undefined, b: VariableSetValue | undefined): boolean {
	if (a === b) return true;
	const aSections = toTextSections(a);
	const bSections = toTextSections(b);
	if (valueParts.isEmpty(aSections) && valueParts.isEmpty(bSections)) {
		// Equal if both are absent OR both are non-text (assets compare by ref).
		return !isAsset(a) && !isAsset(b);
	}
	if (isAsset(a) || isAsset(b)) {
		if (!isAsset(a) || !isAsset(b)) return false;
		return a.ref.sha256 === b.ref.sha256;
	}
	return JSON.stringify(aSections) === JSON.stringify(bSections);
}

function flatten(value: VariableSetValue | undefined): string {
	if (!value) return '';
	if (isAsset(value)) return `[file ${value.filename ?? value.ref.sha256.slice(0, 10)}]`;
	const sections = toTextSections(value);
	if (!sections) return '';
	return valueParts.flatten(sections, p => `\${${p.type}}`);
}

/** Normalise a {@link VariableSetValue} to its text-typed `ValueSections`, or `undefined` for asset values. */
function toTextSections(value: VariableSetValue | undefined): ValueSections | undefined {
	if (!value) return undefined;
	if (Array.isArray(value)) return value;
	if (value.kind === 'text') return value.value;
	return undefined;
}

function isAsset(value: VariableSetValue | undefined): value is Extract<VariableSetValue, { kind: 'asset' }> {
	return Boolean(value && !Array.isArray(value) && value.kind === 'asset');
}

export default VariableCard;
