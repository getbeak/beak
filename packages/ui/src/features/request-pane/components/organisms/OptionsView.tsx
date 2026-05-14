import { actions } from '@beak/ui/store/project';
import { Box, chakra, Flex } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { CornerDownRight } from 'lucide-react';
import * as React from 'react';
import { useId } from 'react';
import { useDispatch } from 'react-redux';

export interface OptionsViewProps {
	node: ValidRequestNode;
}

interface OptionRowProps {
	icon: React.ReactNode;
	title: string;
	description: string;
	checked: boolean;
	onChange: (next: boolean) => void;
}

const HiddenCheckbox = chakra('input', {
	base: {
		position: 'absolute',
		opacity: 0,
		w: '100%',
		h: '100%',
		m: 0,
		cursor: 'pointer',
		_focus: {
			'+ * [data-toggle-track]': {
				boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)',
			},
		},
	},
});

interface ToggleSwitchProps {
	checked: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked }) => (
	<Box
		data-toggle-track
		as='span'
		position='relative'
		display='inline-block'
		flex='0 0 auto'
		w='30px'
		h='18px'
		borderRadius='full'
		borderWidth='1px'
		borderColor={checked ? 'accent.pink' : 'border.default'}
		bg={checked ? 'accent.pink' : 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 80%, transparent)'}
		boxShadow={
			checked
				? '0 0 0 0.5px color-mix(in srgb, white 22%, transparent) inset, 0 2px 8px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, transparent)'
				: 'inset 0 1px 2px rgba(0,0,0,0.06)'
		}
		transition='background-color .18s ease, border-color .18s ease, box-shadow .18s ease'
		pointerEvents='none'
	>
		<Box
			as='span'
			position='absolute'
			top='1px'
			left={checked ? '13px' : '1px'}
			w='14px'
			h='14px'
			borderRadius='full'
			bg='white'
			boxShadow='0 1px 2px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04)'
			transition='left .18s cubic-bezier(.4,0,.2,1)'
		/>
	</Box>
);

const OptionRow: React.FC<OptionRowProps> = ({ icon, title, description, checked, onChange }) => {
	const id = useId();
	return (
		<Flex
			as='label'
			htmlFor={id}
			align='center'
			gap='3'
			px='3'
			py='2.5'
			position='relative'
			cursor='pointer'
			borderRadius='md'
			transition='background-color .12s ease'
			_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)' }}
		>
			<HiddenCheckbox
				type='checkbox'
				id={id}
				checked={checked}
				onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked)}
			/>
			<Flex
				align='center'
				justify='center'
				w='28px'
				h='28px'
				flex='0 0 auto'
				borderRadius='md'
				borderWidth='1px'
				borderColor={checked ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)' : 'border.subtle'}
				bg={
					checked
						? 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
						: 'color-mix(in srgb, var(--beak-colors-bg-surface-alt) 60%, transparent)'
				}
				color={checked ? 'accent.pink' : 'fg.subtle'}
				transition='color .12s ease, background-color .12s ease, border-color .12s ease'
			>
				{icon}
			</Flex>
			<Box flex='1 1 auto' minW={0}>
				<Box as='span' display='block' color='fg.default' fontSize='13px' fontWeight='600' letterSpacing='-0.005em'>
					{title}
				</Box>
				<Box as='span' display='block' color='fg.subtle' fontSize='11px' lineHeight='1.4' mt='0.5'>
					{description}
				</Box>
			</Box>
			<ToggleSwitch checked={checked} />
		</Flex>
	);
};

const SectionLabel = chakra('div', {
	base: {
		fontSize: '10px',
		fontWeight: '700',
		letterSpacing: '0.08em',
		textTransform: 'uppercase',
		color: 'fg.subtle',
		px: '3',
		mb: '1.5',
	},
});

const OptionsView: React.FC<OptionsViewProps> = ({ node }) => {
	const options = node.info.options;
	const dispatch = useDispatch();

	return (
		<Box px='3' py='3' h='100%' overflowY='auto'>
			<Box maxW='560px'>
				<SectionLabel>{'Network'}</SectionLabel>
				<Box
					borderWidth='1px'
					borderColor='border.subtle'
					borderRadius='lg'
					bg='color-mix(in srgb, var(--beak-colors-bg-surface) 50%, transparent)'
					p='1'
				>
					<OptionRow
						icon={<CornerDownRight size={13} strokeWidth={2} />}
						title='Follow redirects'
						description='Automatically follow HTTP 3xx Location headers (up to the runtime cap).'
						checked={options.followRedirects}
						onChange={next =>
							dispatch(
								actions.requestOptionFollowRedirects({
									requestId: node.id,
									followRedirects: next,
								}),
							)
						}
					/>
				</Box>
			</Box>
		</Box>
	);
};

export default OptionsView;
