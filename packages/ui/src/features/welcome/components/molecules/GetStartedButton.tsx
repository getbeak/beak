import { Box, Button as ChakraButton, Flex } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/** Maps the previous design-system colour-token names that callers pass into
 *  `iconColor` onto Chakra CSS vars so the icon still picks up the brand
 *  palette via the active theme. */
const ICON_COLOUR_TOKEN_MAP: Record<string, string> = {
	primaryFill: 'var(--beak-colors-accent-pink)',
	secondaryFill: 'var(--beak-colors-accent-indigo)',
	tertiaryFill: 'var(--beak-colors-accent-teal)',
	goAction: 'var(--beak-colors-accent-teal)',
	secondaryAction: 'var(--beak-colors-accent-pink)',
	destructiveAction: 'var(--beak-colors-accent-alert)',
	textHighlight: 'var(--beak-colors-accent-pink)',
	textSuccess: 'var(--beak-colors-accent-teal)',
	textAlert: 'var(--beak-colors-accent-alert)',
};

export interface GetStartedButtonProps extends ButtonProps {
	title: string;
	description: string;
	icon: LucideIcon;
	iconColor?: keyof typeof ICON_COLOUR_TOKEN_MAP;
}

const GetStartedButton: React.FC<GetStartedButtonProps> = ({
	title,
	description,
	icon: Icon,
	iconColor,
	...passProps
}) => {
	const color = iconColor ? ICON_COLOUR_TOKEN_MAP[iconColor] : void 0;

	return (
		<ChakraButton
			display='block'
			w='calc(100% - 20px)'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 70%, transparent)'
			backdropFilter='blur(5px)'
			borderRadius='md'
			color='fg.default'
			border='none'
			cursor='pointer'
			p='2.5'
			mb='2.5'
			h='auto'
			transition='transform ease .1s'
			_disabled={{ opacity: 0.7, cursor: 'not-allowed' }}
			_hover={{ bg: 'bg.surface.alt' }}
			_active={{ bg: 'bg.canvas', transform: 'scale(0.98)', outline: '0' }}
			_focus={{ bg: 'bg.canvas', transform: 'scale(0.98)', outline: '0' }}
			{...(passProps as Record<string, unknown>)}
		>
			<Flex>
				<Flex w='10' align='center' justify='center'>
					<Icon color={color} size={28} />
				</Flex>
				<Flex direction='column' align='flex-start' ml='2.5'>
					<Box as='span' fontSize='2xl' fontWeight='300'>{title}</Box>
					<Box as='span' fontSize='md' color='fg.muted'>{description}</Box>
				</Flex>
			</Flex>
		</ChakraButton>
	);
};

export default GetStartedButton;
