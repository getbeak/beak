import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import * as React from 'react';

import type { NotEligible } from '../../hooks/use-flight-body-info';

const reasons: Record<NotEligible, Reason> = {
	request_invalid_body: {
		title: 'Invalid request body',
		description: 'The internal request body is in an invalid format. Please report this as a bug.',
	},
	request_no_body: {
		title: 'No request body',
		description: 'This request was sent without a body — nothing to preview here.',
	},
	response_no_body: {
		title: 'No response body',
		description: 'The server replied without a body — nothing to preview here.',
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
			<motion.div
				initial={{ opacity: 0, y: 6 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.22, ease: 'easeOut' }}
				style={{ textAlign: 'center', maxWidth: 380 }}
			>
				<Flex
					align='center'
					justify='center'
					mx='auto'
					w='48px'
					h='48px'
					borderRadius='full'
					bg='color-mix(in srgb, var(--beak-colors-fg-subtle) 12%, transparent)'
					color='fg.subtle'
					mb='2.5'
				>
					<CircleHelp size={22} strokeWidth={1.8} />
				</Flex>
				<Box fontSize='md' fontWeight='600' color='fg.default'>{reason.title}</Box>
				<Box fontSize='xs' color='fg.muted' mt='1.5' lineHeight='1.5'>{reason.description}</Box>
			</motion.div>
		</Flex>
	);
};

export default PrettyViewIneligible;
