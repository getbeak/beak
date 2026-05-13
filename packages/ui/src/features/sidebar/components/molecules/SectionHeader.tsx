import { Box, Flex } from '@chakra-ui/react';
import { showContextMenu } from '@beak/ui/utils/context-menu';
import { ChevronRight, EllipsisVertical } from 'lucide-react';
import type { MenuItemConstructorOptions } from 'electron';
import * as React from 'react';

interface SectionHeaderProps {
	actions?: MenuItemConstructorOptions[];
	collapsed?: boolean;
	disableCollapse?: boolean;
	onClick: () => void;
}

const SectionHeader: React.FC<React.PropsWithChildren<SectionHeaderProps>> = props => {
	const { actions, children, collapsed, disableCollapse, onClick } = props;

	return (
		<Flex
			justify='space-between'
			align='center'
			px='1.5'
			py='1.5'
			textTransform='uppercase'
			fontSize='xs'
			fontWeight='semibold'
			cursor={disableCollapse ? 'default' : 'pointer'}
			onClick={onClick}
		>
			<Box textOverflow='ellipsis' whiteSpace='nowrap' overflow='hidden'>
				<Box
					display='inline-block'
					mr='0.5'
					pl='0.5'
					w='10px'
					fontSize='9px'
					lineHeight='9px'
					color='fg.muted'
					css={{
						'> svg': {
							transition: 'transform .2s ease',
							transformOrigin: 'center center',
							transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
						},
					}}
				>
					<ChevronRight size={9} />
				</Box>
				{children}
			</Box>
			{actions && actions.length > 0 && (
				<Box
					px='1.5'
					borderRadius='sm'
					_hover={{ bg: 'bg.surface' }}
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();
						showContextMenu('test', actions);
					}}
				>
					<EllipsisVertical size={10} />
				</Box>
			)}
		</Flex>
	);
};

export default SectionHeader;
