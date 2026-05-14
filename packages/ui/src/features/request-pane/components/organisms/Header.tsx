import { Box, Flex, Menu, Portal, chakra } from '@chakra-ui/react';
import { verbToColor } from '@beak/design-system/helpers';
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

const VERBS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

const ChakraButton = chakra('button');

const Header: React.FC<HeaderProps> = ({ node }) => {
	const dispatch = useDispatch();
	const currentFlight = useAppSelector(s => s.global.flight.activeFlights[node.id]);
	const flighting = Boolean(currentFlight);
	const context = useVariableContext(node.id);
	const verb = node.info.verb;
	const verbColor = verbToColor(verb);

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
						fontWeight='700'
						fontSize='xs'
						letterSpacing='0.06em'
						textTransform='uppercase'
						cursor='pointer'
						transition='background-color .14s ease, border-color .14s ease, box-shadow .14s ease, transform .08s ease'
						_active={{ transform: 'scale(0.97)' }}
						_focusVisible={{
							outline: 'none',
							borderColor: verbColor,
							boxShadow: `0 0 0 3px color-mix(in srgb, ${verbColor} 28%, transparent)`,
						}}
						style={{
							color: verbColor,
							background: `color-mix(in srgb, ${verbColor} 12%, var(--beak-colors-bg-surface))`,
							borderColor: `color-mix(in srgb, ${verbColor} 38%, var(--beak-colors-border-subtle))`,
							borderLeft: `3px solid ${verbColor}`,
							boxShadow: `inset 0 1px 0 color-mix(in srgb, white 18%, transparent), 0 1px 2px color-mix(in srgb, ${verbColor} 18%, transparent)`,
						}}
					>
						{verb.toUpperCase()}
						<ChevronDown size={11} strokeWidth={2.2} />
					</ChakraButton>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content
							bg='color-mix(in srgb, var(--beak-colors-bg-surface) 75%, transparent)'
							borderWidth='1px'
							borderColor='color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-subtle))'
							borderRadius='lg'
							backdropFilter='blur(24px) saturate(180%)'
							boxShadow='0 24px 56px rgba(0,0,0,0.32), 0 8px 18px color-mix(in srgb, var(--beak-colors-accent-pink) 16%, rgba(0,0,0,0.15)), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
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
										onClick={() =>
											dispatch(requestUriUpdated({ requestId: node.id, verb: v }))
										}
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
				borderRadius='md'
				borderWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
				transition='border-color .12s ease, box-shadow .12s ease'
				_hover={{ borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 30%, var(--beak-colors-border-subtle))' }}
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
				gap='1.5'
				px='4'
				py='1.5'
				h='34px'
				minW='96px'
				borderRadius='md'
				borderWidth='1px'
				borderColor='accent.pink'
				bg='accent.pink'
				color='fg.onAccent'
				fontWeight='600'
				fontSize='sm'
				letterSpacing='0.01em'
				cursor='pointer'
				boxShadow='0 4px 14px color-mix(in srgb, var(--beak-colors-accent-pink) 35%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)'
				transition='background-color .14s ease, transform .1s cubic-bezier(.4,0,.2,1), box-shadow .14s ease, filter .14s ease'
				_hover={{
					filter: 'brightness(1.06)',
					transform: 'translateY(-1px)',
					boxShadow: '0 8px 22px color-mix(in srgb, var(--beak-colors-accent-pink) 55%, transparent), inset 0 1px 0 color-mix(in srgb, white 26%, transparent)',
				}}
				_active={{ transform: 'translateY(0) scale(0.97)' }}
				_focusVisible={{
					outline: 'none',
					boxShadow: '0 0 0 3px color-mix(in srgb, var(--beak-colors-accent-pink) 40%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
				}}
				onClick={() => dispatchFlightRequest()}
			>
				{flighting ? (
					<motion.span
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
					>
						<Loader2 size={13} style={{ animation: 'beakSpin 1s linear infinite' }} />
						<Box as='span'>Sending</Box>
					</motion.span>
				) : (
					<motion.span
						initial={{ opacity: 0, x: -3 }}
						animate={{ opacity: 1, x: 0 }}
						style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
					>
						<Send size={13} />
						<Box as='span'>Send</Box>
					</motion.span>
				)}
			</ChakraButton>
		</Flex>
	);
};

export default Header;
