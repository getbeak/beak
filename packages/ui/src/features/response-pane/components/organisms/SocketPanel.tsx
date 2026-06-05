import ksuid from '@beak/ksuid';
import {
	closeSocket,
	openSocket,
	type SocketMessage,
	type SocketSession,
	sendSocketMessage,
} from '@beak/state/sockets';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex, Input } from '@chakra-ui/react';
import React from 'react';
import { useDispatch } from 'react-redux';

import TabBar from '../../../../components/atoms/TabBar';
import TabItem from '../../../../components/atoms/TabItem';
import TabSpacer from '../../../../components/atoms/TabSpacer';

const ChakraButton = chakra('button');

export interface SocketPanelProps {
	session: SocketSession;
}

type SocketPanelTab = 'live' | 'handshake';

const STATUS_COLOURS: Record<SocketSession['status'], string> = {
	connecting: 'accent.warning',
	open: 'accent.success',
	closing: 'accent.warning',
	closed: 'fg.muted',
	failed: 'accent.alert',
};

/**
 * WebSocket viewer with two tabs:
 *  - "Live" — status header, scrolling message log, and send box. Auto-scrolls
 *    to tail unless the user scrolled away.
 *  - "Handshake" — opening request headers, the negotiated upgrade response
 *    (selected sub-protocol + extensions), and (once the session terminates)
 *    the close frame summary and totals.
 *
 * Replaces the HTTP inspector when the current request has a socket session.
 */
const SocketPanel: React.FC<SocketPanelProps> = ({ session }) => {
	const dispatch = useDispatch();
	const [tab, setTab] = React.useState<SocketPanelTab>('live');
	const [draft, setDraft] = React.useState('');
	const listRef = React.useRef<HTMLDivElement | null>(null);
	const pinnedRef = React.useRef(true);

	const isOpen = session.status === 'open';
	const isConnecting = session.status === 'connecting';
	const isTerminal = session.status === 'closed' || session.status === 'failed';

	React.useEffect(() => {
		const el = listRef.current;
		if (!el || !pinnedRef.current) return;
		el.scrollTop = el.scrollHeight;
	}, [session.messages.length]);

	function handleScroll(e: React.UIEvent<HTMLDivElement>) {
		const el = e.currentTarget;
		const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
		pinnedRef.current = distance < 8;
	}

	function handleSend() {
		const text = draft;
		if (!text || !isOpen) return;
		dispatch(sendSocketMessage({ socketId: session.socketId, kind: 'text', data: text }));
		setDraft('');
	}

	function handleReconnect() {
		// Open a fresh session against the same URL — we deliberately mint a
		// new socketId rather than re-using the failed/closed one, so the
		// history of the old session stays visible in the log if we ever
		// surface a session switcher.
		dispatch(
			openSocket({
				socketId: ksuid.generate('socket').toString(),
				requestId: session.requestId,
				url: session.url,
				protocols: session.protocols,
				headers: session.headers,
			}),
		);
	}

	function handleClose() {
		dispatch(closeSocket({ socketId: session.socketId, code: 1000, reason: 'user' }));
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	return (
		<Flex direction='column' h='100%' overflow='hidden'>
			<Flex
				px='3'
				py='2'
				align='center'
				gap='3'
				borderBottomWidth='1px'
				borderColor='border.default'
				bg='bg.surface'
				fontSize='xs'
			>
				<Flex align='center' gap='2'>
					<Box
						w='8px'
						h='8px'
						borderRadius='full'
						bg={STATUS_COLOURS[session.status]}
						animation={isConnecting || isOpen ? 'beakFlightInner 1.4s ease-in-out infinite' : undefined}
					/>
					<Box color='fg.default' fontWeight='600' textTransform='uppercase' letterSpacing='0.05em' fontSize='10px'>
						{session.status}
					</Box>
				</Flex>
				<Box fontFamily='mono' color='fg.muted' truncate maxW='40ch'>
					{session.url}
				</Box>
				<Flex ml='auto' gap='3' color='fg.muted' fontSize='10px'>
					<Box>{`↓ ${session.messagesIn} (${formatBytes(session.bytesIn)})`}</Box>
					<Box>{`↑ ${session.messagesOut} (${formatBytes(session.bytesOut)})`}</Box>
				</Flex>
				<ActionButton onClick={isTerminal ? handleReconnect : handleClose} danger={!isTerminal}>
					{isTerminal ? 'Reconnect' : 'Close'}
				</ActionButton>
			</Flex>

			<TabBar $centered>
				<TabSpacer />
				<TabItem active={tab === 'live'} size='sm' onClick={() => setTab('live')}>
					{'Live'}
				</TabItem>
				<TabItem active={tab === 'handshake'} size='sm' onClick={() => setTab('handshake')}>
					{'Handshake'}
				</TabItem>
				<TabSpacer />
			</TabBar>

			{tab === 'live' ? (
				<React.Fragment>
					<Box ref={listRef} flex='1' overflowY='auto' onScroll={handleScroll}>
						{session.messages.length === 0 && (
							<Flex h='100%' align='center' justify='center' color='fg.muted' fontSize='sm'>
								{'No messages yet'}
							</Flex>
						)}
						{session.messages.map(m => (
							<MessageRow key={m.id} message={m} />
						))}
					</Box>

					<Flex gap='2' p='2' borderTopWidth='1px' borderColor='border.default' bg='bg.surface' align='center'>
						<Input
							size='sm'
							placeholder={isOpen ? 'Send a text message — Enter to send' : 'Connect first'}
							value={draft}
							disabled={!isOpen}
							onChange={e => setDraft(e.target.value)}
							onKeyDown={handleKeyDown}
							fontFamily='mono'
							fontSize='xs'
						/>
						<ActionButton onClick={handleSend} disabled={!isOpen || draft.length === 0}>
							{'Send'}
						</ActionButton>
					</Flex>
				</React.Fragment>
			) : (
				<HandshakeView session={session} />
			)}
		</Flex>
	);
};

const HandshakeView: React.FC<{ session: SocketSession }> = ({ session }) => {
	const requestHeaders = session.headers ?? [];
	const isTerminal = session.status === 'closed' || session.status === 'failed';

	return (
		<Box flex='1' overflowY='auto' px='4' py='3'>
			<Flex direction='column' gap='4' maxW='760px' mx='auto'>
				<Section title='Request' subtitle={`Opening handshake to ${session.url}`}>
					<KvRow name='URL' value={session.url} mono />
					{session.protocols && session.protocols.length > 0 && (
						<KvRow name='Sub-protocols' value={session.protocols.join(', ')} mono />
					)}
					{requestHeaders.length > 0 ? (
						requestHeaders.map((h, i) => <KvRow key={`${h.name}-${i}`} name={h.name} value={h.value} mono />)
					) : (
						<Empty>{'No user-authored headers — only the standard upgrade headers were sent.'}</Empty>
					)}
				</Section>

				<Section title='Response' subtitle='Negotiated upgrade'>
					{session.openedAt ? (
						<KvRow name='Opened at' value={new Date(session.openedAt).toISOString()} mono />
					) : (
						<Empty>
							{session.status === 'connecting' ? 'Awaiting upgrade…' : 'Server never completed the upgrade handshake.'}
						</Empty>
					)}
					{session.negotiatedProtocol && <KvRow name='Sec-WebSocket-Protocol' value={session.negotiatedProtocol} mono />}
					{session.extensions && <KvRow name='Sec-WebSocket-Extensions' value={session.extensions} mono />}
				</Section>

				{isTerminal && (
					<Section
						title='Close'
						subtitle={
							session.status === 'failed'
								? 'Session ended with an error'
								: session.wasClean
									? 'Clean close'
									: 'Disconnected without a clean close'
						}
					>
						{session.errorMessage && <KvRow name='Error' value={session.errorMessage} mono />}
						{typeof session.closeCode === 'number' && (
							<KvRow
								name='Close code'
								value={`${session.closeCode}${session.closeReason ? ` — ${session.closeReason}` : ''}`}
								mono
							/>
						)}
						{session.openedAt && session.closedAt && (
							<KvRow name='Duration' value={formatDuration(session.closedAt - session.openedAt)} mono />
						)}
						<KvRow name='Messages' value={`↓ ${session.messagesIn}  ·  ↑ ${session.messagesOut}`} />
						<KvRow name='Bytes' value={`↓ ${formatBytes(session.bytesIn)}  ·  ↑ ${formatBytes(session.bytesOut)}`} />
					</Section>
				)}
			</Flex>
		</Box>
	);
};

const Section: React.FC<React.PropsWithChildren<{ title: string; subtitle?: string }>> = ({
	title,
	subtitle,
	children,
}) => (
	<Box>
		<Flex direction='column' gap='0.5' mb='2'>
			<Box fontSize='10px' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em' color='fg.subtle'>
				{title}
			</Box>
			{subtitle && (
				<Box fontSize='12px' color='fg.muted' lineHeight='1.4'>
					{subtitle}
				</Box>
			)}
		</Flex>
		<Box
			borderTopWidth='1px'
			borderTopColor='border.subtle'
			css={{ '& > *:not(:last-child)': { borderBottom: '1px solid var(--beak-colors-border-subtle)' } }}
		>
			{children}
		</Box>
	</Box>
);

const KvRow: React.FC<{ name: string; value: string; mono?: boolean }> = ({ name, value, mono }) => (
	<Flex align='center' gap='3' py='2' px='1' fontSize='12px'>
		<Box flex='0 0 160px' color='fg.subtle' fontWeight='500'>
			{name}
		</Box>
		<Box flex='1 1 auto' minW={0} fontFamily={mono ? 'mono' : undefined} color='fg.default' wordBreak='break-all'>
			{value}
		</Box>
	</Flex>
);

const Empty: React.FC<React.PropsWithChildren> = ({ children }) => (
	<Box py='2' px='1' fontSize='12px' color='fg.subtle' fontStyle='italic'>
		{children}
	</Box>
);

const MessageRow: React.FC<{ message: SocketMessage }> = ({ message }) => {
	const time = new Date(message.receivedAt).toISOString().slice(11, 23);
	const isSystem = message.direction === 'system';
	const arrow = message.direction === 'in' ? '↓' : message.direction === 'out' ? '↑' : '·';

	return (
		<Flex
			direction='column'
			gap='1'
			px='3'
			py='2'
			borderBottomWidth='1px'
			borderColor='border.subtle'
			fontFamily='mono'
			fontSize='xs'
			bg={isSystem ? 'bg.subtle' : undefined}
			_hover={{ bg: isSystem ? 'bg.subtle' : 'bg.subtle' }}
		>
			<Flex align='center' gap='2' fontSize='10px' color='fg.muted'>
				<Box w='2ch' textAlign='center' color={isSystem ? 'fg.subtle' : 'fg.default'} fontWeight='700'>
					{arrow}
				</Box>
				<Box>{time}</Box>
				<Box
					px='1.5'
					py='0'
					borderRadius='sm'
					bg={isSystem ? 'transparent' : 'color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'}
					color={isSystem ? 'fg.subtle' : 'accent.teal'}
					fontWeight='600'
					textTransform='uppercase'
					letterSpacing='0.03em'
				>
					{message.kind}
				</Box>
				<Box color='fg.subtle'>{formatBytes(message.size)}</Box>
			</Flex>
			<Box
				as='pre'
				whiteSpace='pre-wrap'
				wordBreak='break-word'
				color={isSystem ? 'fg.muted' : 'fg.default'}
				fontStyle={isSystem ? 'italic' : 'normal'}
				m='0'
			>
				{message.data || (
					<Box as='span' color='fg.disabled'>
						{'(empty)'}
					</Box>
				)}
			</Box>
		</Flex>
	);
};

const ActionButton: React.FC<
	React.PropsWithChildren<{ onClick: () => void; disabled?: boolean; danger?: boolean }>
> = ({ onClick, disabled, danger, children }) => (
	<ChakraButton
		type='button'
		onClick={() => !disabled && onClick()}
		opacity={disabled ? 0.5 : 1}
		cursor={disabled ? 'not-allowed' : 'pointer'}
		px='2.5'
		py='1'
		borderRadius='md'
		borderWidth='1px'
		borderColor={danger ? 'color-mix(in srgb, var(--beak-colors-accent-alert) 45%, transparent)' : 'border.default'}
		bg={danger ? 'color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)' : 'bg.surface'}
		color={danger ? 'accent.alert' : 'fg.default'}
		fontSize='xs'
		fontWeight='600'
		_hover={{ filter: 'brightness(1.08)' }}
	>
		{children}
	</ChakraButton>
);

export function useSocketForRequest(requestId: string | undefined): SocketSession | null {
	return useAppSelector(s => {
		if (!requestId) return null;
		const ids = s.global.sockets.socketsByRequest[requestId];
		if (!ids || ids.length === 0) return null;
		return s.global.sockets.sessions[ids[ids.length - 1]] ?? null;
	});
}

function formatBytes(n: number): string {
	if (n < 1024) return `${n} B`;
	if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
	if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
	return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(ms: number): string {
	if (ms < 1000) return `${ms} ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
	const mins = Math.floor(ms / 60_000);
	const secs = Math.floor((ms % 60_000) / 1000);
	return `${mins}m ${secs}s`;
}

export default SocketPanel;
