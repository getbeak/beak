import { Box, Flex, IconButton, Input, Text } from '@chakra-ui/react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import * as React from 'react';

interface JsonSearchBarProps {
	value: string;
	hitCount: number;
	hitIndex: number;
	onChange: (v: string) => void;
	onNext: () => void;
	onPrev: () => void;
	onClose: () => void;
}

const JsonSearchBar: React.FC<JsonSearchBarProps> = ({
	value,
	hitCount,
	hitIndex,
	onChange,
	onNext,
	onPrev,
	onClose,
}) => {
	const inputRef = React.useRef<HTMLInputElement>(null);

	React.useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (event.shiftKey) onPrev();
			else onNext();
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			onClose();
		}
	}

	const hasHits = hitCount > 0;
	const noResults = value.length > 0 && !hasHits;

	return (
		<Flex
			align='center'
			gap='1.5'
			px='2.5'
			py='1.5'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 65%, transparent)'
			backdropFilter='blur(12px) saturate(140%)'
		>
			<Flex
				align='center'
				flex='1 1 auto'
				gap='1.5'
				px='2'
				h='26px'
				borderRadius='md'
				borderWidth='1px'
				borderColor={noResults ? 'accent.alert' : 'border.default'}
				bg='bg.canvas'
				transition='border-color .14s ease, box-shadow .14s ease'
				_focusWithin={{
					borderColor: noResults ? 'accent.alert' : 'accent.pink',
					boxShadow: `0 0 0 2px color-mix(in srgb, ${noResults ? 'var(--beak-colors-accent-alert)' : 'var(--beak-colors-accent-pink)'} 22%, transparent)`,
				}}
			>
				<Search size={11} color='var(--beak-colors-fg-subtle)' />
				<Box flex='1 1 auto'>
					<Input
						ref={inputRef}
						size='xs'
						value={value}
						placeholder='Search keys & values…'
						onChange={e => onChange(e.target.value)}
						onKeyDown={handleKeyDown}
						bg='transparent'
						border='none'
						outline='none'
						p='0'
						h='auto'
						fontSize='xs'
						color='fg.default'
						_focus={{ borderColor: 'transparent', outline: 'none', boxShadow: 'none' }}
						_placeholder={{ color: 'fg.subtle' }}
					/>
				</Box>
				<Text fontSize='10px' color={noResults ? 'accent.alert' : 'fg.subtle'} minW='48px' textAlign='right' fontFamily='mono' fontWeight='700' letterSpacing='0.06em' style={{ fontVariantNumeric: 'tabular-nums' }}>
					{value.length === 0
						? ''
						: hasHits
							? `${hitIndex + 1}/${hitCount}`
							: 'NO HITS'}
				</Text>
			</Flex>
			<IconButton
				aria-label='Previous hit'
				title='Previous hit (Shift+Enter)'
				size='xs'
				variant='ghost'
				h='26px'
				w='26px'
				minW='26px'
				color='fg.subtle'
				_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' }}
				onClick={onPrev}
				disabled={!hasHits}
			>
				<ChevronUp size={12} />
			</IconButton>
			<IconButton
				aria-label='Next hit'
				title='Next hit (Enter)'
				size='xs'
				variant='ghost'
				h='26px'
				w='26px'
				minW='26px'
				color='fg.subtle'
				_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' }}
				onClick={onNext}
				disabled={!hasHits}
			>
				<ChevronDown size={12} />
			</IconButton>
			<IconButton
				aria-label='Close search'
				title='Close (Esc)'
				size='xs'
				variant='ghost'
				h='26px'
				w='26px'
				minW='26px'
				color='fg.subtle'
				_hover={{ color: 'accent.pink', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)' }}
				onClick={onClose}
			>
				<X size={12} />
			</IconButton>
		</Flex>
	);
};

export default JsonSearchBar;
