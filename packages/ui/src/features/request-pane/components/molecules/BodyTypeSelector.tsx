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
								? '0 2px 8px color-mix(in srgb, var(--beak-colors-accent-pink) 38%, transparent)'
								: undefined
						}
						border='none'
						cursor='pointer'
						fontSize='xs'
						fontWeight={active ? '600' : '500'}
						color={active ? 'white' : 'fg.muted'}
						transition='background-color .14s ease, color .14s ease, box-shadow .14s ease'
						_hover={{
							color: active ? 'white' : 'fg.default',
							bg: active
								? 'accent.pink'
								: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
						}}
						onClick={() => onTypeChange(v.key)}
					>
						<Icon size={12} />
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

	return (
		<Flex
			as='span'
			align='center'
			gap='0.5'
			ml='0.5'
			pl='1.5'
			borderLeftWidth='1px'
			borderLeftColor='rgba(255,255,255,0.3)'
			cursor='pointer'
			fontSize='10px'
			fontWeight='500'
			color='white'
			opacity={0.92}
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
					top='32px'
					left='50%'
					transform='translateX(-50%)'
					bg='bg.surface'
					borderWidth='1px'
					borderColor='border.default'
					borderRadius='md'
					boxShadow='0 8px 24px rgba(0,0,0,0.25)'
					py='1'
					minW='120px'
					zIndex={10}
					onClick={event => event.stopPropagation()}
				>
					{editorTabSubItems.map(s => (
						<Box
							key={s.key}
							as='button'
							display='block'
							w='100%'
							textAlign='left'
							px='2.5'
							py='1'
							bg='transparent'
							border='none'
							fontSize='xs'
							color={s.key === mode ? 'accent.pink' : 'fg.default'}
							fontWeight={s.key === mode ? '600' : '500'}
							cursor='pointer'
							_hover={{ bg: 'bg.surface.emphasized' }}
							onClick={() => {
								onChange(s.key);
								setOpen(false);
							}}
						>
							{s.label}
						</Box>
					))}
				</Box>
			)}
		</Flex>
	);
};

export default BodyTypeSelector;
