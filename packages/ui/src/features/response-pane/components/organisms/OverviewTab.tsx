import { Box, Flex, Grid } from '@chakra-ui/react';
import binaryStore from '@beak/ui/lib/binary-store';
import { getStatusReasonPhrase } from '@beak/ui/utils/http';
import type { Flight } from '@getbeak/types/flight';
import { Clock, FileText, Globe, Server, Timer } from 'lucide-react';
import prettyBytes from 'pretty-bytes';
import * as React from 'react';

export interface OverviewTabProps {
	flight: Flight;
}

import { verbToColor } from '@beak/design-system/helpers';

function statusToken(status: number) {
	if (status >= 200 && status < 300) return 'accent.success';
	if (status >= 300 && status < 400) return 'accent.warning';
	if (status >= 400 && status < 500) return 'accent.warning';
	if (status >= 500) return 'accent.alert';
	return 'fg.muted';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ flight }) => {
	const { requestStart, responseEnd } = flight.timing;
	const verb = flight.request.verb.toLocaleUpperCase();
	const verbColor = verbToColor(flight.request.verb);
	const status = flight.response?.status;
	const bodySize = flight.response?.hasBody ? binaryStore.get(flight.binaryStoreKey).length : 0;
	const duration = requestStart !== undefined && responseEnd !== undefined ? responseEnd - requestStart : 0;
	const startedAt = new Date(flight.timing.beakStart);

	return (
		<Box h='100%' overflowY='auto' p='4'>
			<Flex direction='column' gap='3' maxW='720px' mx='auto'>
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
							<Box as='span' fontWeight='700' fontFamily='mono' style={{ fontVariantNumeric: 'tabular-nums' }}>{status}</Box>
							<Box
								as='span'
								fontWeight='500'
								style={{ color: `color-mix(in srgb, var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')}) 75%, var(--beak-colors-fg-default))` }}
							>
								{getStatusReasonPhrase(status)}
							</Box>
						</Flex>
					)}
					<Box ml='auto' fontSize='xs' color='fg.subtle' fontFamily='mono' style={{ fontVariantNumeric: 'tabular-nums' }}>
						{duration}ms
					</Box>
				</Flex>

				{/* Stat grid */}
				<Grid templateColumns='repeat(3, minmax(0, 1fr))' gap='2'>
					<StatCard
						icon={<Timer size={13} />}
						label='Duration'
						value={`${duration} ms`}
						tone='pink'
					/>
					<StatCard
						icon={<FileText size={13} />}
						label='Body'
						value={bodySize > 0 ? prettyBytes(bodySize) : '—'}
						sub={bodySize > 0 ? `${bodySize.toLocaleString()} bytes` : undefined}
						tone='teal'
					/>
					<StatCard
						icon={<Clock size={13} />}
						label='Sent'
						value={startedAt.toLocaleTimeString()}
						sub={startedAt.toLocaleDateString()}
						tone='indigo'
					/>
				</Grid>

				{/* URL block */}
				<Flex direction='column' gap='1.5'>
					<Eyebrow icon={<Globe size={10} />}>{'Request URL'}</Eyebrow>
					<UrlPill url={Array.isArray(flight.request.url) ? flight.request.url.join('') : String(flight.request.url ?? '')} />

					{flight.response?.url && (
						<>
							<Eyebrow icon={<Server size={10} />}>{'Response URL'}</Eyebrow>
							<UrlPill url={flight.response.url} />
						</>
					)}
				</Flex>
			</Flex>
		</Box>
	);
};

const TONE_RAMP: Record<string, { color: string; bg: string }> = {
	pink: { color: 'var(--beak-colors-accent-pink)', bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 10%, transparent)' },
	teal: { color: 'var(--beak-colors-accent-teal)', bg: 'color-mix(in srgb, var(--beak-colors-accent-teal) 10%, transparent)' },
	indigo: { color: 'var(--beak-colors-accent-indigo)', bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 10%, transparent)' },
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
					w='24px'
					h='24px'
					borderRadius='md'
					style={{
						color: t.color,
						background: t.bg,
						border: `1px solid color-mix(in srgb, ${t.color} 28%, transparent)`,
						boxShadow: `0 3px 8px color-mix(in srgb, ${t.color} 18%, transparent), inset 0 1px 0 color-mix(in srgb, white 14%, transparent)`,
					}}
				>
					{icon}
				</Flex>
				<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
					{label}
				</Box>
			</Flex>
			<Box fontSize='md' fontWeight='600' color='fg.default' fontFamily='mono' lineHeight='1.2' style={{ fontVariantNumeric: 'tabular-nums' }}>
				{value}
			</Box>
			{sub && <Box fontSize='10px' color='fg.subtle' style={{ fontVariantNumeric: 'tabular-nums' }}>{sub}</Box>}
		</Flex>
	);
};

const Eyebrow: React.FC<React.PropsWithChildren<{ icon: React.ReactNode }>> = ({ icon, children }) => (
	<Flex align='center' gap='1.5' color='fg.subtle' fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase'>
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
