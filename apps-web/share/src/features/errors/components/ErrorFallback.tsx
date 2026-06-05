import { SmallContainer } from '@beak/apps-web-share/components/atoms/Container';
import { BodyRegular, Title, TitleSubtle } from '@beak/apps-web-share/components/atoms/Typography';
import { Box, Flex } from '@chakra-ui/react';
import { Bug } from 'lucide-react';
import * as React from 'react';

const ErrorFallback: React.FC = () => (
	<Box py={{ base: '10', md: '20' }} overflow='hidden' bg='bg.canvas'>
		<SmallContainer position='relative'>
			<Box
				position='absolute'
				top='-10'
				right='-10'
				opacity={0.06}
				transform='rotate(20deg)'
				color='accent.alert'
				css={{ '> svg': { width: '300px !important', height: '300px !important' } }}
			>
				<Bug />
			</Box>

			<Flex
				align='center'
				justify='center'
				w='56px'
				h='56px'
				borderRadius='full'
				bg='color-mix(in srgb, var(--beak-colors-accent-alert) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-alert) 28%, transparent)'
				color='accent.alert'
				mb='3'
				style={{
					boxShadow:
						'0 6px 18px color-mix(in srgb, var(--beak-colors-accent-alert) 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
				}}
			>
				<Bug size={24} strokeWidth={1.8} />
			</Flex>

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
