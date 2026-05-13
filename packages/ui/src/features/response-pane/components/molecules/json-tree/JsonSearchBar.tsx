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

	return (
		<Flex
			align='center'
			gap='1.5'
			px='2'
			py='1'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
		>
			<Search size={12} color='var(--beak-colors-fg-subtle)' />
			<Box flex='1 1 auto'>
				<Input
					ref={inputRef}
					size='xs'
					value={value}
					placeholder='Search keys & values…'
					onChange={e => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					bg='transparent'
					borderWidth='1px'
					borderColor='border.default'
					_focus={{ borderColor: 'accent.pink', outline: 'none' }}
					h='22px'
					fontSize='xs'
				/>
			</Box>
			<Text fontSize='xs' color='fg.subtle' minW='44px' textAlign='right'>
				{hitCount === 0 ? '0 hits' : `${hitIndex + 1}/${hitCount}`}
			</Text>
			<IconButton
				aria-label='Previous hit'
				size='xs'
				variant='ghost'
				h='22px'
				w='22px'
				minW='22px'
				onClick={onPrev}
				disabled={hitCount === 0}
			>
				<ChevronUp size={12} />
			</IconButton>
			<IconButton
				aria-label='Next hit'
				size='xs'
				variant='ghost'
				h='22px'
				w='22px'
				minW='22px'
				onClick={onNext}
				disabled={hitCount === 0}
			>
				<ChevronDown size={12} />
			</IconButton>
			<IconButton
				aria-label='Close search'
				size='xs'
				variant='ghost'
				h='22px'
				w='22px'
				minW='22px'
				onClick={onClose}
			>
				<X size={12} />
			</IconButton>
		</Flex>
	);
};

export default JsonSearchBar;
