import { Box, Flex } from '@chakra-ui/react';
import { showContextMenu } from '@beak/ui/utils/context-menu';
import { motion } from 'framer-motion';
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
			fontSize='10px'
			fontWeight='700'
			letterSpacing='0.06em'
			color='fg.subtle'
			cursor={disableCollapse ? 'default' : 'pointer'}
			transition='color .12s ease'
			_hover={{ color: 'fg.default' }}
			onClick={onClick}
		>
			<Flex align='center' gap='1' minW={0}>
				{!disableCollapse && (
					<Box display='inline-flex' alignItems='center' w='10px' h='10px' color='fg.muted'>
						<motion.span
							style={{ display: 'inline-flex', transformOrigin: 'center' }}
							animate={{ rotate: collapsed ? 0 : 90 }}
							transition={{ duration: 0.14, ease: 'easeOut' }}
						>
							<ChevronRight size={9} />
						</motion.span>
					</Box>
				)}
				<Box overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
					{children}
				</Box>
			</Flex>
			{actions && actions.length > 0 && (
				<Box
					px='1'
					py='0.5'
					borderRadius='sm'
					color='fg.subtle'
					transition='color .12s ease, background-color .12s ease'
					_hover={{
						color: 'fg.default',
						bg: 'color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)',
					}}
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();
						showContextMenu('test', actions);
					}}
				>
					<EllipsisVertical size={11} />
				</Box>
			)}
		</Flex>
	);
};

export default SectionHeader;
