import { Box } from '@chakra-ui/react';
import * as React from 'react';

const NotSignedIn: React.FC = () => (
	<Box fontSize='lg' fontWeight='semibold' color='fg.muted'>
		{'Please sign into your account to view your subscription plan'}
	</Box>
);

export default NotSignedIn;
