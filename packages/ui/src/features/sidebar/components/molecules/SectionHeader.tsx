import { Box, Flex } from '@chakra-ui/react';
import ksuid from '@beak/ksuid';
import { showContextMenu } from '@beak/ui/utils/context-menu';
import { ChevronRight, EllipsisVertical } from 'lucide-react';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';
import { useMemo } from 'react';

interface SectionHeaderProps {
	actions?: MenuItemConstructorOptions[];
	collapsed?: boolean;
	disableCollapse?: boolean;
	onClick: () => void;
}

const SectionHeader: React.FC<React.PropsWithChildren<SectionHeaderProps>> = props => {
	const { actions, children, collapsed, disableCollapse, onClick } = props;
	const ctxMenuId = useMemo(() => ksuid.generate('ctxmenu').toString(), []);

	return (
		<Flex
			role='button'
			aria-expanded={!collapsed}
			aria-disabled={disableCollapse}
			tabIndex={disableCollapse ? -1 : 0}
			justify='space-between'
			align='center'
			px='2'
			py='2'
			textTransform='uppercase'
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.08em'
			color='fg.subtle'
			cursor={disableCollapse ? 'default' : 'pointer'}
			transition='color .12s ease, background-color .12s ease'
			_hover={{
				color: 'fg.default',
				bg: disableCollapse ? undefined : 'color-mix(in srgb, var(--beak-colors-bg-surface) 35%, transparent)',
			}}
			_focusVisible={{
				outline: 'none',
				color: 'fg.default',
				boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
			}}
			onClick={onClick}
			onKeyDown={(event: React.KeyboardEvent) => {
				if (disableCollapse) return;
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					onClick();
				}
			}}
			css={{ '&:hover [data-section-actions]': { opacity: 1 } }}
		>
			<Flex align='center' gap='1.5' minW={0}>
				{!disableCollapse && (
					<Box
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						w='11px'
						h='11px'
						color='fg.muted'
						transform={collapsed ? 'rotate(0deg)' : 'rotate(90deg)'}
						transition='transform .14s ease-out'
					>
						<ChevronRight size={10} />
					</Box>
				)}
				<Box overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
					{children}
				</Box>
			</Flex>
			{actions && actions.length > 0 && (
				<Box
					data-section-actions
					px='1'
					py='0.5'
					borderRadius='sm'
					color='fg.subtle'
					opacity={0}
					transition='color .12s ease, background-color .12s ease, opacity .14s ease, transform .08s ease'
					_hover={{
						color: 'accent.pink',
						bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)',
					}}
					_active={{ transform: 'scale(0.92)' }}
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();
						showContextMenu(ctxMenuId, actions);
					}}
				>
					<EllipsisVertical size={11} />
				</Box>
			)}
		</Flex>
	);
};

export default SectionHeader;
