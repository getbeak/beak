import { parseSetCookie, splitFoldedSetCookies } from '@beak/state/cookies';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Cookie as CookieIcon, ShieldCheck, ShieldHalf, ShieldOff } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';

interface ResponseHeadersTableProps {
	headers: Record<string, string>;
	/** Resolved request URL — used so parsed Set-Cookie defaults (domain, path) are realistic. */
	responseUrl?: string;
}

/**
 * Read-only renderer for a response's headers. Mirrors the look of
 * `BasicTableEditor`'s read view but special-cases `Set-Cookie` rows
 * with parsed attribute badges: Domain, Path, Expires, Max-Age,
 * Secure, HttpOnly, SameSite. Multiple folded Set-Cookie values are
 * expanded into one row per cookie via `splitFoldedSetCookies`.
 */
const ResponseHeadersTable: React.FC<ResponseHeadersTableProps> = ({ headers, responseUrl }) => {
	const rows = useMemo(() => buildRows(headers, responseUrl), [headers, responseUrl]);

	if (rows.length === 0) {
		return (
			<Box p='3' fontSize='12px' color='fg.subtle'>
				{'No headers.'}
			</Box>
		);
	}

	return (
		<Flex direction='column' h='100%' w='100%' overflowY='auto'>
			{rows.map((row, idx) => (
				<HeaderRow key={`${row.name}-${idx}`} row={row} />
			))}
		</Flex>
	);
};

interface PlainRow {
	kind: 'plain';
	name: string;
	value: string;
}

interface CookieRow {
	kind: 'set-cookie';
	name: string;
	cookieName: string;
	cookieValue: string;
	domain?: string;
	path?: string;
	expires?: number;
	maxAge?: string;
	secure: boolean;
	httpOnly: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
	raw: string;
}

type Row = PlainRow | CookieRow;

function buildRows(headers: Record<string, string>, responseUrl?: string): Row[] {
	const ctxHost = safeUrlHost(responseUrl);
	const ctxPath = safeUrlPath(responseUrl);
	const out: Row[] = [];
	for (const [name, value] of Object.entries(headers)) {
		if (name.toLowerCase() === 'set-cookie') {
			const candidates = splitFoldedSetCookies(value);
			for (const raw of candidates) {
				const parsed = parseSetCookie(raw, { requestHost: ctxHost, requestPath: ctxPath });
				if (!parsed) {
					out.push({ kind: 'plain', name, value: raw });
					continue;
				}
				const maxAgeMatch = /max-age\s*=\s*(-?\d+)/i.exec(raw);
				out.push({
					kind: 'set-cookie',
					name,
					cookieName: parsed.name,
					cookieValue: parsed.value,
					domain: parsed.hostOnly ? undefined : parsed.domain,
					path: parsed.path,
					expires: parsed.expires,
					maxAge: maxAgeMatch ? maxAgeMatch[1] : undefined,
					secure: parsed.secure,
					httpOnly: parsed.httpOnly,
					sameSite: parsed.sameSite,
					raw,
				});
			}
			continue;
		}
		out.push({ kind: 'plain', name, value });
	}
	return out;
}

function safeUrlHost(url?: string): string {
	if (!url) return '';
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

function safeUrlPath(url?: string): string {
	if (!url) return '/';
	try {
		return new URL(url).pathname || '/';
	} catch {
		return '/';
	}
}

const RowWrapper = chakra('div', {
	base: {
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		px: '2.5',
		py: '1.5',
	},
});

const HeaderRow: React.FC<{ row: Row }> = ({ row }) => {
	if (row.kind === 'plain') return <PlainHeader name={row.name} value={row.value} />;
	return <SetCookieHeader row={row} />;
};

const PlainHeader: React.FC<{ name: string; value: string }> = ({ name, value }) => (
	<RowWrapper>
		<Flex gap='2' fontSize='12px' fontFamily='mono' lineHeight='1.5' align='center'>
			<Box
				flex='0 0 30%'
				minW={0}
				color='fg.muted'
				fontWeight='600'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				title={name}
			>
				{name}
			</Box>
			<Box
				flex='1 1 auto'
				minW={0}
				color='fg.default'
				overflow='hidden'
				textOverflow='ellipsis'
				whiteSpace='nowrap'
				title={value}
			>
				{value}
			</Box>
		</Flex>
	</RowWrapper>
);

const SetCookieHeader: React.FC<{ row: CookieRow }> = ({ row }) => {
	const sameSiteTone =
		row.sameSite === 'Strict'
			? 'success'
			: row.sameSite === 'Lax'
				? 'info'
				: row.sameSite === 'None'
					? 'warning'
					: 'subtle';
	return (
		<RowWrapper>
			<Flex gap='2' fontSize='12px' lineHeight='1.5' align='flex-start'>
				<Box flex='0 0 30%' minW={0} color='accent.pink' fontWeight='700' fontFamily='mono'>
					<Flex align='center' gap='1.5'>
						<CookieIcon size={11} strokeWidth={2.2} flexShrink={0} />
						<Box as='span' overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap' title={row.name}>
							{row.name}
						</Box>
					</Flex>
				</Box>
				<Flex direction='column' gap='1' flex='1 1 auto' minW={0}>
					<Flex gap='1.5' align='center' fontFamily='mono' fontSize='12px' color='fg.default' minW={0}>
						<Box as='span' fontWeight='600' color='accent.pink' flexShrink={0}>
							{row.cookieName}
						</Box>
						<Box as='span' color='fg.subtle' flexShrink={0}>
							{'='}
						</Box>
						<Box
							as='span'
							flex='1 1 auto'
							minW={0}
							overflow='hidden'
							textOverflow='ellipsis'
							whiteSpace='nowrap'
							title={row.cookieValue}
						>
							{row.cookieValue}
						</Box>
					</Flex>
					<Flex gap='1' wrap='wrap'>
						{row.domain && <AttrBadge label='Domain' value={row.domain} />}
						{row.path && <AttrBadge label='Path' value={row.path} />}
						{row.expires !== undefined && <AttrBadge label='Expires' value={formatExpires(row.expires)} />}
						{row.maxAge !== undefined && <AttrBadge label='Max-Age' value={`${row.maxAge}s`} />}
						{row.sameSite && <AttrBadge label='SameSite' value={row.sameSite} tone={sameSiteTone} />}
						{row.secure && <Pill icon={<ShieldCheck size={9} strokeWidth={2.4} />} label='Secure' tone='success' />}
						{row.httpOnly && <Pill icon={<ShieldHalf size={9} strokeWidth={2.4} />} label='HttpOnly' tone='info' />}
						{!row.secure && !row.httpOnly && (
							<Pill icon={<ShieldOff size={9} strokeWidth={2.4} />} label='Unsecured' tone='warning' />
						)}
					</Flex>
				</Flex>
			</Flex>
		</RowWrapper>
	);
};

type Tone = 'subtle' | 'success' | 'warning' | 'info';

const toneStyles: Record<Tone, { color: string; bg: string; border: string }> = {
	subtle: {
		color: 'fg.muted',
		bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 6%, transparent)',
		border: 'border.subtle',
	},
	success: {
		color: 'accent.success',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-success) 12%, transparent)',
		border: 'color-mix(in srgb, var(--beak-colors-accent-success) 32%, transparent)',
	},
	warning: {
		color: 'accent.warning',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-warning) 12%, transparent)',
		border: 'color-mix(in srgb, var(--beak-colors-accent-warning) 32%, transparent)',
	},
	info: {
		color: 'accent.indigo',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 12%, transparent)',
		border: 'color-mix(in srgb, var(--beak-colors-accent-indigo) 32%, transparent)',
	},
};

const AttrBadge: React.FC<{ label: string; value: string; tone?: Tone }> = ({ label, value, tone = 'subtle' }) => {
	const styles = toneStyles[tone];
	return (
		<Flex
			align='center'
			gap='1'
			h='18px'
			px='1.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor={styles.border}
			bg={styles.bg}
			color={styles.color}
			fontSize='10px'
			fontWeight='600'
			letterSpacing='0.02em'
		>
			<Box as='span' textTransform='uppercase' opacity={0.7}>
				{label}
			</Box>
			<Box as='span' fontFamily='mono' textTransform='none' fontWeight='500'>
				{value}
			</Box>
		</Flex>
	);
};

const Pill: React.FC<{ icon: React.ReactNode; label: string; tone: Tone }> = ({ icon, label, tone }) => {
	const styles = toneStyles[tone];
	return (
		<Flex
			align='center'
			gap='1'
			h='18px'
			px='1.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor={styles.border}
			bg={styles.bg}
			color={styles.color}
			fontSize='10px'
			fontWeight='700'
			textTransform='uppercase'
			letterSpacing='0.04em'
		>
			{icon}
			<Box as='span'>{label}</Box>
		</Flex>
	);
};

function formatExpires(epochMs: number): string {
	try {
		const d = new Date(epochMs);
		const now = Date.now();
		const deltaMs = epochMs - now;
		const abs = Math.abs(deltaMs);
		const minute = 60_000;
		const hour = 60 * minute;
		const day = 24 * hour;
		let rel = '';
		if (abs < minute) rel = `${Math.round(abs / 1000)}s`;
		else if (abs < hour) rel = `${Math.round(abs / minute)}m`;
		else if (abs < day) rel = `${Math.round(abs / hour)}h`;
		else rel = `${Math.round(abs / day)}d`;
		const direction = deltaMs >= 0 ? 'in' : 'ago';
		return `${d.toISOString().slice(0, 16).replace('T', ' ')}Z (${direction} ${rel})`;
	} catch {
		return new Date(epochMs).toISOString();
	}
}

export default ResponseHeadersTable;
