import { Box } from '@chakra-ui/react';
import { ChevronDown } from 'lucide-react';
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
			{` (${subItems.find(i => i.key === activeSubItem)?.label})`}
			<Box
				as='button'
				ref={parentRef as unknown as React.Ref<HTMLElement>}
				display='flow-root'
				border='none'
				bg='none'
				color='inherit'
				m='0'
				p='0'
				ml='1.5'
				mt='-2px'
				cursor='pointer'
				onClick={(event: React.MouseEvent) => {
					event.stopPropagation();
					event.preventDefault();
					setShowDropdown(true);
				}}
			>
				<ChevronDown />
			</Box>

			{parentRef.current &&
				showDropdown &&
				createPortal(
					<Box position='fixed' inset='0' onClick={() => setShowDropdown(false)}>
						<Box
							position='fixed'
							w='140px'
							borderWidth='1px'
							borderColor='border.default'
							borderRadius='md'
							bg='bg.canvas'
							p='1.5'
							zIndex={101}
							style={{
								marginTop: `${parentRef.current!.getBoundingClientRect().top + parentRef.current!.clientHeight + 6}px`,
								marginLeft: `${parentRef.current!.getBoundingClientRect().left - 140 + 10}px`,
							}}
							onClick={event => event.stopPropagation()}
						>
							{subItems.map(i => (
								<Box
									tabIndex={0}
									role='button'
									key={i.key as string}
									px='1.5'
									py='1'
									fontSize='lg'
									cursor='pointer'
									borderRadius='md'
									color='fg.default'
									_hover={{ bg: 'bg.surface.emphasized' }}
									onClick={() => setSubItem(i.key)}
									onKeyDown={(event: React.KeyboardEvent) => {
										if (event.key === 'Enter') setSubItem(i.key);
									}}
								>
									{i.label}
								</Box>
							))}
						</Box>
					</Box>,
					document.getElementById('tab-item-sub-items-popover')!,
				)}
		</React.Fragment>
	);
};

export default TabItemSubItemsDropdown;
