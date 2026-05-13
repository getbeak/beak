import { Box, type BoxProps } from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import * as React from 'react';

/**
 * Animated mesh-gradient backdrop composed from Beak's brand palette
 * (pink, teal, indigo). Multiple radial gradients are layered together
 * and the whole composition drifts on a slow loop. `prefers-reduced-motion`
 * is honoured — if the user has it enabled, the gradient renders static.
 *
 * `tone` picks a colour weighting:
 *  - `welcome` — pink-led, balanced
 *  - `loading` — teal-led, subtle
 *  - `success` — teal-dominant
 *  - `alert`   — alert red, dimmer
 *
 * Use as a positioned backdrop:
 *   <MeshGradient position='absolute' inset='0' tone='welcome' />
 */
export interface MeshGradientProps extends Omit<BoxProps, 'children'> {
	tone?: 'welcome' | 'loading' | 'success' | 'alert';
	intensity?: 'subtle' | 'normal' | 'strong';
}

const STOPS = {
	welcome: ['#d45d80', '#33CC99', '#333399'],
	loading: ['#33CC99', '#333399', '#d45d80'],
	success: ['#33CC99', '#d45d80', '#33CC99'],
	alert: ['#FC3233', '#333399', '#d45d80'],
} as const;

const INTENSITY_OPACITY = {
	subtle: 0.16,
	normal: 0.28,
	strong: 0.45,
} as const;

const MotionBox = motion.create(Box);

const MeshGradient: React.FC<MeshGradientProps> = ({
	tone = 'welcome',
	intensity = 'normal',
	...rest
}) => {
	const reduced = useReducedMotion();
	const [a, b, c] = STOPS[tone];
	const opacity = INTENSITY_OPACITY[intensity];

	const gradient = `
		radial-gradient(at 18% 22%, ${a}cc 0%, transparent 42%),
		radial-gradient(at 82% 18%, ${b}b3 0%, transparent 48%),
		radial-gradient(at 38% 78%, ${c}b3 0%, transparent 48%),
		radial-gradient(at 88% 80%, ${a}80 0%, transparent 42%)
	`;

	return (
		<Box data-testid='mesh-gradient' position='relative' overflow='hidden' {...rest}>
			<MotionBox
				position='absolute'
				inset='0'
				bgImage={gradient}
				filter='blur(40px) saturate(140%)'
				opacity={opacity}
				pointerEvents='none'
				animate={
					reduced
						? { transform: 'translate3d(0,0,0) scale(1)' }
						: {
								transform: [
									'translate3d(0px, 0px, 0) scale(1)',
									'translate3d(20px, -10px, 0) scale(1.05)',
									'translate3d(-12px, 14px, 0) scale(0.98)',
									'translate3d(0px, 0px, 0) scale(1)',
								],
						  }
				}
				transition={{
					duration: 30,
					ease: 'easeInOut',
					repeat: Infinity,
					repeatType: 'loop',
				}}
			/>
		</Box>
	);
};

export default MeshGradient;
