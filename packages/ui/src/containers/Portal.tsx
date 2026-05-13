import { Box, Grid } from '@chakra-ui/react';
import * as React from 'react';
import { useState } from 'react';

import CreateTrial from '../features/portal/components/CreateTrial';
import Purchase from '../features/portal/components/Purchase';
import SignIn from '../features/portal/components/SignIn';

type Variant = 'default' | 'trial_creation';

const Portal: React.FC = () => {
	const [variant, setVariant] = useState<Variant>('default');

	return (
		<Box
			position='relative'
			h='100vh'
			w='100vw'
			style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
		>
			<Box
				position='absolute'
				top='0'
				bottom='0'
				left='375px'
				w='1100px'
				h='2800px'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent)'
				transition='transform 0.2s ease'
				transform={
					variant === 'trial_creation'
						? 'rotate(20deg) translateX(-800px)'
						: 'rotate(20deg) translateX(-350px)'
				}
				transformOrigin='center'
			/>
			<Grid
				position='absolute'
				templateColumns={variant === 'trial_creation' ? '1fr' : 'repeat(2, .5fr)'}
				templateRows='1fr'
				gap='12'
				w='calc(100% - 100px)'
				h='calc(100% - 100px)'
				m='12'
			>
				{variant === 'default' && (
					<React.Fragment>
						<SignIn />
						<Purchase onChangeToTrial={() => setVariant('trial_creation')} />
					</React.Fragment>
				)}
				{variant === 'trial_creation' && <CreateTrial onChangeToDefault={() => setVariant('default')} />}
			</Grid>
		</Box>
	);
};

export default Portal;
