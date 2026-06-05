import { glassChakraProps } from '@beak/ui/lib/glass';
import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import * as React from 'react';

interface DialogProps {
	onClose: () => void;
	size?: 'sm' | 'md' | 'lg';
	/**
	 * Accent colour for the header icon and (subtle) bottom-border tint. The
	 * dialog surface itself stays neutral so content reads clearly — the tone
	 * is a quiet signal, not a paint job.
	 */
	tone?: 'pink' | 'teal' | 'indigo' | 'alert';
}

const TONE_ACCENT: Record<NonNullable<DialogProps['tone']>, string> = {
	pink: 'var(--beak-colors-accent-pink)',
	teal: 'var(--beak-colors-accent-teal)',
	indigo: 'var(--beak-colors-accent-indigo)',
	alert: 'var(--beak-colors-accent-alert)',
};

interface DialogToneContextValue {
	accent: string;
	tone: NonNullable<DialogProps['tone']>;
}

const DialogToneContext = React.createContext<DialogToneContextValue>({
	accent: TONE_ACCENT.pink,
	tone: 'pink',
});

/**
 * Beak's modal dialog. Solid surface, neutral shadow, no decorative gradients
 * or sheen lines — text contrast is the priority. The accent tone is exposed
 * via context so `DialogHeader` can colour its icon without each dialog
 * threading the tone through its own props.
 *
 * Layouts should compose via `DialogHeader`, `DialogBody`, and `DialogFooter`
 * rather than handing the `Dialog` arbitrary padded boxes. That keeps every
 * dialog in the app on the same baseline rhythm.
 */
const Dialog: React.FC<React.PropsWithChildren<DialogProps>> = ({ children, onClose, size = 'md', tone = 'pink' }) => {
	const accent = TONE_ACCENT[tone];
	const toneValue = React.useMemo(() => ({ accent, tone }), [accent, tone]);

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
					bg='color-mix(in srgb, var(--beak-colors-gray-950) 55%, transparent)'
					backdropFilter='blur(10px) saturate(140%)'
					css={{
						'@supports not (backdrop-filter: blur(8px))': {
							background: 'color-mix(in srgb, var(--beak-colors-gray-950) 82%, transparent)',
						},
					}}
				/>
				<ChakraDialog.Positioner>
					<ChakraDialog.Content
						maxW='unset'
						w='auto'
						{...glassChakraProps.dialog}
						borderRadius='lg'
						p='0'
						overflow='hidden'
						css={{ WebkitBackdropFilter: 'blur(36px) saturate(180%)' }}
					>
						<DialogToneContext.Provider value={toneValue}>{children}</DialogToneContext.Provider>
					</ChakraDialog.Content>
				</ChakraDialog.Positioner>
			</Portal>
		</ChakraDialog.Root>
	);
};

interface DialogHeaderProps {
	icon?: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
}

/**
 * Standard dialog header: optional icon chip (tinted with the dialog's tone),
 * title, optional one-line description underneath. Always has a bottom border
 * so the body's reading boundary is unambiguous.
 */
export const DialogHeader: React.FC<DialogHeaderProps> = ({ icon, title, description }) => {
	const { accent } = React.useContext(DialogToneContext);
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				padding: '14px 20px',
				borderBottom: '1px solid var(--beak-colors-border-subtle)',
			}}
		>
			{icon && (
				<div
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						width: '28px',
						height: '28px',
						flex: '0 0 auto',
						borderRadius: '999px',
						background: `color-mix(in srgb, ${accent} 14%, transparent)`,
						color: accent,
					}}
				>
					{icon}
				</div>
			)}
			<div style={{ minWidth: 0, flex: '1 1 auto' }}>
				<div
					style={{
						fontSize: '14px',
						fontWeight: 600,
						color: 'var(--beak-colors-fg-default)',
						lineHeight: 1.25,
						letterSpacing: '-0.005em',
					}}
				>
					{title}
				</div>
				{description && (
					<div
						style={{
							marginTop: '2px',
							fontSize: '12px',
							color: 'var(--beak-colors-fg-muted)',
							lineHeight: 1.4,
						}}
					>
						{description}
					</div>
				)}
			</div>
		</div>
	);
};

interface DialogBodyProps {
	/** Override the standard padding. Use sparingly. */
	padding?: string;
}

/**
 * Standard dialog body. Holds the dialog's actual content. Forms typically
 * stack inside this — fields use the surrounding `bg.surface` so they don't
 * pop visually like the old white-on-translucent tiles did.
 */
export const DialogBody: React.FC<React.PropsWithChildren<DialogBodyProps>> = ({ children, padding = '16px 20px' }) => (
	<div style={{ padding, color: 'var(--beak-colors-fg-default)' }}>{children}</div>
);

/**
 * Standard dialog footer. Right-aligns buttons; top border separates from
 * the body so action affordances read distinct from content.
 */
export const DialogFooter: React.FC<React.PropsWithChildren> = ({ children }) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'flex-end',
			gap: '8px',
			padding: '12px 20px',
			borderTop: '1px solid var(--beak-colors-border-subtle)',
			background: 'var(--beak-colors-bg-canvas)',
		}}
	>
		{children}
	</div>
);

export default Dialog;
