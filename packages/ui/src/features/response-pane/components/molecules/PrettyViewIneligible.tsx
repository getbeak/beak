import { Box, Flex } from '@chakra-ui/react';
import { CircleHelp } from 'lucide-react';
import * as React from 'react';

import type { NotEligible } from '../../hooks/use-flight-body-info';

const reasons: Record<NotEligible, Reason> = {
	request_invalid_body: {
		title: 'The request body brok',
		description: 'The internal request body is in an invalid format. Report this as a bug.',
	},
	request_no_body: {
		title: 'This request had no body, to love',
		description: "The request had no body, so you don't need to be looking here",
	},
	response_no_body: {
		title: 'This response had no body',
		description: "The response had no body, so you don't need to be looking here",
	},
};

interface Reason {
	title: string;
	description: string;
}

interface PrettyViewIneligibleProps {
	eligibility: NotEligible;
}

const PrettyViewIneligible: React.FC<PrettyViewIneligibleProps> = ({ eligibility }) => {
	const reason = reasons[eligibility];

	return (
		<Flex align='center' justify='center' h='100%' px='10'>
			<Box textAlign='center'>
				<CircleHelp opacity={0.4} />
				<Box fontSize='2xl' my='2.5' fontWeight='300' color='fg.default'>{reason.title}</Box>
				<Box fontSize='md' color='fg.muted'>{reason.description}</Box>
			</Box>
		</Flex>
	);
};

export default PrettyViewIneligible;
