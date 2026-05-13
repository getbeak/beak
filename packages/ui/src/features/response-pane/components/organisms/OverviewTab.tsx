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

const VERB_COLOR: Record<string, string> = {
	get: 'var(--beak-colors-accent-teal)',
	post: 'var(--beak-colors-accent-pink)',
	put: 'var(--beak-colors-accent-indigo)',
	patch: 'var(--beak-colors-accent-indigo)',
	delete: 'var(--beak-colors-accent-alert)',
	head: 'var(--beak-colors-fg-muted)',
	options: 'var(--beak-colors-fg-muted)',
};

function statusToken(status: number) {
	if (status >= 200 && status < 300) return 'accent.success';
	if (status >= 300 && status < 400) return 'accent.warning';
	if (status >= 400) return 'accent.alert';
	return 'fg.muted';
}

const OverviewTab: React.FC<OverviewTabProps> = ({ flight }) => {
	const { requestStart, responseEnd } = flight.timing;
	const verb = flight.request.verb.toLocaleUpperCase();
	const verbColor = VERB_COLOR[flight.request.verb.toLowerCase()] ?? 'var(--beak-colors-fg-muted)';
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
						fontSize='xs'
						fontWeight='700'
						letterSpacing='0.05em'
						color='fg.default'
						style={{
							background: `color-mix(in srgb, ${verbColor} 18%, transparent)`,
							borderLeft: `3px solid ${verbColor}`,
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
							fontSize='xs'
							fontWeight='600'
							color={statusToken(status)}
							bg={`color-mix(in srgb, var(--beak-colors-${statusToken(status).replace('accent.', 'accent-')}) 16%, transparent)`}
						>
							<Box as='span' fontWeight='700'>{status}</Box>
							<Box as='span' opacity={0.85}>{getStatusReasonPhrase(status)}</Box>
						</Flex>
					)}
					<Box ml='auto' fontSize='xs' color='fg.subtle' fontFamily='mono'>
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
			gap='1'
			p='3'
			borderRadius='lg'
			borderWidth='1px'
			borderColor='border.subtle'
			bg='color-mix(in srgb, var(--beak-colors-bg-surface) 75%, transparent)'
		>
			<Flex align='center' gap='1.5'>
				<Flex
					align='center'
					justify='center'
					w='20px'
					h='20px'
					borderRadius='md'
					style={{ color: t.color, background: t.bg }}
				>
					{icon}
				</Flex>
				<Box fontSize='10px' fontWeight='700' letterSpacing='0.06em' textTransform='uppercase' color='fg.subtle'>
					{label}
				</Box>
			</Flex>
			<Box fontSize='sm' fontWeight='600' color='fg.default' fontFamily='mono'>
				{value}
			</Box>
			{sub && <Box fontSize='10px' color='fg.subtle'>{sub}</Box>}
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
	>
		{url}
	</Box>
);

export default OverviewTab;
