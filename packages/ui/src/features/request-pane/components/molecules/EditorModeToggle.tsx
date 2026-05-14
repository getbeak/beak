import type { RequestEditorMode } from '@beak/common/types/beak-hub';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Pencil, ShieldCheck } from 'lucide-react';
import * as React from 'react';

interface EditorModeToggleProps {
	mode: RequestEditorMode;
	onChange: (mode: RequestEditorMode) => void;
}

interface Option {
	key: RequestEditorMode;
	label: string;
	hint: string;
	icon: typeof Pencil;
}

const OPTIONS: Option[] = [
	{ key: 'values', label: 'Values', hint: 'Fill in the contract', icon: Pencil },
	{ key: 'schema', label: 'Schema', hint: 'Define the contract', icon: ShieldCheck },
];

const ChakraButton = chakra('button');

/**
 * Segmented toggle between Values and Schema editor modes. Lives in the
 * Modifiers header next to the Body type selector. The Schema side shows
 * what the request *expects*; the Values side fills it in.
 */
const EditorModeToggle: React.FC<EditorModeToggleProps> = ({ mode, onChange }) => {
	return (
		<Flex
			align='center'
			h='22px'
			mr='2'
			borderRadius='full'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			p='0.5'
			gap='0.5'
		>
			{OPTIONS.map(opt => {
				const Icon = opt.icon;
				const isActive = opt.key === mode;
				return (
					<ChakraButton
						key={opt.key}
						type='button'
						aria-pressed={isActive}
						aria-label={`${opt.label} — ${opt.hint}`}
						title={`${opt.label} mode — ${opt.hint}`}
						onClick={() => onChange(opt.key)}
						display='inline-flex'
						alignItems='center'
						gap='1'
						h='18px'
						px='2'
						borderRadius='full'
						border='none'
						bg={isActive ? 'accent.pink' : 'transparent'}
						color={isActive ? 'fg.onAccent' : 'fg.muted'}
						fontSize='11px'
						fontWeight={isActive ? '600' : '500'}
						cursor='pointer'
						transition='color .12s ease, background-color .12s ease'
						_hover={
							isActive
								? undefined
								: {
										color: 'fg.default',
										bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 8%, transparent)',
									}
						}
						_focusVisible={{
							outline: 'none',
							boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent)',
						}}
					>
						<Icon size={11} strokeWidth={2} />
						<Box as='span'>{opt.label}</Box>
					</ChakraButton>
				);
			})}
		</Flex>
	);
};

export default EditorModeToggle;
