import { Box, Flex, Menu, Portal, chakra } from '@chakra-ui/react';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { requestPreferenceSetReqMainTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { motion } from 'framer-motion';
import { ChevronDown, Loader2, Send } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import URL from 'url-parse';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';

export interface HeaderProps {
	node: ValidRequestNode;
}

const VERB_COLOR: Record<string, string> = {
	get: 'var(--beak-colors-accent-teal)',
	post: 'var(--beak-colors-accent-pink)',
	put: 'var(--beak-colors-accent-indigo)',
	patch: 'var(--beak-colors-accent-indigo)',
	delete: 'var(--beak-colors-accent-alert)',
	head: 'var(--beak-colors-fg-muted)',
	options: 'var(--beak-colors-fg-muted)',
};

const VERBS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const ChakraButton = chakra('button');

const Header: React.FC<HeaderProps> = ({ node }) => {
	const dispatch = useDispatch();
	const currentFlight = useAppSelector(s => s.global.flight.activeFlights[node.id]);
	const flighting = Boolean(currentFlight);
	const context = useVariableContext(node.id);
	const verb = node.info.verb;
	const verbColor = VERB_COLOR[verb] ?? 'var(--beak-colors-accent-pink)';

	function dispatchFlightRequest() {
		dispatch(requestFlight());
	}

	function urlQueryStringDetected() {
		dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab: 'url_query' }));
	}

	async function handleUrlChange(parts: ValueSections) {
		const value = await parseValueSections(context, parts);
		let sanitizedParts = [...parts];
		const parsed = new URL(value, true);

		if (Object.keys(parsed.query).length) {
			Object.keys(parsed.query).forEach(key => {
				dispatch(requestQueryAdded({
					requestId: node.id,
					name: key,
					value: [parsed.query[key]!],
				}));
			});
		}

		if (value.includes('?')) {
			const searchIndex = parts.findIndex(p => typeof p === 'string' && p.includes('?'));
			const searchPartIndex = (parts[searchIndex] as string).indexOf('?');

			sanitizedParts = parts.slice(0, searchIndex);
			sanitizedParts.push((parts[searchIndex] as string).slice(0, searchPartIndex));

			dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab: 'url_query' }));
		}

		dispatch(requestUriUpdated({
			requestId: node.id,
			url: sanitizedParts,
		}));
	}

	return (
		<Flex
			align='center'
			gap='2'
			my='4'
			px='2.5'
			fontSize='md'
			maxW='calc(100% - 20px)'
			css={{ '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }}
		>
			<Menu.Root>
				<Menu.Trigger asChild>
					<ChakraButton
						type='button'
						display='inline-flex'
						alignItems='center'
						gap='1'
						px='2'
						py='1.5'
						borderRadius='md'
						borderWidth='1px'
						borderColor='border.default'
						bg='bg.surface'
						color='fg.default'
						fontWeight='700'
						fontSize='xs'
						letterSpacing='0.06em'
						textTransform='uppercase'
						cursor='pointer'
						transition='border-color .12s ease, box-shadow .12s ease'
						_hover={{ borderColor: verbColor }}
						_focus={{
							outline: 'none',
							borderColor: verbColor,
							boxShadow: `0 0 0 3px color-mix(in srgb, ${verbColor} 28%, transparent)`,
						}}
						style={{ color: verbColor, borderLeft: `3px solid ${verbColor}` }}
					>
						{verb.toUpperCase()}
						<ChevronDown size={11} />
					</ChakraButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content
							bg='bg.surface'
							borderWidth='1px'
							borderColor='border.default'
							borderRadius='md'
							boxShadow='0 8px 32px rgba(0,0,0,0.2)'
							p='1'
							minW='120px'
						>
							{VERBS.map(v => {
								const c = VERB_COLOR[v] ?? 'var(--beak-colors-fg-muted)';
								return (
									<Menu.Item
										key={v}
										value={v}
										onClick={() =>
											dispatch(requestUriUpdated({ requestId: node.id, verb: v }))
										}
										fontSize='xs'
										fontWeight='700'
										textTransform='uppercase'
										letterSpacing='0.05em'
										style={{ color: c }}
										_hover={{
											bg: `color-mix(in srgb, ${c} 18%, transparent)`,
										}}
									>
										{v}
									</Menu.Item>
								);
							})}
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>

			<Box
				flex='1 1 auto'
				minW={0}
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.default'
				bg='bg.surface'
				transition='border-color .12s ease, box-shadow .12s ease'
				_focusWithin={{
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
				}}
				css={{
					'> div > article': {
						padding: '7px 8px',
						background: 'transparent',
						border: 'none',
						color: 'var(--beak-colors-fg-default)',
						fontSize: '13px',
						fontWeight: 400,
						outline: 'none',
					},
					'> div > article:focus-within': {
						outline: 'none',
					},
				}}
			>
				<VariableInput
					requestId={node.id}
					parts={node.info.url}
					placeholder='httpbin.org'
					onChange={e => handleUrlChange(e)}
					onUrlQueryStringDetection={urlQueryStringDetected}
				/>
			</Box>

			<ChakraButton
				type='button'
				flex='0 0 auto'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				gap='1'
				px='3'
				py='1.5'
				h='32px'
				minW='80px'
				borderRadius='md'
				borderWidth='1px'
				borderColor='accent.teal'
				bg='color-mix(in srgb, var(--beak-colors-accent-teal) 18%, transparent)'
				color='accent.teal'
				fontWeight='700'
				fontSize='xs'
				letterSpacing='0.04em'
				textTransform='uppercase'
				cursor='pointer'
				transition='background-color .12s ease, transform .08s ease, box-shadow .12s ease'
				_hover={{
					bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 38%, transparent)',
				}}
				_active={{ transform: 'scale(0.96)' }}
				_focus={{
					outline: 'none',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-teal) 30%, transparent)',
				}}
				onClick={() => dispatchFlightRequest()}
			>
				{flighting ? (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
					>
						<Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
						<Box as='span'>Sending</Box>
					</motion.span>
				) : (
					<motion.span
						initial={{ opacity: 0, x: -3 }}
						animate={{ opacity: 1, x: 0 }}
						style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
					>
						<Send size={12} />
						<Box as='span'>Send</Box>
					</motion.span>
				)}
			</ChakraButton>
		</Flex>
	);
};

export default Header;
