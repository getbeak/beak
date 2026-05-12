import { Flex } from '@chakra-ui/react';
import React from 'react';

import CtaButton from '../../components/CtaButton';

const HeaderCta: React.FC = () => (
	<Flex
		mt='40px'
		mb='15px'
		flexDir={{ base: 'column', sm: 'row' }}
		justifyContent='center'
		gap={{ base: '10px', sm: 0 }}
	>
		<CtaButton href='/#downloads' tone='primary'>
			Download free to get started
		</CtaButton>
	</Flex>
);

export default HeaderCta;
