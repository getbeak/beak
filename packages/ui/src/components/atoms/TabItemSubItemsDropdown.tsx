import { Box, Flex } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { TabSubItem } from './TabItem';

interface TabItemSubItemsDropdownProps<T = string> {
	activeSubItem: string;
	subItems: TabSubItem<T>[];
	onSubItemChanged: (subItem: T) => void;
}

const TabItemSubItemsDropdown = <T = string>(props: TabItemSubItemsDropdownProps<T>): React.ReactElement => {
	const { activeSubItem, onSubItemChanged, subItems } = props;
	const parentRef = useRef<HTMLButtonElement | null>(null);
	const [showDropdown, setShowDropdown] = useState(false);

	function setSubItem(subItem: T) {
		onSubItemChanged(subItem);
		setShowDropdown(false);
	}

	return (
		<React.Fragment>
			<Box as='span' color='fg.muted' ml='1' fontSize='xs' fontWeight='500'>
				{subItems.find(i => i.key === activeSubItem)?.label}
			</Box>
			<Box
				as='button'
				ref={parentRef as unknown as React.Ref<HTMLElement>}
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				border='none'
				bg='none'
				color='inherit'
				w='14px'
				h='14px'
				m='0'
				p='0'
				ml='0.5'
				borderRadius='sm'
				cursor='pointer'
				transition='background-color .12s ease'
				_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 14%, transparent)' }}
				onClick={(event: React.MouseEvent) => {
					event.stopPropagation();
					event.preventDefault();
					setShowDropdown(true);
				}}
			>
				<ChevronDown size={10} strokeWidth={2.2} />
			</Box>

			{parentRef.current &&
				showDropdown &&
				createPortal(
					<Box position='fixed' inset='0' onClick={() => setShowDropdown(false)} zIndex={101}>
						<Box
							position='fixed'
							w='160px'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 24%, var(--beak-colors-border-subtle))'
							borderRadius='lg'
							bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
							backdropFilter='blur(24px) saturate(180%)'
							boxShadow='0 28px 64px rgba(0,0,0,0.32), 0 8px 20px color-mix(in srgb, var(--beak-colors-accent-pink) 16%, rgba(0,0,0,0.15)), inset 0 1px 0 color-mix(in srgb, white 20%, transparent)'
							p='1'
							zIndex={102}
							style={{
								marginTop: `${parentRef.current!.getBoundingClientRect().top + parentRef.current!.clientHeight + 6}px`,
								marginLeft: `${parentRef.current!.getBoundingClientRect().left - 160 + 14}px`,
							}}
							onClick={event => event.stopPropagation()}
						>
							{subItems.map(i => {
								const isActive = (i.key as unknown as string) === activeSubItem;
								return (
									<Flex
										tabIndex={0}
										role='button'
										key={i.key as string}
										align='center'
										justify='space-between'
										gap='2'
										px='2'
										py='1.5'
										fontSize='xs'
										fontWeight={isActive ? '600' : '500'}
										cursor='pointer'
										borderRadius='md'
										color={isActive ? 'accent.pink' : 'fg.default'}
										bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : 'transparent'}
										_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)', color: 'accent.pink' }}
										_focusVisible={{
											outline: 'none',
											bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)',
											color: 'accent.pink',
											boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
										}}
										onClick={() => setSubItem(i.key)}
										onKeyDown={(event: React.KeyboardEvent) => {
											if (event.key === 'Enter') setSubItem(i.key);
										}}
									>
										<Box>{i.label}</Box>
										{isActive && (
											<Box color='accent.pink' display='inline-flex'>
												<Check size={11} strokeWidth={3} />
											</Box>
										)}
									</Flex>
								);
							})}
						</Box>
					</Box>,
					document.getElementById('tab-item-sub-items-popover')!,
				)}
		</React.Fragment>
	);
};

export default TabItemSubItemsDropdown;
