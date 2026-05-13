import { Box, Grid } from '@chakra-ui/react';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { useAppSelector } from '@beak/ui/store/redux';
import * as React from 'react';

import NoProjectInformation from '../molecules/NoProjectInformation';

const selectStyle: React.CSSProperties = {
	width: '100%',
	fontSize: '12px',
	border: 0,
	borderRadius: '4px',
	background: 'none',
	color: 'var(--beak-colors-fg-muted)',
	textAlignLast: 'right',
	textOverflow: 'ellipsis',
};

const Git: React.FC = () => {
	const { branches, selectedBranch } = useAppSelector(s => s.global.git)!;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (branches.length === 0) {
		return (
			<Box px='1.5' py='1' pr='0' pb='0'>
				<NoProjectInformation />
			</Box>
		);
	}

	return (
		<Box px='1.5' py='1' pr='0' pb='0'>
			<Grid
				templateColumns='minmax(10px, max-content) minmax(10px, max-content)'
				justifyContent='space-between'
				alignItems='center'
				gap='1.5'
				my='1'
				maxW='calc(100% - 3px)'
				_first={{ mt: '0' }}
				_notLast={{ mb: '1.5' }}
			>
				<Box as='span' color='fg.muted' fontSize='sm' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap'>
					{'Branch'}
				</Box>
				<select value={selectedBranch} style={selectStyle} onChange={() => undefined}>
					{branches.map(b => (
						<option disabled={selectedBranch !== b.name} key={b.name} value={b.name}>
							{b.name}
						</option>
					))}
				</select>
			</Grid>
		</Box>
	);
};

export default Git;
