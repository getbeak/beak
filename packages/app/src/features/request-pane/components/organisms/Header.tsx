import { parseValueParts } from '@beak/app/features/realtime-values/parser';
import VariableInput from '@beak/app/features/variable-input/components/molecules/VariableInput';
import { RequestNode, ValueParts } from '@beak/common/types/beak-project';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';

export interface HeaderProps {
	node: RequestNode;
}

const Header: React.FunctionComponent<HeaderProps> = props => {
	const dispatch = useDispatch();
	const [verbPickerWidth, setVerbPickerWidth] = useState<string>('auto');
	const { selectedGroups, variableGroups } = useSelector(s => s.global.variableGroups);
	const projectPath = useSelector(s => s.global.project.projectPath)!;
	const { node } = props;
	const verb = node.info.verb;
	const secretSelect = useRef<HTMLSpanElement>(null);
	const [forceResetNonce, setForceResetNonce] = useState<undefined | number>();

	useEffect(() => {
		if (secretSelect.current)
			setVerbPickerWidth(`${secretSelect.current.offsetWidth}px`);
	}, [secretSelect.current, secretSelect.current?.offsetWidth, setVerbPickerWidth]);

	function dispatchFlightRequest() {
		dispatch(requestFlight());
	}

	async function handleUrlChange(parts: ValueParts) {
		const context = { projectPath, selectedGroups, variableGroups };
		const value = await parseValueParts(context, parts);
		let sanitisedParts = [...parts];
		let parsed: URL | undefined;

		try {
			parsed = new URL(value);
		} catch { /* Doesn't matter if it fails to parse, just carry on */ }

		// If it can be parsed, and there is a query string, strip it out and move to correct part of request info
		if (parsed?.search) {
			parsed.searchParams.forEach((value, name) => {
				dispatch(requestQueryAdded({
					requestId: node.id,
					name,
					value: [value],
				}));
			});

			// We want to remove the query string from the URL, ofc
			const searchIndex = parts.findIndex(p => typeof p === 'string' && p.includes('?'));
			const searchPartIndex = (parts[searchIndex] as string).indexOf('?');

			sanitisedParts = parts.slice(0, searchIndex);
			sanitisedParts.push((parts[searchIndex] as string).slice(0, searchPartIndex));

			setForceResetNonce(Date.now());

			// Move focus to query string editor
			// (change tab, move focus too maybe?)
			// TODO(afr): Write this code
		}

		dispatch(requestUriUpdated({
			requestId: node.id,
			url: sanitisedParts,
		}));
	}

	return (
		<Container>
			<VerbContainer>
				{/* NOTE(afr): Still not super happy with this hack */}
				<VerbPickerSizer ref={secretSelect}>{verb}</VerbPickerSizer>
				<VerbPicker
					style={{ width: verbPickerWidth }}
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
				</VerbPicker>
			</VerbContainer>

			<OmniBar>
				<VariableInput
					parts={node.info.url}
					forceResetHack={forceResetNonce}
					onChange={e => handleUrlChange(e)}
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

const VerbContainer = styled.div`
	flex: 0 0 auto;
`;

const VerbPicker = styled.select`
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

	font-weight: 800;

	&:hover, &:focus {
		outline: none;
		border: 1px solid ${props => props.theme.ui.primaryFill};
	}
`;

const VerbPickerSizer = styled.span`
	position: absolute;
	top: 100000;
	left: 1000000;
	visibility: hidden;
	font-size: 13.3333px;
	font-weight: 800;
	padding: 4px 7px;
	text-transform: uppercase;
	border: 1px;
	text-indent: 1px;

	&:last-child {
		margin: 0 20px;
	}
`;

const OmniBar = styled.div`
	flex: 1 1 auto;

	> article {
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
