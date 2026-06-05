import { TypedObject } from '@beak/common/helpers/typescript';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { glassChakraProps } from '@beak/ui/lib/glass';
import { editorPreferencesSetSelectedVariableGroup } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
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

	useSectionBody({ maxHeight: '180px', flexShrink: 0 });

	if (empty) {
		return (
			<Box px='3' py='1'>
				<NoVariableSets />
			</Box>
		);
	}

	return (
		<Flex direction='column' minW={0}>
			{TypedObject.keys(variableSets!).map(k => {
				const sets = variableSets![k].sets;
				const setKeys = TypedObject.keys(sets);
				const value = selectedSets[k];
				const activeLabel = (value && sets[value]) || (setKeys[0] && sets[setKeys[0]]) || '—';

				return (
					<Flex
						key={k}
						align='center'
						gap='2'
						h='26px'
						px='3'
						minW={0}
						transition='background-color .1s linear'
						_hover={{
							bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
						}}
					>
						<Box flex='1 1 auto' minW={0}>
							<VariableSetName variableSetName={k} />
						</Box>
						<Menu.Root>
							<Menu.Trigger asChild>
								<ChakraButton
									type='button'
									aria-label={`Active set for ${k}`}
									title={activeLabel}
									ml='auto'
									display='inline-flex'
									alignItems='center'
									justifyContent='space-between'
									gap='1'
									h='20px'
									pl='1.5'
									pr='0'
									minW={0}
									maxW='150px'
									borderRadius='sm'
									borderWidth='1px'
									borderColor='transparent'
									bg='transparent'
									color='fg.default'
									fontSize='11.5px'
									fontWeight='500'
									fontVariantNumeric='tabular-nums'
									cursor='pointer'
									flex='0 1 auto'
									transition='background-color .1s linear, color .1s linear, border-color .1s linear'
									_hover={{
										color: 'fg.default',
										borderColor: 'border.default',
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
									}}
									_focusVisible={{
										outline: 'none',
										boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)',
									}}
									css={{
										'&[data-state="open"]': {
											borderColor: 'var(--beak-colors-border-default)',
											background: 'color-mix(in srgb, var(--beak-colors-fg-default) 10%, transparent)',
										},
										'&[data-state="open"] svg.lucide-chevron-down': { transform: 'rotate(180deg)' },
										'svg.lucide-chevron-down': { transition: 'transform .14s ease-out' },
									}}
								>
									<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
										{activeLabel}
									</Box>
									<ChevronDown size={11} strokeWidth={1.8} style={{ flex: '0 0 auto', opacity: 0.55 }} />
								</ChakraButton>
							</Menu.Trigger>
							<Portal>
								<Menu.Positioner>
									<Menu.Content {...glassChakraProps.menu} borderRadius='md' p='1' minW='200px'>
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
													borderRadius='sm'
													py='1.5'
													px='2'
													gap='2'
													bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : undefined}
													color={isActive ? 'accent.pink' : 'fg.default'}
													_hover={{
														bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
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
					</Flex>
				);
			})}
		</Flex>
	);
};

export default VariableSets;
