import { Box, Flex } from '@chakra-ui/react';
import SidebarSectionCard from '@beak/ui/features/sidebar/components/SidebarSectionCard';
import { GitBranch } from 'lucide-react';
import * as React from 'react';

const NoProjectInformation: React.FC = () => (
	<Box mb='2'>
		<SidebarSectionCard>
			<Flex align='center' gap='1.5' color='fg.subtle'>
				<GitBranch size={11} />
				<Box>{'Not tracked in Git'}</Box>
			</Flex>
		</SidebarSectionCard>
	</Box>
);

export default NoProjectInformation;
