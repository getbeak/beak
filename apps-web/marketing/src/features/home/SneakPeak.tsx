import { Box, Image } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import type React from 'react';

const pulse = keyframes`
	0% { transform: scale(0.8); opacity: 1; }
	25% { transform: scale(1.1); }
	50% { transform: scale(0.5); opacity: 0.8; }
	75% { transform: scale(1.2); }
	100% { transform: scale(0.8); opacity: 1; }
`;

const SneakPeak: React.FC = () => (
	<Box
		display='grid'
		gridTemplate='1fr / 1fr'
		placeItems='center'
		mt={{ base: '10vw', md: '50px' }}
		css={{ '> *': { gridColumn: '1 / 1', gridRow: '1 / 1' } }}
	>
		<Box
			zIndex={1}
			w='100%'
			maxW='100%'
			h='500px'
			transform='scale(0.8)'
			animation={`${pulse} 20s infinite`}
			filter='blur(180px)'
			backgroundImage='conic-gradient(from 0 at 45% 65%, #d45d80AA 0deg, #333399AA 120deg, #FC3233AA 180deg, #ff81a7AA 260deg)'
			css={{ '@media (max-width: 676px)': { display: 'none' } }}
		/>
		<Box as='picture' zIndex={2}>
			<source media='(prefers-color-scheme: light)' srcSet='/assets/home-trans-light.webp' type='image/webp' />
			<source media='(prefers-color-scheme: dark)' srcSet='/assets/home-trans-dark.webp' type='image/webp' />
			<source media='(prefers-color-scheme: light)' srcSet='/assets/home-trans-light.png' type='image/png' />
			<source media='(prefers-color-scheme: dark)' srcSet='/assets/home-trans-dark.png' type='image/png' />
			<Image
				loading='eager'
				src='/assets/home-trans-dark.png'
				alt='A preview of Beak, showing how a project, request, and response are displayed.'
				zIndex={2}
				maxW={{ base: '100%', md: '90%' }}
				objectFit='contain'
			/>
		</Box>
	</Box>
);

export default SneakPeak;
