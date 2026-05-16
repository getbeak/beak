import { TypedObject } from '@beak/common/helpers/typescript';
import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import { ipcDialogService } from '@beak/ui/lib/ipc';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import {
	duplicateGroup,
	insertNewGroup,
	moveGroup,
	removeGroup,
	updateGroupName,
} from '@beak/ui/store/variable-sets/actions';
import { Box, chakra, Flex, IconButton, Menu, Portal } from '@chakra-ui/react';
import { ChevronLeft, ChevronRight, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

interface EnvChipBarProps {
	variableSetName: string;
}

const EnvChipBar: React.FC<EnvChipBarProps> = ({ variableSetName }) => {
	const dispatch = useDispatch();
	const variableSet = useAppSelector(s => s.global.variableSets.variableSets[variableSetName]);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const [renamingId, setRenamingId] = React.useState<string | undefined>();

	if (!variableSet) return null;

	const setKeys = TypedObject.keys(variableSet.sets);
	const activeSetId = selectedSets[variableSetName] ?? setKeys[0];

	function selectEnv(setId: string) {
		dispatch(editorPreferencesSetSelectedVariableGroup({ variableSet: variableSetName, setId }));
	}

	return (
		<Flex
			align='center'
			gap='1.5'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			flex='0 0 auto'
			overflowX='auto'
			css={{
				scrollbarWidth: 'thin',
				'&::-webkit-scrollbar': { height: '4px' },
				'&::-webkit-scrollbar-thumb': {
					background: 'color-mix(in srgb, var(--beak-colors-fg-default) 14%, transparent)',
					borderRadius: '2px',
				},
			}}
		>
			<Box
				as='span'
				fontSize='10px'
				fontWeight='700'
				color='fg.subtle'
				textTransform='uppercase'
				letterSpacing='0.06em'
				mr='1'
				flex='0 0 auto'
			>
				Envs
			</Box>

			{setKeys.map((setId, index) => {
				const isActive = setId === activeSetId;
				const isRenaming = renamingId === setId;
				const name = variableSet.sets[setId];

				return (
					<Flex
						key={setId}
						align='center'
						gap='1'
						pl='2'
						pr='1'
						h='24px'
						borderRadius='full'
						borderWidth='1px'
						borderColor={isActive ? 'accent.pink' : 'border.subtle'}
						bg={
							isActive
								? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
								: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
						}
						color={isActive ? 'accent.pink' : 'fg.muted'}
						transition='all .12s ease'
						_hover={!isActive ? { borderColor: 'border.default', color: 'fg.default' } : undefined}
						flex='0 0 auto'
					>
						<Box
							as='span'
							w='6px'
							h='6px'
							borderRadius='full'
							bg={isActive ? 'accent.pink' : 'fg.disabled'}
							boxShadow={isActive ? '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)' : 'none'}
							flex='0 0 auto'
						/>

						{isRenaming ? (
							<DebouncedInput
								type='text'
								value={name}
								onChange={v => dispatch(updateGroupName({ id: variableSetName, setId, updatedName: v }))}
								autoFocus
								onBlur={() => setRenamingId(undefined)}
								onKeyDown={e => {
									if (e.key === 'Enter' || e.key === 'Escape') setRenamingId(undefined);
								}}
								style={{
									background: 'transparent',
									border: 'none',
									outline: 'none',
									color: 'inherit',
									fontSize: '12px',
									fontWeight: 600,
									width: `${Math.max(6, name.length + 1)}ch`,
									padding: 0,
								}}
							/>
						) : (
							<ChakraButton
								type='button'
								onClick={() => selectEnv(setId)}
								onDoubleClick={() => setRenamingId(setId)}
								px='1'
								h='100%'
								bg='transparent'
								color='inherit'
								fontSize='12px'
								fontWeight={isActive ? '700' : '500'}
								letterSpacing='-0.005em'
								cursor='pointer'
								title={`Activate ${name || 'unnamed'} (double-click to rename)`}
								maxW='220px'
								overflow='hidden'
								textOverflow='ellipsis'
								whiteSpace='nowrap'
								flex='0 1 auto'
							>
								{name || 'unnamed'}
							</ChakraButton>
						)}

						<Menu.Root>
							<Menu.Trigger asChild>
								<IconButton
									aria-label={`More for ${name || 'env'}`}
									size='2xs'
									variant='ghost'
									color='currentColor'
									h='16px'
									w='16px'
									minW='16px'
									borderRadius='full'
									opacity={0.7}
									_hover={{ opacity: 1, bg: 'color-mix(in srgb, currentColor 12%, transparent)' }}
								>
									<MoreHorizontal size={11} strokeWidth={2} />
								</IconButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content
										bg='bg.surface.emphasized'
										borderWidth='1px'
										borderColor='border.default'
										borderRadius='md'
										boxShadow='0 8px 24px rgba(0,0,0,0.28)'
										p='1'
										minW='180px'
									>
										<Menu.Item
											value='rename'
											onClick={() => setRenamingId(setId)}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<Pencil size={12} strokeWidth={2} />
											Rename
										</Menu.Item>
										<Menu.Item
											value='duplicate'
											onClick={() => dispatch(duplicateGroup({ id: variableSetName, setId }))}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<Copy size={12} strokeWidth={2} />
											Duplicate
										</Menu.Item>
										<Menu.Item
											value='move-left'
											disabled={index === 0}
											onClick={() => dispatch(moveGroup({ id: variableSetName, setId, toIndex: index - 1 }))}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<ChevronLeft size={12} strokeWidth={2} />
											Move left
										</Menu.Item>
										<Menu.Item
											value='move-right'
											disabled={index === setKeys.length - 1}
											onClick={() => dispatch(moveGroup({ id: variableSetName, setId, toIndex: index + 1 }))}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
										>
											<ChevronRight size={12} strokeWidth={2} />
											Move right
										</Menu.Item>
										<Menu.Separator />
										<Menu.Item
											value='delete'
											onClick={async () => {
												const result = await ipcDialogService.showMessageBox({
													title: `Remove ${name || 'env'}?`,
													message: `Are you sure you want to remove ${name || 'this env'}?`,
													detail: 'All values for this environment will be lost.',
													type: 'warning',
													buttons: ['Remove', 'Cancel'],
													defaultId: 1,
													cancelId: 1,
												});
												if (result.response === 1) return;
												dispatch(removeGroup({ id: variableSetName, setId }));
											}}
											fontSize='12px'
											gap='2'
											borderRadius='sm'
											py='1.5'
											px='2'
											color='accent.alert'
											_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)' }}
										>
											<Trash2 size={12} strokeWidth={2} />
											Delete environment
										</Menu.Item>
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.Root>
					</Flex>
				);
			})}

			<IconButton
				aria-label='Add environment'
				title='Add environment'
				size='xs'
				variant='ghost'
				h='24px'
				w='24px'
				minW='24px'
				borderRadius='full'
				borderWidth='1px'
				borderColor='border.subtle'
				borderStyle='dashed'
				color='fg.muted'
				_hover={{
					borderColor: 'accent.pink',
					color: 'accent.pink',
					bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
				}}
				onClick={() => dispatch(insertNewGroup({ id: variableSetName, setName: '' }))}
				flex='0 0 auto'
			>
				<Plus size={12} strokeWidth={2.2} />
			</IconButton>
		</Flex>
	);
};

export default EnvChipBar;
