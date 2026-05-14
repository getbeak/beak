import { TypedObject } from '@beak/common/helpers/typescript';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Grid, Menu, Portal } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import NoVariableSets from '../molecules/NoVariableSets';
import VariableSetName from '../molecules/VariableSetName';

const ChakraButton = chakra('button');

const VariableSets: React.FC = () => {
	const dispatch = useDispatch();
	const { variableSets } = useAppSelector(s => s.global.variableSets)!;
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const empty = Object.keys(variableSets).length === 0;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (empty) {
		return (
			<Box px='1.5' py='1' pr='0' pb='0'>
				<NoVariableSets />
			</Box>
		);
	}

	return (
		<Box px='1.5' py='1' pr='0' pb='0'>
			{TypedObject.keys(variableSets!).map(k => {
				const sets = variableSets![k].sets;
				const setKeys = TypedObject.keys(sets);
				const value = selectedSets[k];
				const activeLabel = (value && sets[value]) || (setKeys[0] && sets[setKeys[0]]) || '—';

				return (
					<Grid
						key={k}
						templateColumns='minmax(10px, max-content) minmax(10px, 1fr)'
						justifyContent='space-between'
						alignItems='center'
						gap='1.5'
						my='1'
						maxW='calc(100% - 3px)'
						_first={{ mt: '0' }}
						_notLast={{ mb: '1.5' }}
					>
						<VariableSetName variableSetName={k} />
						<Menu.Root>
							<Menu.Trigger asChild>
								<ChakraButton
									type='button'
									aria-label={`Active set for ${k}`}
									display='inline-flex'
									alignItems='center'
									justifyContent='flex-end'
									gap='1'
									h='22px'
									px='1.5'
									minW={0}
									maxW='100%'
									ml='auto'
									borderRadius='sm'
									borderWidth='1px'
									borderColor='transparent'
									bg='transparent'
									color='fg.default'
									fontSize='11px'
									fontWeight='600'
									fontVariantNumeric='tabular-nums'
									cursor='pointer'
									transition='border-color .12s ease, background-color .12s ease, color .12s ease'
									_hover={{
										borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 28%, var(--beak-colors-border-subtle))',
										bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
										color: 'accent.pink',
									}}
									_focusVisible={{
										outline: 'none',
										borderColor: 'accent.pink',
										boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
									}}
								>
									<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap' title={activeLabel}>
										{activeLabel}
									</Box>
									<ChevronDown size={10} strokeWidth={2.2} style={{ flex: '0 0 auto', opacity: 0.7 }} />
								</ChakraButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content
										bg='color-mix(in srgb, var(--beak-colors-bg-surface) 78%, transparent)'
										borderWidth='1px'
										borderColor='color-mix(in srgb, var(--beak-colors-border-default) 80%, transparent)'
										borderRadius='lg'
										backdropFilter='blur(24px) saturate(180%)'
										boxShadow='0 24px 56px rgba(0,0,0,0.32), 0 8px 18px rgba(0,0,0,0.16), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
										p='1'
										minW='160px'
									>
										{setKeys.map(gk => {
											const isActive = gk === value;
											return (
												<Menu.Item
													key={gk}
													value={gk}
													onClick={() =>
														dispatch(
															editorPreferencesSetSelectedVariableGroup({
																variableSet: k,
																setId: gk,
															}),
														)
													}
													fontSize='12px'
													fontWeight={isActive ? '600' : '500'}
													borderRadius='md'
													py='1.5'
													px='2'
													gap='2'
													bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
													color={isActive ? 'accent.pink' : 'fg.default'}
													_hover={{
														bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
														color: 'accent.pink',
													}}
												>
													<Flex
														align='center'
														justify='center'
														w='12px'
														h='12px'
														flex='0 0 auto'
														color={isActive ? 'accent.pink' : 'transparent'}
													>
														<Check size={11} strokeWidth={3} />
													</Flex>
													<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
														{sets[gk]}
													</Box>
												</Menu.Item>
											);
										})}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.Root>
					</Grid>
				);
			})}
		</Box>
	);
};

export default VariableSets;
