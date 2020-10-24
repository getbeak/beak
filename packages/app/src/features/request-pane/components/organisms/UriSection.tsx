import {  convertRequestToUrl } from '@beak/common/helpers/uri';
import { RequestNode } from '@beak/common/types/beak-project';
// @ts-ignore
import ksuid from '@cuvva/ksuid';
import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import urlParse from 'url-parse';

import { requestFlight } from '../../../../store/flight/actions';
import { requestQueryAdded, requestUriUpdated } from '../../../../store/project/actions';


export interface UriSectionProps {
	node: RequestNode;
}

const UriSection: React.FunctionComponent<UriSectionProps> = props => {
	const dispatch = useDispatch();
	const { node } = props;
	const verb = node.info.verb;

	function dispatchFlightRequest() {
		dispatch(requestFlight({
			requestId: node.id,
			flightId: ksuid.generate('flight').toString(),
			request: node.info,
		}));
	}

	function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.currentTarget.value;
		const parsed = urlParse(value, {}, false);

		const safeFragment = (function safeFraggy() {
			if (!parsed.hash)
				return '';

			if (parsed.hash === '#')
				return '#';

			return parsed.hash.substr(1);
		}());

		if (parsed.query) {
			const params = new URLSearchParams(parsed.query as Record<string, string>);

			params.forEach((value, name) => {
				dispatch(requestQueryAdded({
					requestId: node.id,
					name,
					value,
				}));
			});
		}

		dispatch(requestUriUpdated({
			requestId: node.id,
			protocol: parsed.protocol,
			hostname: parsed.hostname,
			pathname: parsed.pathname,
			port: parsed.port,
			fragment: safeFragment,
		}));
	}

	return (
		<Container>
			{/* TODO(afr): Stop using native component, build custom to handle auto resize */}
			<VerbPicker
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

			<OmniBar
				value={convertRequestToUrl(node.info, { useFallback: false, includeQuery: false }).toString()}
				onChange={e => handleUrlChange(e)}
			/>

			<DispatchButton onClick={() => dispatchFlightRequest()}>
				{'GO'}
			</DispatchButton>
		</Container>
	);
};

const Container = styled.div`
	padding: 25px 20px;
	display: flex;

	/* TODO(afr): Fix this hack */
	height: 30px !important;
`;

const VerbPicker = styled.select`
	-webkit-appearance: none;
	-moz-appearance: none;
	text-indent: 1px;
	text-overflow: '';

	width: 42px;
	padding: 4px 6px;
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

const OmniBar = styled.input`
	flex-grow: 1;
	padding: 4px 6px;
	margin-right: 10px;
	border-radius: 4px;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	background: ${props => props.theme.ui.surface};
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	font-size: 14px;
	font-weight: 400;

	&:hover, &:focus {
		outline: none;
		border: 1px solid ${props => props.theme.ui.primaryFill};
	}
`;

const DispatchButton = styled.button`
	padding: 4px 6px;
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

export default UriSection;
