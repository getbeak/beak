import { Box, Button, Grid } from '@chakra-ui/react';
import VariableInput from '@beak/ui/features/variable-input/components/VariableInput';
import useVariableContext from '@beak/ui/features/variables/hooks/use-variable-context';
import { parseValueSections } from '@beak/ui/features/variables/parser';
import type { ValueSections } from '@beak/ui/features/variables/values';
import { requestPreferenceSetReqMainTab } from '@beak/ui/store/preferences/actions';
import { useAppSelector } from '@beak/ui/store/redux';
import { Loader2 } from 'lucide-react';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import * as React from 'react';
import { useDispatch } from 'react-redux';
import URL from 'url-parse';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';

export interface HeaderProps {
	node: ValidRequestNode;
}

const selectStyle: React.CSSProperties = {
	WebkitAppearance: 'none' as React.CSSProperties['WebkitAppearance'],
	MozAppearance: 'none' as React.CSSProperties['MozAppearance'],
	padding: '6px 6px',
	paddingTop: '7px',
	marginRight: '10px',
	borderRadius: '4px',
	border: '1px solid var(--beak-colors-border-default)',
	background: 'var(--beak-colors-bg-surface)',
	color: 'var(--beak-colors-accent-pink)',
	textTransform: 'uppercase',
	fontWeight: 800,
};

const Header: React.FC<HeaderProps> = ({ node }) => {
	const dispatch = useDispatch();
	const currentFlight = useAppSelector(s => s.global.flight.activeFlights[node.id]);
	const flighting = Boolean(currentFlight);
	const context = useVariableContext(node.id);
	const verb = node.info.verb;

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
		<Grid
			templateColumns='auto minmax(0, 1fr) auto'
			justifyContent='space-between'
			alignItems='center'
			my='6'
			px='2.5'
			fontSize='md'
			maxW='calc(100% - 20px)'
		>
			<Box position='relative' flex='0 0 auto'>
				<select value={verb} style={selectStyle} onChange={() => undefined}>
					<option value={verb}>{verb}</option>
				</select>
				<select
					value={verb}
					style={{ ...selectStyle, position: 'absolute', textTransform: 'none', left: 0, opacity: 0.0000001 }}
					onChange={e =>
						dispatch(requestUriUpdated({ requestId: node.id, verb: e.currentTarget.value }))
					}
				>
					<optgroup label='Standard'>
						<option value='get'>{'GET'}</option>
						<option value='post'>{'POST'}</option>
						<option value='patch'>{'PATCH'}</option>
						<option value='put'>{'PUT'}</option>
						<option value='delete'>{'DELETE'}</option>
						<option value='head'>{'HEAD'}</option>
						<option value='options'>{'OPTIONS'}</option>
					</optgroup>
					<optgroup label='Custom'>
						<option value='custom' disabled>{'Create...'}</option>
					</optgroup>
				</select>
			</Box>

			<Box
				flex='1 1 auto'
				css={{
					'> div > article': {
						padding: '6px 6px',
						marginRight: '10px',
						borderRadius: '4px',
						border: '1px solid var(--beak-colors-border-default)',
						background: 'var(--beak-colors-bg-surface)',
						color: 'var(--beak-colors-fg-default)',
						fontSize: '13px',
						fontWeight: 400,
					},
					'> div > article:hover, > div > article:focus': {
						outline: 'none',
						border: '1px solid var(--beak-colors-accent-pink)',
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

			<Button
				flex='0 0 auto'
				w='35px'
				h='auto'
				px='1.5'
				py='1.5'
				pt='2'
				borderRadius='sm'
				borderWidth='1px'
				borderColor='border.default'
				bg='bg.surface'
				color='accent.teal'
				fontWeight='800'
				cursor='pointer'
				_hover={{ outline: 'none', borderColor: 'accent.teal' }}
				_focus={{ outline: 'none', borderColor: 'accent.teal' }}
				onClick={() => dispatchFlightRequest()}
			>
				{flighting && (
					<Loader2
						color='var(--beak-colors-accent-teal)'
						size={13}
						style={{ animation: 'spin 1s linear infinite' }}
					/>
				)}
				{!flighting && 'GO'}
			</Button>
		</Grid>
	);
};

export default Header;
