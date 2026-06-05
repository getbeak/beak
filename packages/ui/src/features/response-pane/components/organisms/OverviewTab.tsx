import { verbToColor } from '@beak/design-system/helpers';
import binaryStore from '@beak/ui/lib/binary-store';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import { Box, Flex, Grid } from '@chakra-ui/react';
import type { Flight } from '@getbeak/types/flight';
import { Clock, FileText, Gauge, Globe, Lock, Network, Server, Shuffle, Timer, Zap } from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import * as React from 'react';

export interface OverviewTabProps {
	flight: Flight;
}

function statusToken(status: number) {
	if (status >= 200 && status < 300) return 'accent.success';
	if (status >= 300 && status < 400) return 'accent.warning';
	if (status >= 400 && status < 500) return 'accent.warning';
	if (status >= 500) return 'accent.alert';
	return 'fg.muted';
}

function pickHeader(headers: Record<string, string>, name: string): string | undefined {
	const lower = name.toLowerCase();
	for (const [k, v] of Object.entries(headers)) {
		if (k.toLowerCase() === lower) return v;
	}
	return undefined;
}

function countSetCookies(headers: Record<string, string>): number {
	let n = 0;
	for (const k of Object.keys(headers)) {
		if (k.toLowerCase() === 'set-cookie') n += 1;
	}
	return n;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ flight }) => {
	const { beakStart, requestStart, headersEnd, responseEnd, beakEnd } = flight.timing;
	const verb = flight.request.verb.toLocaleUpperCase();
	const verbColor = verbToColor(flight.request.verb);
	const status = flight.response?.status;
	const responseHeaders = flight.response?.headers ?? {};
	const requestHeaders = flight.request.headers ?? {};
	const bodySize = flight.response?.hasBody ? (binaryStore.get(flight.binaryStoreKey)?.length ?? 0) : 0;
	const duration = requestStart !== undefined && responseEnd !== undefined ? responseEnd - requestStart : 0;
	const ttfb = requestStart !== undefined && headersEnd !== undefined ? headersEnd - requestStart : null;
	const bodyTransfer = headersEnd !== undefined && responseEnd !== undefined ? responseEnd - headersEnd : null;
	const beakOverhead =
		beakEnd !== undefined && responseEnd !== undefined && requestStart !== undefined && beakStart !== undefined
			? beakEnd - beakStart - (responseEnd - requestStart)
			: null;
	const startedAt = new Date(beakStart);

	const contentType = pickHeader(responseHeaders, 'content-type');
	const contentEncoding = pickHeader(responseHeaders, 'content-encoding');
	const server = pickHeader(responseHeaders, 'server');
	const cacheControl = pickHeader(responseHeaders, 'cache-control');
	const etag = pickHeader(responseHeaders, 'etag');
	const setCookies = countSetCookies(responseHeaders);
	const requestHeaderCount = Object.values(requestHeaders).filter(h => h.enabled !== false).length;
	const responseHeaderCount = Object.keys(responseHeaders).length;
	const requestUrl = Array.isArray(flight.request.url) ? flight.request.url.join('') : String(flight.request.url ?? '');
	const tls = requestUrl.toLowerCase().startsWith('https://');

	return (
		<Box h='100%' overflowY='auto' p='4'>
			<Flex direction='column' gap='3' maxW='820px' mx='auto'>
				{/* Top status strip */}
				<Flex
					align='center'
					gap='3'
					p='3'
					borderRadius='lg'
					borderWidth='1px'
					borderColor='border.subtle'
					bg='color-mix(in srgb, var(--beak-colors-bg-surface) 75%, transparent)'
				>
					<Box
						display='inline-flex'
						alignItems='center'
						px='2'
						py='1'
						borderRadius='md'
						borderWidth='1px'
						fontSize='xs'
						fontWeight='700'
						letterSpacing='0.06em'
						style={{
							color: verbColor,
							background: `color-mix(in srgb, ${verbColor} 12%, var(--beak-colors-bg-surface))`,
							borderColor: `color-mix(in srgb, ${verbColor} 35%, var(--beak-colors-border-subtle))`,
							borderLeft: `3px solid ${verbColor}`,
							boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
						}}
					>
						{verb}
					</Box>
					{status !== undefined && (
						<Flex
							align='center'
							gap='1.5'
							px='2'
							py='1'
							borderRadius='md'
							borderWidth='1px'
							fontSize='xs'
							fontWeight='600'
							color={statusToken(status)}
							style={{
								background: `color-mix(in srgb, var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')}) 12%, var(--beak-colors-bg-surface))`,
								borderColor: `color-mix(in srgb, var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')}) 35%, var(--beak-colors-border-subtle))`,
								borderLeft: `3px solid var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')})`,
								boxShadow: 'inset 0 1px 0 color-mix(in srgb, white 16%, transparent)',
							}}
						>
							<Box as='span' fontWeight='700' fontFamily='mono' style={{ fontVariantNumeric: 'tabular-nums' }}>
								{status}
							</Box>
							<Box
								as='span'
								fontWeight='500'
								style={{
									color: `color-mix(in srgb, var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')}) 75%, var(--beak-colors-fg-default))`,
								}}
							>
								{getStatusReasonPhrase(status)}
							</Box>
						</Flex>
					)}
					{flight.response?.redirected && (
						<Flex
							align='center'
							gap='1'
							px='2'
							py='1'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							fontSize='10px'
							fontWeight='700'
							color='accent.indigo'
							letterSpacing='0.06em'
							textTransform='uppercase'
						>
							<Shuffle size={10} />
							{'Redirected'}
						</Flex>
					)}
					{tls && (
						<Flex
							align='center'
							gap='1'
							px='2'
							py='1'
							borderRadius='md'
							borderWidth='1px'
							borderColor='border.subtle'
							fontSize='10px'
							fontWeight='700'
							color='accent.success'
							letterSpacing='0.06em'
							textTransform='uppercase'
						>
							<Lock size={10} />
							{'TLS'}
						</Flex>
					)}
					<Box ml='auto' fontSize='xs' color='fg.subtle' fontFamily='mono' style={{ fontVariantNumeric: 'tabular-nums' }}>
						{duration}ms
					</Box>
				</Flex>

				{/* Timing breakdown */}
				<Grid templateColumns='repeat(4, minmax(0, 1fr))' gap='2'>
					<StatCard icon={<Timer size={13} />} label='Total' value={`${duration} ms`} tone='pink' />
					<StatCard
						icon={<Zap size={13} />}
						label='TTFB'
						value={ttfb !== null ? `${ttfb} ms` : '—'}
						sub='to first byte'
						tone='teal'
					/>
					<StatCard
						icon={<Network size={13} />}
						label='Body'
						value={bodyTransfer !== null ? `${bodyTransfer} ms` : '—'}
						sub='transfer time'
						tone='indigo'
					/>
					<StatCard
						icon={<Gauge size={13} />}
						label='Overhead'
						value={beakOverhead !== null ? `${Math.max(0, beakOverhead)} ms` : '—'}
						sub='beak processing'
						tone='pink'
					/>
				</Grid>

				{/* Payload + headers count */}
				<Grid templateColumns='repeat(3, minmax(0, 1fr))' gap='2'>
					<StatCard
						icon={<FileText size={13} />}
						label='Body'
						value={bodySize > 0 ? prettyBytes(bodySize) : '—'}
						sub={bodySize > 0 ? `${bodySize.toLocaleString()} bytes` : 'empty body'}
						tone='teal'
					/>
					<StatCard
						icon={<Server size={13} />}
						label='Headers'
						value={`${responseHeaderCount} ↓ · ${requestHeaderCount} ↑`}
						sub='response · request'
						tone='indigo'
					/>
					<StatCard
						icon={<Clock size={13} />}
						label='Started'
						value={startedAt.toLocaleTimeString()}
						sub={startedAt.toLocaleDateString()}
						tone='pink'
					/>
				</Grid>

				{/* Server signature — surface the headers users care about most */}
				{(contentType || contentEncoding || server || cacheControl || etag || setCookies > 0) && (
					<Flex direction='column' gap='1.5'>
						<Eyebrow icon={<Server size={10} />}>{'Server signature'}</Eyebrow>
						<Grid templateColumns='repeat(2, minmax(0, 1fr))' gap='1.5'>
							{contentType && <HeaderPill label='Content-Type' value={contentType} tone='indigo' />}
							{contentEncoding && <HeaderPill label='Content-Encoding' value={contentEncoding} tone='teal' />}
							{server && <HeaderPill label='Server' value={server} tone='pink' />}
							{cacheControl && <HeaderPill label='Cache-Control' value={cacheControl} tone='indigo' />}
							{etag && <HeaderPill label='ETag' value={etag} tone='teal' />}
							{setCookies > 0 && (
								<HeaderPill label='Set-Cookie' value={`${setCookies} cookie${setCookies === 1 ? '' : 's'}`} tone='pink' />
							)}
						</Grid>
					</Flex>
				)}

				{/* URL block */}
				<Flex direction='column' gap='1.5'>
					<Eyebrow icon={<Globe size={10} />}>{'Request URL'}</Eyebrow>
					<UrlPill url={requestUrl} />

					{flight.response?.url && flight.response.url !== requestUrl && (
						<>
							<Eyebrow icon={<Server size={10} />}>{'Final URL'}</Eyebrow>
							<UrlPill url={flight.response.url} />
						</>
					)}
				</Flex>
			</Flex>
		</Box>
	);
};

const TONE_RAMP: Record<string, { color: string; bg: string }> = {
	pink: {
		color: 'var(--beak-colors-accent-pink)',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)',
	},
	teal: {
		color: 'var(--beak-colors-accent-teal)',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 10%, transparent)',
	},
	indigo: {
		color: 'var(--beak-colors-accent-indigo)',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 10%, transparent)',
	},
};

const StatCard: React.FC<{
	icon: React.ReactNode;
	label: string;
	value: string;
	sub?: string;
	tone: 'pink' | 'teal' | 'indigo';
}> = ({ icon, label, value, sub, tone }) => {
	const t = TONE_RAMP[tone];
	return (
		<Flex
			direction='column'
			gap='1.5'
			p='3'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 75%, transparent)'
			transition='border-color .14s ease, transform .14s ease, box-shadow .14s ease'
			_hover={{
				borderColor: `color-mix(in srgb, ${t.color} 32%, var(--beak-colors-border-subtle))`,
				transform: 'translateY(-1px)',
				boxShadow: `0 6px 18px color-mix(in srgb, ${t.color} 18%, rgba(0,0,0,0.06))`,
			}}
		>
			<Flex align='center' gap='1.5'>
				<Flex
					align='center'
					justify='center'
					w='22px'
					h='22px'
					borderRadius='md'
					style={{
						color: t.color,
						background: t.bg,
						border: `1px solid color-mix(in srgb, ${t.color} 28%, transparent)`,
					}}
				>
					{icon}
				</Flex>
				<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
					{label}
				</Box>
			</Flex>
			<Box
				fontSize='md'
				fontWeight='600'
				color='fg.default'
				fontFamily='mono'
				lineHeight='1.2'
				style={{ fontVariantNumeric: 'tabular-nums' }}
			>
				{value}
			</Box>
			{sub && (
				<Box fontSize='10px' color='fg.subtle' style={{ fontVariantNumeric: 'tabular-nums' }}>
					{sub}
				</Box>
			)}
		</Flex>
	);
};

const HeaderPill: React.FC<{ label: string; value: string; tone: 'pink' | 'teal' | 'indigo' }> = ({
	label,
	value,
	tone,
}) => {
	const t = TONE_RAMP[tone];
	return (
		<Flex
			direction='column'
			gap='0.5'
			px='2.5'
			py='1.5'
			borderRadius='md'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='bg.surface'
			minW={0}
		>
			<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' style={{ color: t.color }}>
				{label}
			</Box>
			<Box fontSize='12px' fontFamily='mono' color='fg.default' truncate title={value}>
				{value}
			</Box>
		</Flex>
	);
};

const Eyebrow: React.FC<React.PropsWithChildren<{ icon: React.ReactNode }>> = ({ icon, children }) => (
	<Flex
		align='center'
		gap='1.5'
		color='accent.pink'
		fontSize='10px'
		fontWeight='700'
		letterSpacing='0.06em'
		textTransform='uppercase'
	>
		{icon}
		{children}
	</Flex>
);

const UrlPill: React.FC<{ url: string }> = ({ url }) => (
	<Box
		fontFamily='mono'
		fontSize='xs'
		color='fg.default'
		bg='bg.canvas'
		borderWidth='1px'
		borderColor='border.subtle'
		borderRadius='md'
		px='2.5'
		py='1.5'
		overflow='hidden'
		textOverflow='ellipsis'
		whiteSpace='nowrap'
		transition='border-color .14s ease, background-color .14s ease'
		_hover={{
			borderColor: 'color-mix(in srgb, var(--beak-colors-accent-pink) 35%, var(--beak-colors-border-subtle))',
			bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 4%, var(--beak-colors-bg-canvas))',
		}}
	>
		{url}
	</Box>
);

export default OverviewTab;
