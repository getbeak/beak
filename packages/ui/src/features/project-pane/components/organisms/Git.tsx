import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, Flex } from '@chakra-ui/react';
import { GitBranch } from 'lucide-react';
import * as React from 'react';

import NoProjectInformation from '../molecules/NoProjectInformation';

const Git: React.FC = () => {
	const { branches, selectedBranch } = useAppSelector(s => s.global.git)!;

	useSectionBody({ maxHeight: '120px', flexShrink: 0 });

	if (branches.length === 0) {
		return (
			<Box px='1.5' py='1'>
				<NoProjectInformation />
			</Box>
		);
	}

	const otherCount = Math.max(0, branches.length - 1);

	return (
		<Box px='1.5' py='1'>
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
				px='2'
				py='1.5'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='color-mix(in srgb, var(--beak-colors-bg-surface) 65%, transparent)'
			>
				<Flex
					flexShrink={0}
					align='center'
					justify='center'
					w='18px'
					h='18px'
					borderRadius='sm'
					bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
					color='accent.pink'
					boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
				>
					<GitBranch size={10} strokeWidth={2.2} />
				</Flex>
				<Box
					flex='1 1 auto'
					minW={0}
					fontSize='12px'
					fontWeight='600'
					fontFamily='mono'
					color='fg.default'
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
						px='1.5'
						py='0.5'
						borderRadius='sm'
						borderWidth='1px'
						borderColor='border.subtle'
						bg='color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
						color='fg.subtle'
						fontSize='9px'
						fontWeight='700'
						letterSpacing='0.04em'
						textTransform='uppercase'
						style={{ fontVariantNumeric: 'tabular-nums' }}
					>
						{`+${otherCount}`}
					</Box>
				)}
			</Flex>
		</Box>
	);
};

export default Git;
