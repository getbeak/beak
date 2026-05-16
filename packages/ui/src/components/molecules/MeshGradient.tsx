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
 * drops to 0 so the gradient renders static. Pass `static` to force
 * a frozen render regardless of the user's motion preference (useful
 * for always-on chrome like the sidebar where motion would be noisy).
 */
export interface MeshGradientProps extends Omit<BoxProps, 'children'> {
	tone?: 'welcome' | 'loading' | 'success' | 'alert';
	intensity?: 'subtle' | 'normal' | 'strong';
	static?: boolean;
}

const PALETTES: Record<NonNullable<MeshGradientProps['tone']>, string[]> = {
	// More colour stops = a livelier mesh. Each tone repeats its
	// brand colour in a different position so the shader has more
	// "anchors" to interpolate between.
	welcome: ['#DA4D7C', '#1FB58F', '#4644BD', '#DA4D7C', '#706FDD', '#11141E'],
	loading: ['#1FB58F', '#4644BD', '#DA4D7C', '#1FB58F', '#0F1219'],
	success: ['#1FB58F', '#9CEFCE', '#1FB58F', '#22C55E', '#0C5240'],
	alert: ['#EF4444', '#DA4D7C', '#4644BD', '#F87171', '#281019'],
};

const INTENSITY_OPACITY = {
	subtle: 0.4,
	normal: 0.65,
	strong: 0.95,
} as const;

const MeshGradient: React.FC<MeshGradientProps> = ({
	tone = 'welcome',
	intensity = 'normal',
	static: isStatic = false,
	...rest
}) => {
	const reduced = useReducedMotion();
	const colors = PALETTES[tone];
	const opacity = INTENSITY_OPACITY[intensity];
	const speed = isStatic || reduced ? 0 : 0.55;

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
					distortion={0.95}
					swirl={0.35}
					speed={speed}
					grainMixer={0.18}
					style={{ width: '100%', height: '100%' }}
				/>
			</Box>
		</Box>
	);
};

export default MeshGradient;
