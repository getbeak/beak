import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import React from 'react';

interface DialogProps {
	onClose: () => void;
	size?: 'sm' | 'md' | 'lg';
	tone?: 'pink' | 'teal' | 'indigo' | 'alert';
}

const TONE_ACCENT: Record<NonNullable<DialogProps['tone']>, string> = {
	pink: 'var(--beak-colors-accent-pink)',
	teal: 'var(--beak-colors-accent-teal)',
	indigo: 'var(--beak-colors-accent-indigo)',
	alert: 'var(--beak-colors-accent-alert)',
};

/**
 * Beak's modal dialog — Chakra v3 `Dialog.Root` under the hood, with a
 * frosted-glass aesthetic: translucent surface, heavy backdrop blur,
 * brand-tinted sunrise gradient at the top, layered glow shadow, and a
 * fine sheen line that picks up pink → teal across the top edge.
 */
const Dialog: React.FC<React.PropsWithChildren<DialogProps>> = ({ children, onClose, size = 'md', tone = 'pink' }) => {
	const accent = TONE_ACCENT[tone];

	return (
		<ChakraDialog.Root
			open
			onOpenChange={details => {
				if (!details.open) onClose();
			}}
			motionPreset='scale'
			size={size}
			placement='center'
			closeOnInteractOutside
		>
			<Portal>
				<ChakraDialog.Backdrop
					bg='color-mix(in srgb, var(--beak-colors-gray-950) 42%, transparent)'
					backdropFilter='blur(16px) saturate(160%)'
					css={{
						'@supports not (backdrop-filter: blur(8px))': {
							background: 'color-mix(in srgb, var(--beak-colors-gray-950) 78%, transparent)',
						},
					}}
				/>
				<ChakraDialog.Positioner>
					<ChakraDialog.Content
						maxW='unset'
						w='auto'
						bg='color-mix(in srgb, var(--beak-colors-bg-surface) 68%, transparent)'
						borderWidth='1px'
						borderColor={`color-mix(in srgb, ${accent} 30%, var(--beak-colors-border-subtle))`}
						borderRadius='xl'
						boxShadow={`
							0 50px 120px rgba(0, 0, 0, 0.42),
							0 20px 56px color-mix(in srgb, ${accent} 22%, rgba(0, 0, 0, 0.2)),
							0 0 0 1px color-mix(in srgb, white 6%, transparent),
							inset 0 1px 0 color-mix(in srgb, white 22%, transparent),
							inset 0 -1px 0 color-mix(in srgb, var(--beak-colors-gray-950) 10%, transparent)
						`}
						p='0'
						overflow='hidden'
						backdropFilter='blur(28px) saturate(180%)'
						css={{
							position: 'relative',
							'&::before': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								height: '140px',
								background: `
									radial-gradient(60% 100% at 18% 0%, color-mix(in srgb, ${accent} 32%, transparent), transparent 65%),
									radial-gradient(70% 110% at 88% 0%, color-mix(in srgb, var(--beak-colors-accent-teal) 22%, transparent), transparent 70%)
								`,
								pointerEvents: 'none',
								zIndex: 0,
							},
							'&::after': {
								content: '""',
								position: 'absolute',
								top: 0,
								left: '6%',
								right: '6%',
								height: '1px',
								background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 85%, transparent) 30%, color-mix(in srgb, var(--beak-colors-accent-teal) 75%, transparent) 70%, transparent)`,
								pointerEvents: 'none',
								zIndex: 1,
							},
							'& > *': { position: 'relative', zIndex: 2 },
						}}
					>
						{children}
					</ChakraDialog.Content>
				</ChakraDialog.Positioner>
			</Portal>
		</ChakraDialog.Root>
	);
};

export default Dialog;
