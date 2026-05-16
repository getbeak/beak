import DebouncedInput from '@beak/ui/components/atoms/DebouncedInput';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Cookie as CookieIcon, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';

import {
	type CookieHeaderPair,
	isPlainStringValue,
	parseCookieHeader,
	serialiseCookieHeader,
	valueSectionsToPlainString,
} from '../../cookie-header';

interface CookieHeaderEditorProps {
	value: ValueSections;
	readOnly?: boolean;
	onChange: (next: ValueSections) => void;
}

/**
 * Sub-panel rendered below a header row whose name is `Cookie`. The
 * default surface for editing what would otherwise be a fragile
 * `name=value; name=value` string: each pair is a row with its own
 * inputs and delete affordance. Edits debounce-write back through the
 * existing `updateItem('value', …)` channel, so the rest of the
 * request editor — variable resolution, persistence, schema authoring
 * — keeps working unchanged.
 *
 * Falls back to a notice when the header value carries variable refs;
 * the rich editor only round-trips plain literals.
 */
const MotionPanel = motion.create(
	chakra('div', {
		base: {
			gridColumn: '1 / -1',
			borderBottomWidth: '1px',
			borderColor: 'border.subtle',
			overflow: 'hidden',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, transparent)',
		},
	}),
);

const ChakraButton = chakra('button');

const CookieHeaderEditor: React.FC<CookieHeaderEditorProps> = ({ value, readOnly, onChange }) => {
	const plain = useMemo(() => isPlainStringValue(value), [value]);
	const text = useMemo(() => valueSectionsToPlainString(value), [value]);
	const pairs = useMemo(() => parseCookieHeader(text), [text]);

	function commit(next: CookieHeaderPair[]) {
		onChange([serialiseCookieHeader(next)]);
	}

	function updatePair(index: number, patch: Partial<CookieHeaderPair>) {
		const next = pairs.map((p, i) => (i === index ? { ...p, ...patch } : p));
		commit(next);
	}

	function addPair() {
		commit([...pairs, { name: '', value: '' }]);
	}

	function removePair(index: number) {
		commit(pairs.filter((_, i) => i !== index));
	}

	return (
		<MotionPanel
			key='cookie-panel'
			initial={{ height: 0, opacity: 0 }}
			animate={{ height: 'auto', opacity: 1 }}
			exit={{ height: 0, opacity: 0 }}
			transition={{ duration: 0.18, ease: 'easeOut' }}
		>
			<Flex direction='column' gap='2' p='2.5'>
				<Flex
					align='center'
					gap='1.5'
					fontSize='10.5px'
					fontWeight='700'
					letterSpacing='0.06em'
					textTransform='uppercase'
					color='accent.pink'
				>
					<CookieIcon size={11} strokeWidth={2.2} />
					<Box as='span'>{'Cookies'}</Box>
					<Box as='span' fontWeight='500' color='fg.subtle' textTransform='none' letterSpacing='0.005em'>
						{pairs.length === 0 ? 'no pairs yet' : pairs.length === 1 ? '1 pair' : `${pairs.length} pairs`}
					</Box>
				</Flex>

				{!plain && (
					<Box
						p='2'
						borderRadius='md'
						borderWidth='1px'
						borderColor='color-mix(in srgb, var(--beak-colors-accent-warning) 32%, transparent)'
						bg='color-mix(in srgb, var(--beak-colors-accent-warning) 8%, transparent)'
						color='accent.warning'
						fontSize='11px'
						lineHeight='1.4'
					>
						{
							'This Cookie header references a variable. Structured editing is disabled — edit the value cell above to keep your variable reference intact.'
						}
					</Box>
				)}

				{plain && (
					<Flex direction='column' gap='1'>
						{pairs.length === 0 && (
							<Box fontSize='11px' color='fg.subtle'>
								{'No cookies yet — add one below.'}
							</Box>
						)}
						{pairs.map((pair, idx) => (
							<Flex key={`${idx}-${pair.name}`} align='center' gap='1.5'>
								<Box flex='0 0 38%'>
									<DebouncedInput
										type='text'
										value={pair.name}
										disabled={readOnly}
										placeholder='name'
										onChange={v => updatePair(idx, { name: v })}
									/>
								</Box>
								<Box flex='1 1 auto'>
									<DebouncedInput
										type='text'
										value={pair.value}
										disabled={readOnly}
										placeholder='value'
										onChange={v => updatePair(idx, { value: v })}
									/>
								</Box>
								<ChakraButton
									type='button'
									aria-label='Remove cookie pair'
									title='Remove this cookie pair'
									disabled={readOnly}
									onClick={() => removePair(idx)}
									display='inline-flex'
									alignItems='center'
									justifyContent='center'
									w='22px'
									h='22px'
									border='none'
									bg='transparent'
									color='fg.subtle'
									cursor={readOnly ? 'default' : 'pointer'}
									transition='color .12s ease'
									_hover={readOnly ? undefined : { color: 'accent.alert' }}
								>
									<Trash2 size={11} strokeWidth={2.2} />
								</ChakraButton>
							</Flex>
						))}

						{!readOnly && (
							<ChakraButton
								type='button'
								onClick={addPair}
								display='inline-flex'
								alignItems='center'
								justifyContent='center'
								gap='1'
								mt='1'
								h='24px'
								border='1px dashed'
								borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent)'
								borderRadius='md'
								bg='transparent'
								color='accent.pink'
								fontSize='11px'
								fontWeight='600'
								letterSpacing='-0.005em'
								cursor='pointer'
								transition='background-color .12s ease, color .12s ease, border-color .12s ease'
								_hover={{
									bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
									borderColor: 'accent.pink',
								}}
							>
								<Plus size={10} strokeWidth={2.4} />
								<Box as='span'>{'Add cookie'}</Box>
							</ChakraButton>
						)}
					</Flex>
				)}
			</Flex>
		</MotionPanel>
	);
};

export default CookieHeaderEditor;
