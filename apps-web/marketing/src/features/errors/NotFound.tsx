import { Box } from '@chakra-ui/react';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons/faQuestionCircle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type React from 'react';

import { SmallContainer } from '../../components/Container';
import { BodyRegular, Title, TitleSubtle } from '../../components/Typography';

const NotFound: React.FC = () => (
	<Box py={{ base: '40px', md: '80px' }} overflow='hidden' bg='background'>
		<SmallContainer position='relative'>
			<Box
				position='absolute'
				top='-40px'
				right='-40px'
				opacity={0.05}
				transform='rotate(20deg)'
				css={{ '> svg': { width: '300px !important', height: '300px !important' } }}
			>
				<FontAwesomeIcon icon={faQuestionCircle} />
			</Box>

			<Title>Page not found</Title>
			<TitleSubtle>The page you seek either never existed, or just doesn't exist now</TitleSubtle>

			<Box mt='40px'>
				<BodyRegular>
					{'Maybe the '}
					<a href='/'>homepage</a>
					{' would be a good place to start?'}
				</BodyRegular>
			</Box>
		</SmallContainer>
	</Box>
);

export default NotFound;
