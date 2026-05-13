import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from '@chakra-ui/react';
import * as React from 'react';

/**
 * Beak's pill button — Chakra v3 under the hood.
 *
 * The visual language stays the same as the previous styled-components
 * implementation: a transparent background, a 2-px brand-coloured border,
 * and a fill-on-hover transition. `colour` chooses the brand accent
 * (`primary` = pink, `secondary` = pink, `destructive` = red) and `size`
 * controls density. Defaults preserve the old behaviour so call sites
 * don't need to change.
 */
export interface ButtonProps extends Omit<ChakraButtonProps, 'colorScheme' | 'size'> {
	colour?: 'primary' | 'secondary' | 'destructive';
	size?: 'md' | 'sm';
}

function borderColorFor(colour: ButtonProps['colour']) {
	if (colour === 'destructive') return 'accent.alert';
	// Primary and secondary both use the brand pink — the previous
	// styled-components implementation used different tokens (primaryFill vs
	// secondaryAction) that resolved to the same hex, so we collapse here.
	return 'accent.pink';
}

const Button: React.FC<ButtonProps> = ({ colour, size = 'md', children, ...rest }) => {
	const borderColor = borderColorFor(colour);
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
			transitionProperty='transform, background, border-color'
			transitionDuration='0.1s'
			transitionTimingFunction='ease'
			_hover={{ bg: borderColor }}
			_active={{ transform: 'scale(0.95)' }}
			_focus={{ outline: 'none', borderColor }}
			_disabled={{ opacity: 0.7, cursor: 'default', _hover: { bg: 'rgba(0, 0, 0, 0.0)' } }}
			{...rest}
		>
			{children}
		</ChakraButton>
	);
};

export default Button;
