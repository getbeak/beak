import { Box, chakra, Flex, Input } from '@chakra-ui/react';
import { closeSocket, openSocket, sendSocketMessage, type SocketMessage, type SocketSession } from '@beak/state/sockets';
import ksuid from '@beak/ksuid';
import { useAppSelector } from '@beak/ui/store/redux';
import React from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

export interface SocketPanelProps {
	session: SocketSession;
}

const STATUS_COLOURS: Record<SocketSession['status'], string> = {
	connecting: 'accent.warning',
	open: 'accent.success',
	closing: 'accent.warning',
	closed: 'fg.muted',
	failed: 'accent.alert',
};

/**
 * Single-pane WebSocket viewer: status header, scrolling message log, and a
 * send box. Replaces the HTTP inspector when the current request has a
 * socket session. Auto-scrolls to the tail unless the user has scrolled
 * away (same affordance as the SSE event log).
 */
const SocketPanel: React.FC<SocketPanelProps> = ({ session }) => {
	const dispatch = useDispatch();
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
				<ActionButton
					onClick={isTerminal ? handleReconnect : handleClose}
					danger={!isTerminal}
				>
					{isTerminal ? 'Reconnect' : 'Close'}
				</ActionButton>
			</Flex>

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

			<Flex
				gap='2'
				p='2'
				borderTopWidth='1px'
				borderColor='border.default'
				bg='bg.surface'
				align='center'
			>
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
		</Flex>
	);
};

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
					bg={
						isSystem
							? 'transparent'
							: 'color-mix(in srgb, var(--beak-colors-accent-teal) 14%, transparent)'
					}
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
				{message.data || <Box as='span' color='fg.disabled'>{'(empty)'}</Box>}
			</Box>
		</Flex>
	);
};

const ActionButton: React.FC<React.PropsWithChildren<{ onClick: () => void; disabled?: boolean; danger?: boolean }>> = ({
	onClick,
	disabled,
	danger,
	children,
}) => (
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

export default SocketPanel;
