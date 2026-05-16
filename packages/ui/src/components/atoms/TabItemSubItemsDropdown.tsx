import Popover, { PopoverBody } from '@beak/ui/components/molecules/Popover';
import { Box, Flex } from '@chakra-ui/react';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { useRef, useState } from 'react';

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
					setShowDropdown(s => !s);
				}}
			>
				<ChevronDown size={10} strokeWidth={2.2} />
			</Box>

			{showDropdown && (
				<Popover
					anchor={parentRef.current}
					onClose={() => setShowDropdown(false)}
					width={180}
					align='end'
					ariaLabel='Sub-tab'
				>
					<PopoverBody padding='4px'>
						{subItems.map(i => {
							const isActive = (i.key as unknown as string) === activeSubItem;
							return (
								<Flex
									tabIndex={0}
									role='option'
									aria-selected={isActive}
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
									_hover={{
										bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
										color: 'accent.pink',
									}}
									onClick={() => setSubItem(i.key)}
									onKeyDown={(event: React.KeyboardEvent) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											setSubItem(i.key);
										}
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
					</PopoverBody>
				</Popover>
			)}
		</React.Fragment>
	);
};

export default TabItemSubItemsDropdown;
