import { verbToColor } from '@beak/design-system/helpers';
import { selectActiveFlight } from '@beak/state/flight';
import WindowSessionContext from '@beak/ui/contexts/window-session-context';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { requestPreferenceSetReqMainTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Menu, Portal } from '@chakra-ui/react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader2, Send } from 'lucide-react';
import * as React from 'react';
import { useContext } from 'react';
import { useDispatch } from 'react-redux';
import URL from 'url-parse';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';

export interface HeaderProps {
	node: ValidRequestNode;
}

const VERBS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const ChakraButton = chakra('button');

const Header: React.FC<HeaderProps> = ({ node }) => {
	const dispatch = useDispatch();
	const currentFlight = useAppSelector(s => selectActiveFlight(node.id)(s));
	const flighting = Boolean(currentFlight);
	const windowSession = useContext(WindowSessionContext);
	const context = useVariableContext(node.id);
	const verb = node.info.verb;
	const verbColor = verbToColor(verb);
	const cmdGlyph = windowSession.isDarwin() ? '⌘' : 'Ctrl';

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
				dispatch(
					requestQueryAdded({
						requestId: node.id,
						name: key,
						value: [parsed.query[key]!],
					}),
				);
			});
		}

		if (value.includes('?')) {
			const searchIndex = parts.findIndex(p => typeof p === 'string' && p.includes('?'));
			const searchPartIndex = (parts[searchIndex] as string).indexOf('?');

			sanitizedParts = parts.slice(0, searchIndex);
			sanitizedParts.push((parts[searchIndex] as string).slice(0, searchPartIndex));

			dispatch(requestPreferenceSetReqMainTab({ id: node.id, tab: 'url_query' }));
		}

		dispatch(
			requestUriUpdated({
				requestId: node.id,
				url: sanitizedParts,
			}),
		);
	}

	return (
		<Flex align='center' gap='1.5' px='3' py='2' borderBottomWidth='1px' borderColor='border.subtle' bg='bg.surface'>
			<Menu.Root>
				<Menu.Trigger asChild>
					<ChakraButton
						type='button'
						aria-label={`HTTP verb: ${verb.toUpperCase()}`}
						title={`HTTP verb: ${verb.toUpperCase()}`}
						display='inline-flex'
						alignItems='center'
						justifyContent='center'
						gap='1'
						h='30px'
						px='2.5'
						minW='74px'
						borderTopLeftRadius='md'
						borderBottomLeftRadius='md'
						borderTopRightRadius='none'
						borderBottomRightRadius='none'
						borderWidth='1px'
						borderRightWidth='0'
						fontWeight='700'
						fontSize='11px'
						letterSpacing='0.06em'
						textTransform='uppercase'
						cursor='pointer'
						fontVariantNumeric='tabular-nums'
						transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease, transform .08s ease'
						_active={{ transform: 'scale(0.97)' }}
						_focusVisible={{
							outline: 'none',
							borderColor: verbColor,
							boxShadow: `0 0 0 2px color-mix(in srgb, ${verbColor} 35%, transparent)`,
							zIndex: 1,
						}}
						style={{
							color: verbColor,
							background: `color-mix(in srgb, ${verbColor} 10%, var(--beak-colors-bg-surface))`,
							borderColor: `color-mix(in srgb, ${verbColor} 32%, var(--beak-colors-border-subtle))`,
							boxShadow: `inset 0 1px 0 color-mix(in srgb, white 14%, transparent)`,
						}}
					>
						<Box as='span'>{verb.toUpperCase()}</Box>
						<ChevronDown size={11} strokeWidth={2.2} style={{ opacity: 0.7 }} />
					</ChakraButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content
							bg='color-mix(in srgb, var(--beak-colors-bg-surface) 78%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-border-default) 80%, transparent)'
							borderRadius='lg'
							backdropFilter='blur(24px) saturate(180%)'
							boxShadow='0 24px 56px rgba(0,0,0,0.32), 0 8px 18px rgba(0,0,0,0.16), inset 0 1px 0 color-mix(in srgb, white 18%, transparent)'
							p='1'
							minW='140px'
						>
							{VERBS.map(v => {
								const c = verbToColor(v);
								const isActive = v === verb;
								return (
									<Menu.Item
										key={v}
										value={v}
										onClick={() => dispatch(requestUriUpdated({ requestId: node.id, verb: v }))}
										fontSize='xs'
										fontWeight='700'
										textTransform='uppercase'
										letterSpacing='0.06em'
										borderRadius='md'
										py='1.5'
										px='2'
										transition='background-color .12s ease, border-color .12s ease'
										style={{
											color: c,
											background: isActive ? `color-mix(in srgb, ${c} 16%, transparent)` : undefined,
											borderLeft: `3px solid ${isActive ? c : 'transparent'}`,
										}}
										_hover={{
											bg: `color-mix(in srgb, ${c} 16%, transparent)`,
											borderLeft: `3px solid ${c}`,
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
				h='30px'
				display='flex'
				alignItems='stretch'
				borderRadius='none'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				transition='border-color .12s ease, box-shadow .12s ease'
				position='relative'
				_hover={{
					borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 32%, var(--beak-colors-border-default))',
				}}
				_focusWithin={{
					borderColor: 'accent.pink',
					boxShadow: '0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
					zIndex: 1,
				}}
				css={{
					'> div': { display: 'flex', alignItems: 'center', width: '100%' },
					'> div > article': {
						padding: '0 10px',
						background: 'transparent',
						border: 'none',
						color: 'var(--beak-colors-fg-default)',
						fontSize: '13px',
						fontWeight: 400,
						outline: 'none',
						width: '100%',
						lineHeight: '28px',
					},
					'> div > article:focus-within': {
						outline: 'none',
					},
				}}
			>
				<VariableInput
					requestId={node.id}
					parts={node.info.url}
					placeholder='https://httpbin.org/anything'
					onChange={e => handleUrlChange(e)}
					onUrlQueryStringDetection={urlQueryStringDetected}
				/>
			</Box>

			<ChakraButton
				type='button'
				aria-label={flighting ? 'Sending request' : 'Send request'}
				title={`Send request (${cmdGlyph}+Enter)`}
				flex='0 0 auto'
				display='inline-flex'
				alignItems='center'
				justifyContent='center'
				gap='1.5'
				h='30px'
				px='3'
				minW='92px'
				borderTopRightRadius='md'
				borderBottomRightRadius='md'
				borderTopLeftRadius='none'
				borderBottomLeftRadius='none'
				borderWidth='1px'
				borderLeftWidth='0'
				borderColor='accent.pink'
				bg='accent.pink'
				color='fg.onAccent'
				fontWeight='600'
				fontSize='12px'
				letterSpacing='0.005em'
				cursor='pointer'
				boxShadow='inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
				transition='background-color .14s ease, box-shadow .14s ease, filter .14s ease'
				_hover={{
					filter: 'brightness(1.06)',
					boxShadow:
						'0 0 14px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent), inset 0 1px 0 color-mix(in srgb, white 26%, transparent)',
				}}
				_active={{ filter: 'brightness(0.96)' }}
				_focusVisible={{
					outline: 'none',
					boxShadow:
						'0 0 0 2px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
					zIndex: 1,
				}}
				onClick={() => dispatchFlightRequest()}
			>
				<AnimatePresence initial={false} mode='wait'>
					{flighting ? (
						<motion.span
							key='sending'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.12 }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							<Loader2 size={13} style={{ animation: 'beakSpin 1s linear infinite' }} />
							<Box as='span'>Sending</Box>
						</motion.span>
					) : (
						<motion.span
							key='send'
							initial={{ opacity: 0, x: -3 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.12 }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							<Send size={12} />
							<Box as='span'>Send</Box>
						</motion.span>
					)}
				</AnimatePresence>
			</ChakraButton>
		</Flex>
	);
};

export default Header;
