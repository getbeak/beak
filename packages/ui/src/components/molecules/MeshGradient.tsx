import { Box, type BoxProps } from '@chakra-ui/react';
import { MeshGradient as PaperMeshGradient } from '@paper-design/shaders-react';
import { useReducedMotion } from 'framer-motion';
import * as React from 'react';

/**
 * Animated mesh-gradient backdrop composed from Beak's brand palette
 * (pink, teal, indigo). Uses the paper.design WebGL mesh shader for an
 * organic flowing surface that's smoother than stacked radial gradients
 * — and far more performant than animating CSS gradient stops.
 *
 * `tone` picks a colour palette:
 *  - `welcome` — pink-led, balanced
 *  - `loading` — teal-led, calm
 *  - `success` — teal-dominant
 *  - `alert`   — alert red, dimmer
 *
 * `intensity` controls overlay opacity (subtle/normal/strong).
 * The shader honours `prefers-reduced-motion` — when set, `speed`
 * drops to 0 so the gradient renders static.
 */
export interface MeshGradientProps extends Omit<BoxProps, 'children'> {
	tone?: 'welcome' | 'loading' | 'success' | 'alert';
	intensity?: 'subtle' | 'normal' | 'strong';
}

const PALETTES: Record<NonNullable<MeshGradientProps['tone']>, string[]> = {
	welcome: ['#d45d80', '#33CC99', '#333399', '#1a1a2e'],
	loading: ['#33CC99', '#333399', '#d45d80', '#0e1226'],
	success: ['#33CC99', '#9be9c8', '#33CC99', '#1a3326'],
	alert: ['#FC3233', '#d45d80', '#333399', '#2a0e1a'],
};

const INTENSITY_OPACITY = {
	subtle: 0.35,
	normal: 0.55,
	strong: 0.8,
} as const;

const MeshGradient: React.FC<MeshGradientProps> = ({
	tone = 'welcome',
	intensity = 'normal',
	...rest
}) => {
	const reduced = useReducedMotion();
	const colors = PALETTES[tone];
	const opacity = INTENSITY_OPACITY[intensity];

	return (
		<Box data-testid='mesh-gradient' position='relative' overflow='hidden' {...rest}>
			<Box
				position='absolute'
				inset='0'
				pointerEvents='none'
				css={{ '& > canvas': { width: '100%', height: '100%', display: 'block' } }}
				opacity={opacity}
			>
				<PaperMeshGradient
					colors={colors}
					distortion={0.85}
					swirl={0.18}
					speed={reduced ? 0 : 0.45}
					grainMixer={0.25}
					style={{ width: '100%', height: '100%' }}
				/>
			</Box>
		</Box>
	);
};

export default MeshGradient;
