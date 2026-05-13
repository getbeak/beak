import { Box, Grid } from '@chakra-ui/react';
import { format, parseISO } from 'date-fns';
import { Network } from 'lucide-react';
import * as React from 'react';

export interface RecentEntryProps {
	name: string;
	path: string;
	modifiedDate: string;
	type: 'local';
	onClick: () => void;
}

const RecentEntry: React.FC<RecentEntryProps> = props => {
	const date = parseISO(props.modifiedDate);
	const pathIsGoingToBeAnAsshole = props.path.startsWith('/');
	const path = pathIsGoingToBeAnAsshole ? props.path.substring(1) : props.path;

	return (
		<Grid
			p='2.5'
			templateColumns='40px minmax(0, 1fr) auto'
			gap='2.5'
			transition='transform .1s ease'
			borderRadius='md'
			tabIndex={0}
			onClick={() => props.onClick()}
			onKeyDown={event => {
				if (event.key === 'Enter') props.onClick();
			}}
			_hover={{
				bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)',
				cursor: 'pointer',
			}}
			_active={{
				bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 80%, transparent)',
				transform: 'scale(0.99)',
				outline: '0',
			}}
			_focus={{
				bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 80%, transparent)',
				outline: '0',
			}}
		>
			<Box w='10' textAlign='center' lineHeight='35px'>
				<Network />
			</Box>
			<Box>
				<Box
					as='span'
					display='block'
					fontSize='xl'
					fontWeight='medium'
					whiteSpace='nowrap'
					overflow='hidden'
					textOverflow='ellipsis'
					direction='rtl'
					textAlign='left'
				>
					{props.name}&lrm;
				</Box>
				<Box
					as='span'
					display='block'
					fontSize='sm'
					color='fg.muted'
					whiteSpace='nowrap'
					overflow='hidden'
					textOverflow='ellipsis'
					direction='rtl'
					textAlign='left'
					css={{
						'&:after': {
							display: 'inline-block',
							content: pathIsGoingToBeAnAsshole ? "'/'" : "''",
						},
					}}
				>
					{path}
				</Box>
			</Box>
			<Box fontSize='sm' color='fg.muted'>{format(date, 'MM/dd/yyyy')}</Box>
		</Grid>
	);
};

export default RecentEntry;
