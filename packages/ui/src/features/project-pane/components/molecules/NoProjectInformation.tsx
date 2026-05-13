import { Box } from '@chakra-ui/react';
import SidebarSectionCard from '@beak/ui/features/sidebar/components/SidebarSectionCard';
import * as React from 'react';

const NoProjectInformation: React.FC = () => (
	<Box mb='2.5'>
		<SidebarSectionCard>{"This project isn't tracked in Git"}</SidebarSectionCard>
	</Box>
);

export default NoProjectInformation;
