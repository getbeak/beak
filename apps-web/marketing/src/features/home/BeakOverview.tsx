import { Box, Image } from '@chakra-ui/react';
import type React from 'react';

import Container from '../../components/Container';
import { SubTitle, Title } from '../../components/Typography';

const BeakOverview: React.FC = () => (
	<Container>
		<Box my='60px' textAlign='center'>
			<Title>What is Beak?</Title>
			<SubTitle>
				{"Beak is the one stop shop for testing, building, managing, and reverse engineering API's — "}
				<strong>quickly</strong> and <strong>easily</strong>.
			</SubTitle>

			<Box as='picture' maxW='100%'>
				<source srcSet='/assets/overview.webp' type='image/webp' />
				<source srcSet='/assets/overview.png' type='image/png' />
				<Image
					loading='lazy'
					src='/assets/overview.png'
					alt="Beak's interface, showing the project explorer and request view."
					maxW='100%'
					objectFit='contain'
					borderBottom='1px solid'
					borderColor='backgroundBorderSeparator'
				/>
			</Box>
		</Box>
	</Container>
);

export default BeakOverview;
