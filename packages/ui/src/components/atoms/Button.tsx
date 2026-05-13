import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * Beak's pill button — Chakra v3 under the hood.
 *
 * Visual language: transparent fill, 2px brand border, fill-on-hover, and a
 * subtle press scale + focus glow for clear activation feedback.
 */
export interface ButtonProps extends Omit<ChakraButtonProps, 'colorScheme' | 'size'> {
	colour?: 'primary' | 'secondary' | 'destructive';
	size?: 'md' | 'sm';
}

function borderColorFor(colour: ButtonProps['colour']) {
	if (colour === 'destructive') return 'accent.alert';
	return 'accent.pink';
}

function glowVar(colour: ButtonProps['colour']) {
	if (colour === 'destructive') return 'var(--beak-colors-accent-alert)';
	return 'var(--beak-colors-accent-pink)';
}

const Button: React.FC<ButtonProps> = ({ colour, size = 'md', children, ...rest }) => {
	const borderColor = borderColorFor(colour);
	const glow = glowVar(colour);
	const isSm = size === 'sm';

	return (
		<ChakraButton
			bg='rgba(0, 0, 0, 0.0)'
			borderWidth='2px'
			borderColor={borderColor}
			color='fg.default'
			borderRadius='sm'
			px={isSm ? '2' : '2.5'}
			py={isSm ? '1' : '1.5'}
			h='auto'
			minH={isSm ? '24px' : '28px'}
			fontSize={isSm ? 'sm' : 'lg'}
			fontWeight='medium'
			transitionProperty='transform, background, border-color, box-shadow'
			transitionDuration='0.12s'
			transitionTimingFunction='ease'
			_hover={{ bg: borderColor }}
			_active={{ transform: 'scale(0.95)' }}
			_focus={{
				outline: 'none',
				borderColor,
				boxShadow: `0 0 0 3px color-mix(in srgb, ${glow} 30%, transparent)`,
			}}
			_focusVisible={{
				outline: 'none',
				borderColor,
				boxShadow: `0 0 0 3px color-mix(in srgb, ${glow} 30%, transparent)`,
			}}
			_disabled={{ opacity: 0.7, cursor: 'default', _hover: { bg: 'rgba(0, 0, 0, 0.0)' } }}
			{...rest}
		>
			{children}
		</ChakraButton>
	);
};

export default Button;
