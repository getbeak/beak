import {
	type CookieEntry,
	clearAllCookies,
	clearJar,
	clearJarItem,
	deleteCookie,
	selectAllCookieJars,
} from '@beak/state/cookies';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Cookie as CookieIcon, ShieldCheck, ShieldHalf, ShieldOff, Star, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

const DEFAULT_PRIMARY = 'Environment';

type JarUsage = 'primary' | 'used' | 'unused' | 'orphan';

/**
 * Inspector for every cookie jar in the project. Grouped first by
 * variable set, then by item (the "environment column"), then by
 * domain. Read-only-ish: per-row delete, per-item clear, per-jar
 * clear, and clear-all. Editing happens through HTTP responses — the
 * jar mirrors what the server has set.
 */
const CookieJarEditor: React.FC = () => {
	const jars = useAppSelector(selectAllCookieJars);
	const variableSetMeta = useAppSelector(s => s.global.variableSets.variableSets);
	const projectTree = useAppSelector(s => s.global.project.tree);
	const requestedPrimary = useAppSelector(s => s.global.project.cookies?.primaryVariableSet);
	const dispatch = useDispatch();

	const jarKeys = useMemo(() => Object.keys(jars).sort(), [jars]);
	const totalCookies = useMemo(
		() => Object.values(jars).reduce((sum, jar) => sum + Object.values(jar).reduce((a, b) => a + b.length, 0), 0),
		[jars],
	);

	// Mirrors `resolveEnabledCookieJars` — the project's primary jar is the
	// one used by every flight by default. Falls back to "Environment", then
	// the first variable set alphabetically.
	const primaryVariableSet = useMemo(() => {
		const existing = variableSetMeta ?? {};
		if (requestedPrimary && existing[requestedPrimary]) return requestedPrimary;
		const names = Object.keys(existing).sort();
		if (names.includes(DEFAULT_PRIMARY)) return DEFAULT_PRIMARY;
		return names[0];
	}, [requestedPrimary, variableSetMeta]);

	// A variable set's jar is "used" (beyond being primary) when at least one
	// request opts into it via `additionalCookieJarSets`. Anything else is
	// dead weight — we still keep the cookies around in case the user re-adds
	// the set, but the UI dims them so they stop drawing the eye.
	const additionalUsedSets = useMemo(() => {
		const used = new Set<string>();
		for (const node of Object.values(projectTree)) {
			if (!node || node.type !== 'request' || node.mode !== 'valid') continue;
			const list = node.info.options?.additionalCookieJarSets ?? [];
			for (const name of list) used.add(name);
		}
		return used;
	}, [projectTree]);

	function jarUsageFor(name: string): JarUsage {
		if (!variableSetMeta?.[name]) return 'orphan';
		if (name === primaryVariableSet) return 'primary';
		if (additionalUsedSets.has(name)) return 'used';
		return 'unused';
	}

	return (
		<Flex direction='column' h='100%' bg='bg.canvas' overflow='hidden'>
			<Flex
				align='center'
				justify='space-between'
				px='4'
				py='2.5'
				borderBottomWidth='1px'
				borderColor='border.subtle'
				bg='bg.surface'
			>
				<Flex align='center' gap='2'>
					<Flex
						align='center'
						justify='center'
						w='22px'
						h='22px'
						borderRadius='sm'
						bg='color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
						color='accent.pink'
					>
						<CookieIcon size={13} strokeWidth={2.2} />
					</Flex>
					<Box>
						<Box fontSize='13px' fontWeight='700' letterSpacing='-0.01em' color='fg.default'>
							{'Cookie jars'}
						</Box>
						<Box fontSize='10.5px' color='fg.subtle'>
							{totalCookies === 0
								? 'No cookies captured yet'
								: `${totalCookies} cookie${totalCookies === 1 ? '' : 's'} across ${jarKeys.length} variable set${jarKeys.length === 1 ? '' : 's'}`}
						</Box>
					</Box>
				</Flex>
				{totalCookies > 0 && (
					<ActionButton
						label='Clear all'
						tone='alert'
						icon={<Trash2 size={11} strokeWidth={2.2} />}
						onClick={() => dispatch(clearAllCookies())}
					/>
				)}
			</Flex>
			<Box flex='1 1 auto' overflowY='auto'>
				{jarKeys.length === 0 && (
					<Flex direction='column' align='center' justify='center' h='100%' gap='2' px='4' textAlign='center'>
						<Box
							as='span'
							display='inline-flex'
							alignItems='center'
							justifyContent='center'
							w='44px'
							h='44px'
							borderRadius='full'
							bg='color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)'
							color='accent.pink'
						>
							<CookieIcon size={20} strokeWidth={1.8} />
						</Box>
						<Box fontSize='13px' fontWeight='700' color='fg.default'>
							{'No cookies yet'}
						</Box>
						<Box fontSize='11.5px' color='fg.muted' maxW='420px' lineHeight='1.45'>
							{
								'Send a request whose response includes a Set-Cookie header. Captured cookies show up here, keyed by the variable set + item that handled the request.'
							}
						</Box>
					</Flex>
				)}
				{jarKeys.map(variableSet => {
					const jar = jars[variableSet];
					const items = Object.keys(jar).sort();
					const variableSetItemMeta = variableSetMeta[variableSet]?.items ?? {};
					const usage = jarUsageFor(variableSet);
					const inactive = usage === 'unused' || usage === 'orphan';
					return (
						<Box
							key={variableSet}
							borderBottomWidth='1px'
							borderColor='border.subtle'
							bg='bg.canvas'
							opacity={inactive ? 0.55 : 1}
							transition='opacity .12s ease'
						>
							<Flex
								align='center'
								justify='space-between'
								px='4'
								py='2'
								bg={
									inactive
										? 'color-mix(in srgb, var(--beak-colors-fg-default) 4%, transparent)'
										: 'color-mix(in srgb, var(--beak-colors-accent-teal) 6%, transparent)'
								}
								borderBottomWidth='1px'
								borderColor='border.subtle'
							>
								<Flex align='center' gap='1.5' fontSize='12px' fontWeight='700'>
									<Box
										as='span'
										textTransform='uppercase'
										letterSpacing='0.06em'
										fontSize='10px'
										color={inactive ? 'fg.subtle' : 'accent.teal'}
									>
										{'Variable set'}
									</Box>
									<Box as='span' color='fg.default' textTransform='none' letterSpacing='-0.005em' fontWeight='700'>
										{variableSet}
									</Box>
									<JarUsageBadge usage={usage} />
								</Flex>
								<ActionButton
									label='Clear jar'
									tone='subtle'
									icon={<Trash2 size={10} strokeWidth={2.2} />}
									onClick={() => dispatch(clearJar({ variableSet }))}
								/>
							</Flex>
							{items.map(itemId => {
								const cookies = jar[itemId];
								if (cookies.length === 0) return null;
								const itemName = variableSetItemMeta[itemId] ?? itemId;
								return (
									<Box key={itemId} borderTopWidth='1px' borderColor='border.subtle'>
										<Flex align='center' justify='space-between' px='4' py='1.5' bg='bg.surface'>
											<Flex align='center' gap='1.5' fontSize='11px'>
												<Box
													as='span'
													fontSize='9.5px'
													fontWeight='700'
													letterSpacing='0.06em'
													textTransform='uppercase'
													color='fg.subtle'
												>
													{'Item'}
												</Box>
												<Box as='span' fontWeight='600' color='fg.default'>
													{itemName}
												</Box>
												<Box as='span' fontSize='10px' color='fg.subtle'>
													{`(${cookies.length})`}
												</Box>
											</Flex>
											<ActionButton
												label='Clear'
												tone='subtle'
												icon={<Trash2 size={10} strokeWidth={2.2} />}
												onClick={() => dispatch(clearJarItem({ variableSet, itemId }))}
											/>
										</Flex>
										<Box>
											{cookies.map((cookie, idx) => (
												<CookieRow
													key={`${cookie.name}-${cookie.domain}-${cookie.path}-${idx}`}
													cookie={cookie}
													onDelete={() =>
														dispatch(
															deleteCookie({
																variableSet,
																itemId,
																name: cookie.name,
																domain: cookie.domain,
																path: cookie.path,
															}),
														)
													}
												/>
											))}
										</Box>
									</Box>
								);
							})}
						</Box>
					);
				})}
			</Box>
		</Flex>
	);
};

const RowBox = chakra('div', {
	base: {
		px: '4',
		py: '1.5',
		borderBottomWidth: '1px',
		borderColor: 'border.subtle',
		display: 'grid',
		gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr) auto',
		alignItems: 'start',
		columnGap: '2.5',
	},
});

const CookieRow: React.FC<{ cookie: CookieEntry; onDelete: () => void }> = ({ cookie, onDelete }) => {
	const expiresLabel = cookie.expires ? formatExpires(cookie.expires) : 'session';
	return (
		<RowBox>
			<Flex direction='column' gap='0.5' minW={0}>
				<Box fontSize='12px' fontWeight='700' color='fg.default' fontFamily='mono' wordBreak='break-all'>
					{cookie.name}
				</Box>
				<Flex gap='1' wrap='wrap'>
					<Tag label='Domain' value={cookie.hostOnly ? `${cookie.domain} (host-only)` : cookie.domain} />
					<Tag label='Path' value={cookie.path} />
					<Tag label='Expires' value={expiresLabel} />
					{cookie.sameSite && <Tag label='SameSite' value={cookie.sameSite} tone='info' />}
					{cookie.secure && <Pill icon={<ShieldCheck size={9} strokeWidth={2.4} />} label='Secure' tone='success' />}
					{cookie.httpOnly && <Pill icon={<ShieldHalf size={9} strokeWidth={2.4} />} label='HttpOnly' tone='info' />}
					{!cookie.secure && !cookie.httpOnly && (
						<Pill icon={<ShieldOff size={9} strokeWidth={2.4} />} label='Unsecured' tone='warning' />
					)}
				</Flex>
			</Flex>
			<Box fontSize='12px' color='fg.muted' fontFamily='mono' wordBreak='break-all' minW={0}>
				{cookie.value}
			</Box>
			<Flex justify='flex-end' align='flex-start'>
				<ActionButton
					label='Delete'
					tone='alert'
					icon={<Trash2 size={10} strokeWidth={2.2} />}
					onClick={onDelete}
					compact
				/>
			</Flex>
		</RowBox>
	);
};

type Tone = 'subtle' | 'success' | 'warning' | 'info' | 'alert';

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
	alert: {
		color: 'accent.alert',
		bg: 'color-mix(in srgb, var(--beak-colors-accent-alert) 12%, transparent)',
		border: 'color-mix(in srgb, var(--beak-colors-accent-alert) 32%, transparent)',
	},
};

const Tag: React.FC<{ label: string; value: string; tone?: Tone }> = ({ label, value, tone = 'subtle' }) => {
	const styles = toneStyles[tone];
	return (
		<Flex
			align='center'
			gap='1'
			h='17px'
			px='1.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor={styles.border}
			bg={styles.bg}
			color={styles.color}
			fontSize='9.5px'
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

const JarUsageBadge: React.FC<{ usage: JarUsage }> = ({ usage }) => {
	if (usage === 'primary')
		return <Pill icon={<Star size={9} strokeWidth={2.4} fill='currentColor' />} label='Primary' tone='success' />;
	if (usage === 'used') return <Pill icon={<CookieIcon size={9} strokeWidth={2.4} />} label='In use' tone='info' />;
	if (usage === 'orphan') return <Pill icon={<ShieldOff size={9} strokeWidth={2.4} />} label='Orphan' tone='warning' />;
	return <Pill icon={null} label='Unused' tone='subtle' />;
};

const Pill: React.FC<{ icon: React.ReactNode; label: string; tone: Tone }> = ({ icon, label, tone }) => {
	const styles = toneStyles[tone];
	return (
		<Flex
			align='center'
			gap='1'
			h='17px'
			px='1.5'
			borderRadius='sm'
			borderWidth='1px'
			borderColor={styles.border}
			bg={styles.bg}
			color={styles.color}
			fontSize='9.5px'
			fontWeight='700'
			textTransform='uppercase'
			letterSpacing='0.04em'
		>
			{icon}
			<Box as='span'>{label}</Box>
		</Flex>
	);
};

const ChakraButton = chakra('button');

const ActionButton: React.FC<{
	label: string;
	tone: Tone;
	icon: React.ReactNode;
	compact?: boolean;
	onClick: () => void;
}> = ({ label, tone, icon, compact, onClick }) => {
	const styles = toneStyles[tone];
	return (
		<ChakraButton
			type='button'
			onClick={onClick}
			display='inline-flex'
			alignItems='center'
			gap='1'
			h='22px'
			px={compact ? '1.5' : '2'}
			borderRadius='sm'
			borderWidth='1px'
			borderColor={styles.border}
			bg={styles.bg}
			color={styles.color}
			fontSize='10.5px'
			fontWeight='700'
			letterSpacing='0.02em'
			textTransform='uppercase'
			cursor='pointer'
			transition='filter .12s ease'
			_hover={{ filter: 'brightness(1.1)' }}
		>
			{icon}
			<Box as='span'>{label}</Box>
		</ChakraButton>
	);
};

function formatExpires(epochMs: number): string {
	const d = new Date(epochMs);
	const deltaMs = epochMs - Date.now();
	const abs = Math.abs(deltaMs);
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	let rel: string;
	if (abs < minute) rel = `${Math.round(abs / 1000)}s`;
	else if (abs < hour) rel = `${Math.round(abs / minute)}m`;
	else if (abs < day) rel = `${Math.round(abs / hour)}h`;
	else rel = `${Math.round(abs / day)}d`;
	const direction = deltaMs >= 0 ? 'in' : 'ago';
	return `${d.toISOString().slice(0, 16).replace('T', ' ')}Z (${direction} ${rel})`;
}

export default CookieJarEditor;
