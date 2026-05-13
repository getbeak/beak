import { Box } from '@chakra-ui/react';
import * as React from 'react';

const NoActiveSubscription: React.FC = () => (
	<Box fontSize='lg' fontWeight='semibold' color='fg.muted'>
		{'Please visit https://getbeak.app to purchase a subscription'}
	</Box>
);

export default NoActiveSubscription;
