import { openSourceControl } from '@beak/ui/features/source-control/store';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { GitBranch } from 'lucide-react';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import NoProjectInformation from '../molecules/NoProjectInformation';

const Git: React.FC = () => {
	const dispatch = useDispatch();
	const { available, branches, selectedBranch } = useAppSelector(s => s.global.git)!;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (!available || branches.length === 0) {
		return <NoProjectInformation onInitialise={available ? undefined : () => dispatch(openSourceControl())} />;
	}

	const otherCount = Math.max(0, branches.length - 1);

	return (
		<Flex
			role='group'
			aria-label='Current Git branch'
			title={
				otherCount === 0
					? `On branch ${selectedBranch}`
					: `On branch ${selectedBranch} (${otherCount} other ${otherCount === 1 ? 'branch' : 'branches'} in this repo)`
			}
			align='center'
			gap='2'
			px='3'
			py='1'
			color='fg.default'
		>
			<GitBranch size={12} strokeWidth={1.8} style={{ color: 'var(--beak-colors-fg-muted)' }} />
			<Box
				flex='1 1 auto'
				minW={0}
				fontSize='12px'
				fontWeight='500'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				style={{ fontVariantNumeric: 'tabular-nums' }}
			>
				{selectedBranch}
			</Box>
			{otherCount > 0 && (
				<Box
					flexShrink={0}
					color='fg.subtle'
					fontSize='10px'
					fontWeight='500'
					style={{ fontVariantNumeric: 'tabular-nums' }}
				>
					{`+${otherCount}`}
				</Box>
			)}
		</Flex>
	);
};

export default Git;
