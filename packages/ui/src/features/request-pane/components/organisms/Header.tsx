import { verbToColor } from '@beak/design-system/helpers';
import ksuid from '@beak/ksuid';
import { selectActiveFlight } from '@beak/state/flight';
import { closeSocket, openSocket, selectLatestSocketForRequest } from '@beak/state/sockets';
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
import { ChevronDown, Loader2, Plug, PlugZap, Send } from 'lucide-react';
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
	const currentSocket = useAppSelector(s => selectLatestSocketForRequest(node.id)(s));
	const flighting = Boolean(currentFlight);
	const windowSession = useContext(WindowSessionContext);
	const context = useVariableContext(node.id);
	const verb = node.info.verb;
	const verbColor = verbToColor(verb);
	const cmdGlyph = windowSession.isDarwin() ? '⌘' : 'Ctrl';

	// The URL's first static segment is a strong-enough signal — variable
	// interpolation can change later segments but `ws://` is always at the
	// front of a WebSocket URL. We re-derive the resolved URL on send so any
	// variables get evaluated against the current context.
	const isSocketUrl = React.useMemo(() => {
		const first = node.info.url[0];
		return typeof first === 'string' && /^wss?:\/\//i.test(first);
	}, [node.info.url]);

	const socketActive = currentSocket?.status === 'open' || currentSocket?.status === 'connecting';

	async function dispatchSendAction() {
		if (!isSocketUrl) {
			dispatch(requestFlight());
			return;
		}

		// Close a live session before opening a new one. If there's a closed
		// or failed session we open a fresh one with a new socketId so the
		// log of the old attempt stays around.
		if (socketActive && currentSocket) {
			dispatch(closeSocket({ socketId: currentSocket.socketId, code: 1000, reason: 'user' }));
			return;
		}

		const url = await parseValueSections(context, node.info.url);
		dispatch(
			openSocket({
				socketId: ksuid.generate('socket').toString(),
				requestId: node.id,
				url,
			}),
		);
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
		<Flex
			align='center'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderColor='border.default'
			bg='bg.surface'
			css={{
				backgroundImage:
					'linear-gradient(180deg, color-mix(in srgb, var(--beak-colors-bg-canvas) 22%, transparent) 0%, transparent 100%)',
				boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 5%, transparent)',
			}}
		>
			{/* Single fused control: verb chip | URL input | send icon. One
			    rounded chassis, one focus ring, three segments flush against
			    each other. */}
			<Flex
				flex='1 1 auto'
				minW={0}
				align='stretch'
				h='30px'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				transition='border-color .14s ease, box-shadow .14s ease'
				overflow='hidden'
				_hover={{ borderColor: 'border.default' }}
				css={{
					'&:focus-within': {
						borderColor: 'var(--beak-colors-accent-pink)',
						boxShadow:
							'0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
					},
				}}
			>
				<Menu.Root>
					<Menu.Trigger asChild>
						<ChakraButton
							type='button'
							aria-label={`HTTP verb: ${verb.toUpperCase()}`}
							title={`HTTP verb: ${verb.toUpperCase()}`}
							display='inline-flex'
							alignItems='center'
							justifyContent='center'
							gap='1.5'
							px='2.5'
							minW='78px'
							flexShrink={0}
							border='none'
							borderRightWidth='1px'
							borderRightStyle='solid'
							borderRightColor='border.subtle'
							borderRadius='0'
							fontWeight='700'
							fontSize='11px'
							letterSpacing='0.07em'
							textTransform='uppercase'
							cursor='pointer'
							fontVariantNumeric='tabular-nums'
							transition='background-color .14s ease, filter .14s ease, transform .08s ease'
							_active={{ transform: 'translateY(0.5px)' }}
							_focusVisible={{
								outline: 'none',
								boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${verbColor} 55%, transparent)`,
								zIndex: 1,
							}}
							style={{
								color: verbColor,
								background: `color-mix(in srgb, ${verbColor} 14%, transparent)`,
							}}
							css={{
								'&:hover': {
									background: `color-mix(in srgb, ${verbColor} 22%, transparent)`,
								},
								'&[data-state="open"]': {
									background: `color-mix(in srgb, ${verbColor} 28%, transparent)`,
								},
								'&[data-state="open"] svg.lucide-chevron-down': { transform: 'rotate(180deg)' },
								'svg.lucide-chevron-down': {
									transition: 'transform .18s cubic-bezier(0.16, 1, 0.3, 1)',
								},
							}}
						>
							<Box as='span'>{verb.toUpperCase()}</Box>
							<ChevronDown size={11} strokeWidth={2.4} style={{ opacity: 0.7 }} />
						</ChakraButton>
					</Menu.Trigger>
					<Portal>
						<Menu.Positioner>
							<Menu.Content
								bg='color-mix(in srgb, var(--beak-colors-bg-surface-emphasized) 92%, transparent)'
								backdropFilter='blur(12px) saturate(140%)'
								borderWidth='1px'
								borderColor='border.default'
								borderRadius='lg'
								boxShadow='0 12px 32px rgba(0,0,0,0.32), 0 2px 6px rgba(0,0,0,0.18)'
								p='1'
								minW='150px'
								css={{
									'@keyframes verbMenuIn': {
										from: { opacity: 0, transform: 'translateY(-4px) scale(0.97)' },
										to: { opacity: 1, transform: 'translateY(0) scale(1)' },
									},
									animation: 'verbMenuIn 120ms cubic-bezier(0.16, 1, 0.3, 1)',
									transformOrigin: 'top left',
								}}
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
											letterSpacing='0.07em'
											borderRadius='md'
											py='1.5'
											pl='2.5'
											pr='2'
											gap='2'
											display='flex'
											alignItems='center'
											justifyContent='space-between'
											transition='background-color .12s ease, padding-left .12s ease'
											style={{
												color: c,
												background: isActive ? `color-mix(in srgb, ${c} 18%, transparent)` : undefined,
											}}
											_hover={{
												bg: `color-mix(in srgb, ${c} 14%, transparent)`,
											}}
										>
											<Box as='span'>{v}</Box>
											{isActive && (
												<Box
													as='span'
													w='6px'
													h='6px'
													borderRadius='full'
													style={{ background: c, boxShadow: `0 0 0 3px color-mix(in srgb, ${c} 22%, transparent)` }}
												/>
											)}
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
					display='flex'
					alignItems='stretch'
					position='relative'
					css={{
						'& > div': { display: 'flex', alignItems: 'center', width: '100%' },
						'& > div > article': {
							padding: '0 12px',
							background: 'transparent',
							border: 'none',
							color: 'var(--beak-colors-fg-default)',
							fontFamily: 'var(--beak-fonts-mono)',
							fontSize: '12.5px',
							fontWeight: 400,
							letterSpacing: '0.005em',
							outline: 'none',
							width: '100%',
							lineHeight: '28px',
						},
						'& > div > article:focus-within': { outline: 'none' },
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
					aria-label={
						isSocketUrl
							? socketActive
								? 'Close WebSocket'
								: 'Open WebSocket'
							: flighting
								? 'Sending request'
								: 'Send request'
					}
					title={
						isSocketUrl
							? socketActive
								? `Close socket (${cmdGlyph}+Enter)`
								: `Open socket (${cmdGlyph}+Enter)`
							: `Send request (${cmdGlyph}+Enter)`
					}
					flexShrink={0}
					display='inline-flex'
					alignItems='center'
					justifyContent='center'
					w='38px'
					border='none'
					borderRadius='0'
					color='fg.onAccent'
					cursor='pointer'
					position='relative'
					transition='filter .12s ease, box-shadow .14s ease, transform .08s ease'
					style={{
						background: isSocketUrl
							? 'linear-gradient(180deg, color-mix(in srgb, var(--beak-colors-accent-teal) 100%, white 12%) 0%, var(--beak-colors-accent-teal) 100%)'
							: 'linear-gradient(180deg, color-mix(in srgb, var(--beak-colors-accent-pink) 100%, white 12%) 0%, var(--beak-colors-accent-pink) 100%)',
						boxShadow: 'inset 1px 0 0 color-mix(in srgb, white 18%, transparent)',
					}}
					_hover={{ filter: 'brightness(1.08)' }}
					_active={{ filter: 'brightness(0.94)', transform: 'translateY(0.5px)' }}
					_focusVisible={{
						outline: 'none',
						boxShadow: 'inset 0 0 0 2px color-mix(in srgb, white 70%, transparent)',
						zIndex: 1,
					}}
					onClick={() => {
						void dispatchSendAction();
					}}
				>
					<AnimatePresence initial={false} mode='wait'>
						{isSocketUrl ? (
							<motion.span
								key={socketActive ? 'socket-open' : 'socket-closed'}
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
								style={{ display: 'inline-flex' }}
							>
								{socketActive ? <PlugZap size={14} strokeWidth={2.2} /> : <Plug size={14} strokeWidth={2.2} />}
							</motion.span>
						) : flighting ? (
							<motion.span
								key='sending'
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
								style={{ display: 'inline-flex' }}
							>
								<Loader2 size={14} style={{ animation: 'beakSpin 1s linear infinite' }} />
							</motion.span>
						) : (
							<motion.span
								key='send'
								initial={{ opacity: 0, scale: 0.6 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.6 }}
								transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
								style={{ display: 'inline-flex' }}
							>
								<Send size={14} strokeWidth={2.2} />
							</motion.span>
						)}
					</AnimatePresence>
				</ChakraButton>
			</Flex>
		</Flex>
	);
};

export default Header;
