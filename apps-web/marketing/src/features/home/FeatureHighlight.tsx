import { Box, Flex, Image } from '@chakra-ui/react';
import type React from 'react';

import Container from '../../components/Container';
import ScrollTarget from '../../components/ScrollTarget';
import { SubTitle, Title } from '../../components/Typography';

interface FeatureHighlightProps {
	title: string;
	description: string;
	asset: string;
	flipped?: boolean;
}

const FeatureHighlight: React.FC<FeatureHighlightProps> = ({ title, description, asset, flipped }) => (
	<Box py='80px' bg={flipped ? 'surfaceHighlight' : 'secondaryBackground'}>
		<ScrollTarget target='features' />

		<Container>
			<Flex
				flexDir='column'
				py={0}
				textAlign='center'
				css={{
					'@media (min-width: 851px)': {
						flexDirection: flipped ? 'row-reverse' : 'row',
						paddingTop: '60px',
						paddingBottom: '60px',
						textAlign: 'left',
					},
				}}
			>
				<Box
					flex={4}
					display='flex'
					flexDir='column'
					justifyContent='center'
					mx={{ base: 0, md: '20px' }}
					mb={{ base: '20px', md: 0 }}
				>
					<Title>{title}</Title>
					<SubTitle>{description}</SubTitle>
				</Box>
				<Box flex={6} mx={{ base: 0, md: '20px' }}>
					<Box as='picture'>
						<source srcSet={`/assets/${asset}.webp`} type='image/webp' />
						<source srcSet={`/assets/${asset}.jpg`} type='image/jpeg' />
						<Image
							loading='lazy'
							src={`/assets/${asset}.jpg`}
							alt={description}
							overflow='hidden'
							borderRadius='25px'
							maxW='100%'
							objectFit='contain'
						/>
					</Box>
				</Box>
			</Flex>
		</Container>
	</Box>
);

export default FeatureHighlight;
