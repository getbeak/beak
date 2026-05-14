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
		<Flex
			align='center'
			gap='1.5'
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
						h='30px'
						px='2.5'
						minW='84px'
						borderRadius='md'
						borderWidth='1px'
						fontWeight='700'
						fontSize='11px'
						letterSpacing='0.07em'
						textTransform='uppercase'
						cursor='pointer'
						fontVariantNumeric='tabular-nums'
						transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease, transform .08s ease, filter .14s ease'
						_active={{ transform: 'translateY(0.5px)' }}
						_focusVisible={{
							outline: 'none',
							boxShadow: `0 0 0 3px color-mix(in srgb, ${verbColor} 38%, transparent)`,
							zIndex: 1,
						}}
						style={{
							color: verbColor,
							background: `color-mix(in srgb, ${verbColor} 13%, transparent)`,
							borderColor: `color-mix(in srgb, ${verbColor} 22%, transparent)`,
							boxShadow: `inset 0 1px 0 color-mix(in srgb, white 14%, transparent), inset 0 -6px 12px -8px color-mix(in srgb, ${verbColor} 24%, transparent)`,
						}}
						css={{
							'&:hover': {
								background: `color-mix(in srgb, ${verbColor} 20%, transparent)`,
								borderColor: `color-mix(in srgb, ${verbColor} 38%, transparent)`,
							},
							'&[data-state="open"]': {
								background: `color-mix(in srgb, ${verbColor} 26%, transparent)`,
								borderColor: `color-mix(in srgb, ${verbColor} 48%, transparent)`,
							},
							'&[data-state="open"] svg.lucide-chevron-down': {
								transform: 'rotate(180deg)',
							},
							'svg.lucide-chevron-down': {
								transition: 'transform .18s cubic-bezier(0.16, 1, 0.3, 1)',
							},
						}}
					>
						<Box as='span'>{verb.toUpperCase()}</Box>
						<ChevronDown size={12} strokeWidth={2.4} style={{ opacity: 0.75 }} />
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
				h='30px'
				display='flex'
				alignItems='stretch'
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.canvas'
				transition='border-color .14s ease, box-shadow .14s ease, background-color .14s ease'
				position='relative'
				_hover={{
					borderColor: 'border.default',
				}}
				_focusWithin={{
					borderColor: 'accent.pink',
					bg: 'bg.canvas',
					boxShadow:
						'0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
					zIndex: 1,
				}}
				css={{
					'& > div': { display: 'flex', alignItems: 'center', width: '100%' },
					'& > div > article': {
						padding: '0 11px',
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
					'& > div > article:focus-within': {
						outline: 'none',
					},
					'& > div > article:empty::before': {
						fontFamily: 'var(--beak-fonts-mono)',
						fontSize: '12.5px',
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
				px='3.5'
				ml='0.5'
				minW='96px'
				borderRadius='md'
				borderWidth='1px'
				borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 70%, transparent)'
				color='fg.onAccent'
				fontWeight='600'
				fontSize='12px'
				letterSpacing='0.01em'
				cursor='pointer'
				position='relative'
				overflow='hidden'
				transition='filter .12s ease, box-shadow .14s ease, transform .08s ease'
				style={{
					background:
						'linear-gradient(180deg, color-mix(in srgb, var(--beak-colors-accent-pink) 100%, white 12%) 0%, var(--beak-colors-accent-pink) 100%)',
					boxShadow:
						'0 1px 0 inset color-mix(in srgb, white 24%, transparent), 0 1px 2px rgba(0,0,0,0.18), 0 0 0 0 color-mix(in srgb, var(--beak-colors-accent-pink) 0%, transparent)',
				}}
				_hover={{
					filter: 'brightness(1.06)',
					boxShadow:
						'0 1px 0 inset color-mix(in srgb, white 28%, transparent), 0 2px 6px rgba(0,0,0,0.22), 0 0 0 4px color-mix(in srgb, var(--beak-colors-accent-pink) 22%, transparent)',
				}}
				_active={{ filter: 'brightness(0.94)', transform: 'translateY(0.5px)' }}
				_focusVisible={{
					outline: 'none',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
					zIndex: 1,
				}}
				onClick={() => dispatchFlightRequest()}
			>
				<AnimatePresence initial={false} mode='wait'>
					{flighting ? (
						<motion.span
							key='sending'
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -6 }}
							transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							<Loader2 size={13} style={{ animation: 'beakSpin 1s linear infinite' }} />
							<Box as='span'>Sending</Box>
						</motion.span>
					) : (
						<motion.span
							key='send'
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 6 }}
							transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
							style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
						>
							<Send size={12} strokeWidth={2.2} />
							<Box as='span'>Send</Box>
						</motion.span>
					)}
				</AnimatePresence>
			</ChakraButton>
		</Flex>
	);
};

export default Header;
