import { Box, Flex, chakra } from '@chakra-ui/react';
import type { EditorMode } from '@beak/ui/features/graphql-editor/types';
import { editorTabSubItems } from '@beak/ui/features/graphql-editor/utils';
import { Braces, ChevronDown, FileText, Hash, Network, Type, type LucideIcon } from 'lucide-react';
import type { RequestBodyType } from '@getbeak/types/request';
import * as React from 'react';

interface BodyTypeSelectorProps {
	value: RequestBodyType;
	graphQlMode: EditorMode;
	onTypeChange: (type: RequestBodyType) => void;
	onGraphQlModeChange: (mode: EditorMode) => void;
}

interface Variant {
	key: RequestBodyType;
	label: string;
	icon: LucideIcon;
}

const VARIANTS: Variant[] = [
	{ key: 'text', label: 'Text', icon: Type },
	{ key: 'json', label: 'JSON', icon: Braces },
	{ key: 'url_encoded_form', label: 'Form', icon: Network },
	{ key: 'graphql', label: 'GraphQL', icon: Hash },
	{ key: 'file', label: 'File', icon: FileText },
];

const ChakraButton = chakra('button');

const BodyTypeSelector: React.FC<BodyTypeSelectorProps> = ({
	value,
	graphQlMode,
	onTypeChange,
	onGraphQlModeChange,
}) => (
	<Flex
		align='center'
		justify='center'
		py='3'
		px='3'
		borderBottomWidth='1px'
		borderColor='border.subtle'
	>
		<Flex
			align='center'
			gap='1'
			p='1'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 60%, transparent)'
			boxShadow='inset 0 1px 0 color-mix(in srgb, white 10%, transparent)'
		>
			{VARIANTS.map(v => {
				const active = value === v.key;
				const Icon = v.icon;
				return (
					<ChakraButton
						key={v.key}
						type='button'
						display='inline-flex'
						alignItems='center'
						gap='1.5'
						position='relative'
						px='2.5'
						py='1.5'
						h='28px'
						borderRadius='md'
						bg={active ? 'accent.pink' : 'transparent'}
						boxShadow={
							active
								? '0 2px 8px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
								: undefined
						}
						border='none'
						cursor='pointer'
						fontSize='xs'
						fontWeight={active ? '600' : '500'}
						color={active ? 'fg.onAccent' : 'fg.muted'}
						transition='background-color .14s ease, color .14s ease, box-shadow .14s ease, transform .08s ease'
						_hover={{
							color: active ? 'fg.onAccent' : 'accent.pink',
							bg: active
								? 'accent.pink'
								: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
						}}
						_focusVisible={{
							outline: 'none',
							boxShadow: active
								? '0 2px 8px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent), 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent)'
								: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
						}}
						_active={{ transform: 'scale(0.97)' }}
						onClick={() => onTypeChange(v.key)}
					>
						<Icon size={12} strokeWidth={active ? 2.2 : 1.8} />
						<Box as='span'>{v.label}</Box>
						{v.key === 'graphql' && active && (
							<GraphQlModeSwitch mode={graphQlMode} onChange={onGraphQlModeChange} />
						)}
					</ChakraButton>
				);
			})}
		</Flex>
	</Flex>
);

interface GraphQlModeSwitchProps {
	mode: EditorMode;
	onChange: (mode: EditorMode) => void;
}

const GraphQlModeSwitch: React.FC<GraphQlModeSwitchProps> = ({ mode, onChange }) => {
	const [open, setOpen] = React.useState(false);
	const label = editorTabSubItems.find(s => s.key === mode)?.label ?? mode;

	React.useEffect(() => {
		if (!open) return void 0;
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				setOpen(false);
			}
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open]);

	return (
		<Flex
			as='span'
			align='center'
			gap='0.5'
			ml='0.5'
			pl='1.5'
			borderLeftWidth='1px'
			borderLeftColor='color-mix(in srgb, var(--beak-colors-fg-onAccent) 30%, transparent)'
			cursor='pointer'
			fontSize='10px'
			fontWeight='500'
			color='color-mix(in srgb, var(--beak-colors-fg-onAccent) 92%, transparent)'
			onClick={event => {
				event.stopPropagation();
				setOpen(prev => !prev);
			}}
		>
			{label}
			<ChevronDown size={10} />
			{open && (
				<Box
					position='absolute'
					top='34px'
					left='50%'
					transform='translateX(-50%)'
					bg='color-mix(in srgb, var(--beak-colors-bg-surface) 70%, transparent)'
					backdropFilter='blur(24px) saturate(180%)'
					borderWidth='1px'
					borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 26%, var(--beak-colors-border-subtle))'
					borderRadius='lg'
					boxShadow='0 28px 64px rgba(0,0,0,0.32), 0 8px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 16%, rgba(0,0,0,0.15)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
					p='1'
					minW='140px'
					zIndex={10}
					onClick={event => event.stopPropagation()}
				>
					{editorTabSubItems.map(s => {
						const isActive = s.key === mode;
						return (
							<Box
								key={s.key}
								as='button'
								display='block'
								w='100%'
								textAlign='left'
								px='2'
								py='1.5'
								borderRadius='md'
								bg={isActive ? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' : 'transparent'}
								border='none'
								fontSize='xs'
								color={isActive ? 'accent.pink' : 'fg.default'}
								fontWeight={isActive ? '600' : '500'}
								cursor='pointer'
								transition='background-color .12s ease, color .12s ease'
								_hover={{ bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)', color: 'accent.pink' }}
								_focusVisible={{
									outline: 'none',
									bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 18%, transparent)',
									color: 'accent.pink',
									boxShadow: 'inset 0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)',
								}}
								onClick={() => {
									onChange(s.key);
									setOpen(false);
								}}
							>
								{s.label}
							</Box>
						);
					})}
				</Box>
			)}
		</Flex>
	);
};

export default BodyTypeSelector;
