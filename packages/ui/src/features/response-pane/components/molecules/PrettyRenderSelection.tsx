import { Box, Flex } from '@chakra-ui/react';
import { Braces, ChevronDown, Eye } from 'lucide-react';
import * as React from 'react';

interface PrettyRenderSelectionProps {
	selectedLanguage: string | null;
	onSelectedLanguageChange: (lang: string) => void;
}

const PrettyRenderSelection: React.FC<PrettyRenderSelectionProps> = ({
	selectedLanguage,
	onSelectedLanguageChange,
}) => (
	<Flex
		align='center'
		gap='2'
		px='2.5'
		py='1.5'
		bg='color-mix(in srgb, var(--beak-colors-bg-surface) 65%, transparent)'
		backdropFilter='blur(12px) saturate(140%)'
		borderBottomWidth='1px'
		borderColor='border.subtle'
	>
		<Flex align='center' gap='1.5'>
			<Flex
				align='center'
				justify='center'
				w='20px'
				h='20px'
				borderRadius='sm'
				bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 28%, transparent)'
				color='accent.pink'
				boxShadow='inset 0 1px 0 color-mix(in srgb, white 14%, transparent)'
			>
				<Eye size={11} strokeWidth={2.2} />
			</Flex>
			<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
				{'View as'}
			</Box>
		</Flex>
		<Flex
			align='center'
			gap='1.5'
			px='2'
			h='26px'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.canvas'
			transition='border-color .14s ease, box-shadow .14s ease'
			_hover={{ borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 35%, var(--beak-colors-border-subtle))' }}
			_focusWithin={{
				borderColor: 'accent.pink',
				boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
			}}
		>
			<Box color='accent.pink' flexShrink={0}>
				<Braces size={11} strokeWidth={2.2} />
			</Box>
			<select
				value={selectedLanguage ?? 'text/plain'}
				onChange={e => onSelectedLanguageChange(e.currentTarget.value)}
				style={{
					flex: '1 1 auto',
					minWidth: 0,
					fontSize: '12px',
					fontWeight: 600,
					border: 0,
					background: 'transparent',
					color: 'var(--beak-colors-fg-default)',
					appearance: 'none',
					WebkitAppearance: 'none',
					MozAppearance: 'none',
					cursor: 'pointer',
					padding: 0,
					paddingRight: 16,
				}}
			>
				<optgroup label='Basic'>
					<option value='txt'>{'Text'}</option>
				</optgroup>
				<optgroup label='Rich'>
					<option value='json+viewer'>{'JSON tree'}</option>
					<option value='json'>{'JSON (raw)'}</option>
					<option value='xml'>{'XML'}</option>
					<option value='html'>{'HTML'}</option>
					<option value='css'>{'CSS'}</option>
				</optgroup>
				<optgroup label='Media'>
					<option value='image'>{'Image'}</option>
					<option value='video'>{'Video'}</option>
				</optgroup>
				<optgroup label='Other'>
					<option disabled>{'Web'}</option>
					<option value='hex'>{'Hex'}</option>
				</optgroup>
			</select>
			<Box color='fg.subtle' flexShrink={0}>
				<ChevronDown size={10} />
			</Box>
		</Flex>
	</Flex>
);

export default PrettyRenderSelection;
