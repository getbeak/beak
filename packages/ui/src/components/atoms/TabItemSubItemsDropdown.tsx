import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { faSortDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { TabSubItem } from './TabItem';

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
			<DropdownButton
				ref={parentRef}
				onClick={event => {
					event.stopPropagation();
					event.preventDefault();

					setShowDropdown(true);
				}}
			>
				<FontAwesomeIcon icon={faSortDown} />
			</DropdownButton>

			{parentRef.current && showDropdown && createPortal(
				<Container onClick={() => setShowDropdown(false)}>
					<Wrapper
						$top={parentRef.current!.getBoundingClientRect().top + parentRef.current!.clientHeight + 6}
						$left={parentRef.current!.getBoundingClientRect().left - 140 + 10}
						onClick={event => void event.stopPropagation()}
					>
						{subItems.map(i => (
							<WrapperItem
								tabIndex={0}
								role={'button'}
								key={i.key as string}
								onClick={() => setSubItem(i.key)}
								onKeyDown={event => {
									if (event.key === 'Enter') setSubItem(i.key);
								}}
							>
								{i.label}
							</WrapperItem>
						))}
					</Wrapper>
				</Container>,
				document.getElementById('tab-item-sub-items-popover')!,
			)}
		</React.Fragment>
	);
};

const DropdownButton = styled.button`
	display: flow-root;
	border: none; background: none; color: inherit;
	margin: 0; padding: 0;

	margin-left: 5px;
	margin-top: -2px;
	cursor: pointer;
`;

const Container = styled.div`
	position: fixed;
	top: 0; bottom: 0; left: 0; right: 0;
`;

const Wrapper = styled.div<{ $top: number; $left: number }>`
	position: fixed;
	margin-top: ${p => p.$top}px;
	margin-left: ${p => p.$left}px;

	width: 140px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	border-radius: 5px;
	background: ${p => p.theme.ui.background};

	padding: 5px;
	z-index: 101;
`;

const WrapperItem = styled.div`
	padding: 4px 6px;
	font-size: 15px;
	cursor: pointer;

	border-radius: 5px;
	color: ${p => p.theme.ui.textOnSurfaceBackground};

	&:hover {
		background: ${p => p.theme.ui.secondarySurface};
	}
`;

export default TabItemSubItemsDropdown;
