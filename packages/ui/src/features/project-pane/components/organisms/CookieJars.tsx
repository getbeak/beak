import { TypedObject } from '@beak/common/helpers/typescript';
import { selectAllCookieJars } from '@beak/state/cookies';
import BeakTooltip from '@beak/ui/components/atoms/BeakTooltip';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { actions as projectActions } from '@beak/ui/store/project';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Cookie, Star } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

const DEFAULT_PRIMARY = 'Environment';

/**
 * Sidebar section that surfaces each variable set's cookie jar, sized to
 * the currently-selected item. Two affordances per row:
 *
 *  1. Click the row body → open the global cookie-jar tab.
 *  2. Star button → mark this variable set as the project's primary jar
 *     (the deterministic destination for incoming Set-Cookie and the
 *     baseline jar for outgoing requests).
 *
 * Plus a "Send cookies" toggle at the bottom when a request is open —
 * the per-request opt-out. Adding *additional* jars per request is a
 * separate flow (deliberately kept out of the sidebar since the UX was
 * confusing — primary + opt-out covers the 95% case and the rest can
 * live in the request editor when needed).
 */
const CookieJars: React.FC = () => {
	const dispatch = useDispatch();
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const jars = useAppSelector(selectAllCookieJars);
	const projectCookies = useAppSelector(s => s.global.project.cookies);

	useSectionBody({ maxHeight: '160px', flexShrink: 0 });

	const setNames = useMemo(() => {
		return TypedObject.keys(variableSets ?? {}).sort((a, b) => {
			if (a === DEFAULT_PRIMARY) return -1;
			if (b === DEFAULT_PRIMARY) return 1;
			return String(a).localeCompare(String(b));
		}) as string[];
	}, [variableSets]);

	// Resolve the effective primary set the same way the flight code does so
	// the UI never disagrees with the wire. Stored value wins if it points at
	// an existing set; otherwise fall back to Environment / first alphabetic.
	const primary = useMemo(() => {
		const requested = projectCookies?.primaryVariableSet;
		if (requested && variableSets?.[requested]) return requested;
		if (setNames.includes(DEFAULT_PRIMARY)) return DEFAULT_PRIMARY;
		return setNames[0] ?? DEFAULT_PRIMARY;
	}, [projectCookies, variableSets, setNames]);

	const empty = setNames.length === 0;

	function openJar() {
		dispatch(changeTab({ type: 'cookie_jar', payload: 'cookie_jar', temporary: false }));
	}

	function markPrimary(setName: string) {
		dispatch(projectActions.setPrimaryCookieJar({ variableSet: setName }));
	}

	if (empty) {
		return (
			<Box px='3' py='1.5'>
				<Flex align='center' gap='2' fontSize='xs' color='fg.subtle' lineHeight='1.4'>
					<Cookie size={12} strokeWidth={1.8} />
					<Box flex='1 1 auto'>{'No variable sets — cookies are scoped per set.'}</Box>
				</Flex>
			</Box>
		);
	}

	return (
		<Flex direction='column' minW={0}>
			{setNames.map(setName => {
				const selectedItem = selectedSets[setName];
				const jar = jars[setName] ?? {};
				const cookiesForItem = selectedItem ? (jar[selectedItem]?.length ?? 0) : 0;
				const itemLabel = selectedItem ? variableSets?.[setName]?.items?.[selectedItem] : undefined;
				const totalAcrossItems = Object.values(jar).reduce((a, b) => a + b.length, 0);
				const isPrimary = setName === primary;

				return (
					<Flex
						key={setName}
						role='group'
						align='center'
						minW={0}
						w='100%'
						pr='2'
						css={{ '&:hover [data-row-actions], &:focus-within [data-row-actions]': { opacity: 1 } }}
					>
						<ChakraButton
							type='button'
							onClick={openJar}
							display='flex'
							alignItems='center'
							gap='2'
							flex='1 1 auto'
							h='26px'
							pl='3'
							minW={0}
							border='none'
							bg='transparent'
							color='fg.default'
							textAlign='left'
							cursor='pointer'
							transition='background-color .1s linear, color .1s linear'
							_hover={{
								bg: 'color-mix(in srgb, var(--beak-colors-fg-default) 5%, transparent)',
							}}
							_focusVisible={{
								outline: 'none',
								bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 8%, transparent)',
								boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
							}}
						>
							<Cookie
								size={11}
								strokeWidth={1.8}
								style={{
									flex: '0 0 auto',
									color: cookiesForItem > 0 ? 'var(--beak-colors-accent-pink)' : 'var(--beak-colors-fg-subtle)',
								}}
							/>
							<Box
								flex='1 1 auto'
								minW={0}
								overflow='hidden'
								textOverflow='ellipsis'
								whiteSpace='nowrap'
								fontSize='12px'
								fontWeight='500'
							>
								{setName}
							</Box>
							{itemLabel && (
								<Box
									flex='0 0 auto'
									fontSize='10.5px'
									color='fg.subtle'
									overflow='hidden'
									textOverflow='ellipsis'
									whiteSpace='nowrap'
									maxW='90px'
								>
									{itemLabel}
								</Box>
							)}
							<CookieCount value={cookiesForItem} latent={cookiesForItem === 0 && totalAcrossItems > 0} />
						</ChakraButton>

						<Flex
							data-row-actions
							align='center'
							gap='0.5'
							flex='0 0 auto'
							pl='1'
							opacity={isPrimary ? 1 : 0}
							transition='opacity .12s linear'
						>
							<BeakTooltip content={isPrimary ? 'Primary cookie jar' : `Set ${setName} as primary`}>
								<RowIconButton
									aria-label={isPrimary ? 'Primary cookie jar' : `Set ${setName} as primary`}
									active={isPrimary}
									onClick={() => markPrimary(setName)}
								>
									<Star size={11} strokeWidth={1.8} fill={isPrimary ? 'currentColor' : 'transparent'} />
								</RowIconButton>
							</BeakTooltip>
						</Flex>
					</Flex>
				);
			})}
		</Flex>
	);
};

interface RowIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	active?: boolean;
}

const RowIconButton = React.forwardRef<HTMLButtonElement, React.PropsWithChildren<RowIconButtonProps>>(
	({ active, children, onClick, ...rest }, ref) => (
		<ChakraButton
			ref={ref}
			type='button'
			display='inline-flex'
			alignItems='center'
			justifyContent='center'
			w='18px'
			h='18px'
			border='none'
			borderRadius='sm'
			bg='transparent'
			color={active ? 'accent.pink' : 'fg.subtle'}
			cursor='pointer'
			transition='color .1s linear, background-color .1s linear'
			_hover={{
				color: 'accent.pink',
				bg: 'color-mix(in srgb, var(--beak-colors-accent-pink) 12%, transparent)',
			}}
			_focusVisible={{
				outline: 'none',
				boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--beak-colors-accent-pink) 45%, transparent)',
			}}
			onClick={event => {
				event.preventDefault();
				event.stopPropagation();
				onClick?.(event);
			}}
			{...rest}
		>
			{children}
		</ChakraButton>
	),
);
RowIconButton.displayName = 'RowIconButton';

const CookieCount: React.FC<{ value: number; latent: boolean }> = ({ value, latent }) => {
	if (value === 0 && !latent) return null;
	return (
		<Flex
			as='span'
			align='center'
			justify='center'
			flex='0 0 auto'
			minW='18px'
			h='16px'
			px='1.5'
			borderRadius='sm'
			borderWidth='1px'
			fontSize='10px'
			fontWeight='700'
			fontVariantNumeric='tabular-nums'
			borderColor={
				value > 0
					? 'color-mix(in srgb, var(--beak-colors-accent-pink) 32%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-fg-subtle) 26%, transparent)'
			}
			bg={
				value > 0
					? 'color-mix(in srgb, var(--beak-colors-accent-pink) 14%, transparent)'
					: 'color-mix(in srgb, var(--beak-colors-fg-subtle) 10%, transparent)'
			}
			color={value > 0 ? 'accent.pink' : 'fg.subtle'}
		>
			{value > 0 ? value : '·'}
		</Flex>
	);
};

export default CookieJars;
