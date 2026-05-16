import { TypedObject } from '@beak/common/helpers/typescript';
import { selectAllCookieJars } from '@beak/state/cookies';
import useSectionBody from '@beak/ui/features/sidebar/hooks/use-section-body';
import { changeTab } from '@beak/ui/features/tabs/store/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Box, chakra, Flex } from '@chakra-ui/react';
import { Cookie } from 'lucide-react';
import * as React from 'react';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';

const ChakraButton = chakra('button');

/**
 * Sidebar section that surfaces each variable set's cookie jar, sized
 * to the currently-selected item. Clicking any row opens the global
 * cookie-jar tab — same pattern as variable sets, which open the
 * variable-set editor on click.
 *
 * When no jars hold any cookies the section degrades to a soft empty
 * state with a single "Open cookie jar" affordance so the feature
 * stays discoverable before any Set-Cookie has been captured.
 */
const CookieJars: React.FC = () => {
	const dispatch = useDispatch();
	const variableSets = useAppSelector(s => s.global.variableSets.variableSets);
	const selectedSets = useAppSelector(s => s.global.preferences.editor.selectedVariableSets);
	const jars = useAppSelector(selectAllCookieJars);

	useSectionBody({ maxHeight: '160px', flexShrink: 0 });

	const rows = useMemo(() => {
		// Surface a row for every variable set the project has (even those
		// without cookies yet) so the section reads as an index of *what
		// could be in flight*, not just *what has been captured*. Sorted
		// alphabetically with "Environment" pinned to the top because it's
		// the default-bootstrap jar.
		return TypedObject.keys(variableSets ?? {})
			.sort((a, b) => {
				if (a === 'Environment') return -1;
				if (b === 'Environment') return 1;
				return String(a).localeCompare(String(b));
			})
			.map(setName => {
				const selectedItem = selectedSets[setName];
				const jar = jars[setName] ?? {};
				const cookiesForItem = selectedItem ? (jar[selectedItem]?.length ?? 0) : 0;
				const itemLabel = selectedItem ? variableSets[setName].items[selectedItem] : undefined;
				const totalAcrossItems = Object.values(jar).reduce((a, b) => a + b.length, 0);
				return {
					setName,
					selectedItem,
					itemLabel,
					cookiesForItem,
					totalAcrossItems,
				};
			});
	}, [variableSets, selectedSets, jars]);

	const empty = rows.length === 0;

	function openJar() {
		dispatch(changeTab({ type: 'cookie_jar', payload: 'cookie_jar', temporary: false }));
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
			{rows.map(({ setName, itemLabel, cookiesForItem, totalAcrossItems }) => (
				<ChakraButton
					key={String(setName)}
					type='button'
					onClick={openJar}
					title={
						cookiesForItem > 0
							? `${cookiesForItem} cookie${cookiesForItem === 1 ? '' : 's'} on ${itemLabel ?? '—'}`
							: totalAcrossItems > 0
								? `${totalAcrossItems} cookie${totalAcrossItems === 1 ? '' : 's'} across other items`
								: 'No cookies captured yet'
					}
					display='flex'
					alignItems='center'
					gap='2'
					h='26px'
					px='3'
					minW={0}
					w='100%'
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
						{String(setName)}
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
			))}
		</Flex>
	);
};

/**
 * Tabular-numeric pill showing the cookie count for the active item.
 * The `latent` state (count = 0 here, but cookies exist on other items)
 * uses a softer neutral tone — the jar isn't *empty*, just not active
 * for the current environment.
 */
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
