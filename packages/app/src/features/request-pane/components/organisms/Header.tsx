import { parseValueParts } from '@beak/app/features/realtime-values/parser';
import VariableInput from '@beak/app/features/variable-input/components/VariableInput';
import { requestPreferenceSetMainTab } from '@beak/app/store/preferences/actions';
import { RequestNode, ValueParts } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import URL from 'url-parse';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';

export interface HeaderProps {
	node: RequestNode;
}

const Header: React.FunctionComponent<HeaderProps> = props => {
	const dispatch = useDispatch();
	const { variableGroups } = useSelector(s => s.global.variableGroups);
	const selectedGroups = useSelector(s => s.global.preferences.editor.selectedVariableGroups);
	const { node } = props;
	const verb = node.info.verb;
	const [forceResetNonce, setForceResetNonce] = useState<undefined | number>();

	function dispatchFlightRequest() {
		dispatch(requestFlight());
	}

	function urlQueryStringDetected() {
		dispatch(requestPreferenceSetMainTab({ id: node.id, tab: 'url_query' }));
	}

	async function handleUrlChange(parts: ValueParts) {
		const context = { selectedGroups, variableGroups };
		const value = await parseValueParts(context, parts);
		let sanitisedParts = [...parts];
		const parsed = new URL(value, true);

		// If it can be parsed, and there is a query string, strip it out and move to correct part of request info
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
			// We want to remove the query string from the URL, ofc
			const searchIndex = parts.findIndex(p => typeof p === 'string' && p.includes('?'));
			const searchPartIndex = (parts[searchIndex] as string).indexOf('?');

			sanitisedParts = parts.slice(0, searchIndex);
			sanitisedParts.push((parts[searchIndex] as string).slice(0, searchPartIndex));

			// Another event-loop hack
			window.setTimeout(() => setForceResetNonce(Date.now()), 0);

			// Move focus to query string editor
			dispatch(requestPreferenceSetMainTab({ id: node.id, tab: 'url_query' }));
		}

		dispatch(requestUriUpdated({
			requestId: node.id,
			url: sanitisedParts,
		}));
	}

	return (
		<Container>
			<VerbContainer>
				<VerbPickerRenderer>
					<option value={verb}>{verb}</option>
				</VerbPickerRenderer>
				<VerbPickerHidden
					value={verb}
					onChange={e => {
						dispatch(requestUriUpdated({
							requestId: node.id,
							verb: e.currentTarget.value,
						}));
					}}
				>
					<option value={'get'}>{'GET'}</option>
					<option value={'post'}>{'POST'}</option>
					<option value={'patch'}>{'PATCH'}</option>
					<option value={'put'}>{'PUT'}</option>
					<option value={'delete'}>{'DELETE'}</option>
					<option value={'head'}>{'HEAD'}</option>
					<option value={'options'}>{'OPTIONS'}</option>
					<option disabled>{'____________'}</option>
					<option value={'custom'} disabled>{'Custom'}</option>
				</VerbPickerHidden>
			</VerbContainer>

			<OmniBar>
				<VariableInput
					parts={node.info.url}
					placeholder={window.location.host}
					// forceResetHack={forceResetNonce}
					onChange={e => handleUrlChange(e)}
					onUrlQueryStringDetection={urlQueryStringDetected}
				/>
			</OmniBar>

			<DispatchButton onClick={() => dispatchFlightRequest()}>
				{'GO'}
			</DispatchButton>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;

	margin: 25px 0;
	padding: 0 10px;
	font-size: 13px;
	max-width: calc(100% - 20px);
`;

const VerbPickerRenderer = styled.select`
	-webkit-appearance: none;
	-moz-appearance: none;
	text-indent: 1px;
	text-overflow: '';

	padding: 6px 6px;
	padding-top: 7px;
	margin-right: 10px;
	border-radius: 4px;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	background: ${props => props.theme.ui.surface};
	color: ${props => props.theme.ui.primaryFill};
	text-transform: uppercase;
	font-weight: 800;

	&:hover, &:focus {
		outline: none;
		border: 1px solid ${props => props.theme.ui.primaryFill};
	}
`;

const VerbPickerHidden = styled(VerbPickerRenderer)`
	position: absolute;
	left: 0;
	opacity: 0.0000001; /* lol */
`;

const VerbContainer = styled.div`
	position: relative;
	flex: 0 0 auto;

	&:hover > ${VerbPickerRenderer} {
		border: 1px solid ${props => props.theme.ui.primaryFill};
	}
`;

const OmniBar = styled.div`
	flex: 1 1 auto;

	> div > article {
		padding: 6px 6px;
		margin-right: 10px;
		border-radius: 4px;
		border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
		background: ${props => props.theme.ui.surface};
		color: ${props => props.theme.ui.textOnSurfaceBackground};
		font-size: 13px;
		font-weight: 400;

		&:hover, &:focus {
			outline: none;
			border: 1px solid ${props => props.theme.ui.primaryFill};
		}
	}
`;

const DispatchButton = styled.button`
	flex: 0 0 auto;
	padding: 6px 6px;
	padding-top: 7px;
	border-radius: 4px;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	background: ${props => props.theme.ui.surface};

	color: ${props => props.theme.ui.goAction};
	font-weight: 800;

	&:hover, &:focus {
		outline: none;
		border: 1px solid ${props => props.theme.ui.goAction};
	}

	cursor: pointer;
`;

export default Header;
