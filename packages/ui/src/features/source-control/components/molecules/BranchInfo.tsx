import { Box, Flex } from '@chakra-ui/react';
import { GitBranch } from 'lucide-react';
import * as React from 'react';

interface BranchInfoProps {
	branch: string | undefined;
	branchCount: number;
}

const BranchInfo: React.FC<BranchInfoProps> = ({ branch, branchCount }) => (
	<Flex align='center' gap='2'>
		<Flex
			align='center'
			justify='center'
			w='28px'
			h='28px'
			borderRadius='full'
			bg='color-mix(in srgb, var(--beak-colors-accent-indigo) 14%, transparent)'
			borderWidth='1px'
			borderColor='color-mix(in srgb, var(--beak-colors-accent-indigo) 28%, transparent)'
			color='accent.indigo'
		>
			<GitBranch size={13} strokeWidth={2.2} />
		</Flex>
		<Box>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.06em' color='fg.subtle'>
				{'Branch'}
			</Box>
			<Box fontSize='sm' color='fg.default' fontWeight='600' fontFamily='mono'>
				{branch ?? '(detached)'}
				{branchCount > 1 && (
					<Box as='span' ml='2' fontSize='10px' color='fg.muted' fontFamily='inherit' fontWeight='500'>
						{`+${branchCount - 1} other`}
					</Box>
				)}
			</Box>
		</Box>
	</Flex>
);

export default BranchInfo;
