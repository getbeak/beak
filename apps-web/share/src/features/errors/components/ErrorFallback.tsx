import { Box } from '@chakra-ui/react';
import { SmallContainer } from '@beak/apps-web-share/components/atoms/Container';
import { BodyRegular, Title, TitleSubtle } from '@beak/apps-web-share/components/atoms/Typography';
import { Bug } from 'lucide-react';
import * as React from 'react';

const ErrorFallback: React.FC = () => (
	<Box py={{ base: '10', md: '20' }} overflow='hidden' bg='bg.canvas'>
		<SmallContainer position='relative'>
			<Box
				position='absolute'
				top='-10'
				right='-10'
				opacity={0.05}
				transform='rotate(20deg)'
				css={{ '> svg': { width: '300px !important', height: '300px !important' } }}
			>
				<Bug />
			</Box>

			<Title>{'This is awkward... something broke'}</Title>
			<TitleSubtle>{"Wait a minute, how did this happen? We're smarter than this..."}</TitleSubtle>

			<Box mt='10'>
				<BodyRegular>
					{"The error you're encountering has been reported. Please try again or a little bit later if you "}
					{'keep encountering it.'}
				</BodyRegular>
			</Box>
		</SmallContainer>
	</Box>
);

export default ErrorFallback;
