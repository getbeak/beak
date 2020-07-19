import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';

export interface UriPaneProps {
	node: RequestNode;
}

const UriPane: React.FunctionComponent<UriPaneProps> = props => {
	const { node } = props;

	return (
		<Container>
			<OmniBar defaultValue={'https://httpbin.com/get'} />
			<VerbPicker>
				<option selected>{'GET'}</option>
				<option>{'POST'}</option>
				<option>{'PATCH'}</option>
				<option>{'PUT'}</option>
				<option>{'DELETE'}</option>
				<option>{'HEAD'}</option>
				<option>{'OPTIONS'}</option>
			</VerbPicker>
			<OkayBoomer>
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
	font-weight: 600;

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

	background-color: transparent;
	margin-top: 7px;
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
