import { Box, Flex, chakra } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import * as React from 'react';

interface ActionCardProps {
	idx: number;
	icon: React.ComponentType<{ size?: number }>;
	tone: 'pink' | 'teal' | 'indigo' | 'orange' | 'green' | 'blue' | 'red';
	title: string;
	body: string;
	keybinding?: string;
	disabled?: boolean;
	disabledReason?: string;
	onClick: () => void;
}

const ChakraButton = chakra('button');
const MotionDiv = motion.div;

const TONE_VAR: Record<ActionCardProps['tone'], string> = {
	pink: 'var(--beak-colors-accent-pink)',
	teal: 'var(--beak-colors-accent-teal)',
	indigo: 'var(--beak-colors-accent-indigo)',
	orange: 'var(--beak-colors-accent-warning)',
	green: 'var(--beak-colors-accent-success)',
	blue: 'var(--beak-colors-accent-info)',
	red: 'var(--beak-colors-accent-alert)',
};

const ActionCard: React.FC<ActionCardProps> = ({
	idx,
	icon: Icon,
	tone,
	title,
	body,
	keybinding,
	disabled,
	disabledReason,
	onClick,
}) => {
	const accent = TONE_VAR[tone];

	return (
		<MotionDiv
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 + idx * 0.05 }}
			style={{ display: 'flex', width: '100%', height: '100%' }}
		>
			<ChakraButton
				type='button'
				display='block'
				textAlign='left'
				w='100%'
				h='100%'
				p='3'
				borderRadius='lg'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
				cursor={disabled ? 'not-allowed' : 'pointer'}
				opacity={disabled ? 0.55 : 1}
				transition='border-color .14s ease, background-color .14s ease, transform .08s ease, box-shadow .14s ease'
				_hover={
					disabled
						? undefined
						: {
								borderColor: accent,
								bg: `color-mix(in srgb, ${accent} 7%, var(--beak-colors-bg-surface))`,
								transform: 'translateY(-2px)',
								boxShadow: `0 12px 28px color-mix(in srgb, ${accent} 22%, rgba(0,0,0,0.06))`,
						  }
				}
				_active={disabled ? undefined : { transform: 'translateY(-1px) scale(0.99)' }}
				_focusVisible={{
					outline: 'none',
					borderColor: accent,
					boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 28%, transparent)`,
				}}
				disabled={disabled}
				aria-disabled={disabled || undefined}
				title={disabled ? disabledReason : undefined}
				onClick={() => {
					if (!disabled) onClick();
				}}
			>
				<Flex align='flex-start' gap='2.5'>
					<Flex
						flex='0 0 auto'
						align='center'
						justify='center'
						w='32px'
						h='32px'
						borderRadius='md'
						css={{
							background: `color-mix(in srgb, ${accent} 14%, transparent)`,
							borderWidth: '1px',
							borderStyle: 'solid',
							borderColor: `color-mix(in srgb, ${accent} 30%, transparent)`,
							color: accent,
							boxShadow: `0 4px 12px color-mix(in srgb, ${accent} 22%, transparent), inset 0 1px 0 color-mix(in srgb, white 16%, transparent)`,
						}}
					>
						<Icon size={15} />
					</Flex>
					<Box flex='1 1 auto' minW={0}>
						<Flex align='center' gap='2' mb='0.5'>
							<Box fontSize='sm' fontWeight='600' color='fg.default' letterSpacing='-0.005em'>
								{title}
							</Box>
							{keybinding && (
								<Box
									fontSize='10px'
									color='fg.subtle'
									fontFamily='mono'
									px='1.5'
									py='0.5'
									borderRadius='sm'
									borderWidth='1px'
									borderColor='border.subtle'
									bg='bg.canvas'
								>
									{keybinding}
								</Box>
							)}
						</Flex>
						<Box fontSize='xs' color='fg.muted' lineHeight='1.45'>
							{disabled && disabledReason ? disabledReason : body}
						</Box>
					</Box>
				</Flex>
			</ChakraButton>
		</MotionDiv>
	);
};

export default ActionCard;
