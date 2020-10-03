import { RequestNode } from '@beak/common/src/beak-project/types';
import { constructUri } from '@beak/common/src/beak-project/url';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import * as uuid from 'uuid';

import { requestFlight } from '../../../../store/flight/actions';
import { requestUriUpdated } from '../../../../store/project/actions';

const url = window.require('url');

export interface UriPaneProps {
	node: RequestNode;
}

const UriPane: React.FunctionComponent<UriPaneProps> = props => {
	const dispatch = useDispatch();
	const [flightId, setFlightId] = useState(uuid.v4());
	const { node } = props;
	const verb = node.info.uri.verb;

	useEffect(() => {
		setFlightId(uuid.v4());
	}, [node]);

	function dispatchFlightRequest() {
		dispatch(requestFlight({
			requestId: node.id,
			flightId,
			request: node.info,
		}));
	}

	function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = e.currentTarget.value;
		const parsed = url.parse(value);

		// TODO(afr): Fully understand this

		dispatch(requestUriUpdated({
			requestId: node.id,
			protocol: parsed.protocol || '',
			hostname: parsed.hostname || '',
			path: parsed.path || '',
		}));
	}

	return (
		<Container>
			<OmniBar
				value={constructUri(node.info, { includeHash: false, includeQuery: false })}
				onChange={e => handleUrlChange(e)}
			/>
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
			</VerbPicker>
			<OkayBoomer onClick={() => dispatchFlightRequest()}>
				{'⌖'}
			</OkayBoomer>
		</Container>
	);
};

const Container = styled.div`
	position: relative;
	padding: 25px 20px;
	border-bottom: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};

	/* TODO(afr): Fix this hack */
	height: 30px;
`;

const OmniBar = styled.input`
	position: absolute;
	width: calc(100% - 85px - 40px);
	padding: 6px;
	padding-left: 45px;
	padding-right: 40px;
	border-radius: 4px;
	border: 1px solid ${props => props.theme.ui.backgroundBorderSeparator};
	background: ${props => props.theme.ui.surface};
	color: white;
	font-size: 14px;
	font-weight: 400;

	&:focus {
		outline: 2px solid ${props => props.theme.ui.primaryFill};
		outline-style: groove;
	}
`;

const VerbPicker = styled.select`
	position: absolute;
	left: 30px;

	-webkit-appearance: none;
	-moz-appearance: none;
	text-indent: 1px;
	text-overflow: '';

	width: 32px;

	background-color: transparent;
	margin-top: 8px;
	border: none;
	font-weight: 800;
	color: ${props => props.theme.ui.primaryFill};

	&:focus {
		outline: none;
	}
`;

const OkayBoomer = styled.button`
	position: absolute;
	right: 22px;

	background: transparent;
	border: none;
	color: ${props => props.theme.ui.textOnSurfaceBackground};
	margin-top: 4px;
	font-size: 13px;
	font-weight: 300;

	&:focus {
		outline: none;
	}

	cursor: pointer;
`;

export default UriPane;
