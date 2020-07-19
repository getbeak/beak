import React from 'react';
import styled from 'styled-components';

import { RequestNode } from '../../../../lib/project/types';

const url = window.require('url');

export interface UriPaneProps {
	node: RequestNode;
}

const UriPane: React.FunctionComponent<UriPaneProps> = props => {
	const { node } = props;
	const verb = node.info.uri.verb;

	return (
		<Container>
			<OmniBar defaultValue={constructUri(node)} />
			<VerbPicker>
				<option selected={verbToSelected('get', verb)}>{'GET'}</option>
				<option selected={verbToSelected('post', verb)}>{'POST'}</option>
				<option selected={verbToSelected('patch', verb)}>{'PATCH'}</option>
				<option selected={verbToSelected('put', verb)}>{'PUT'}</option>
				<option selected={verbToSelected('delete', verb)}>{'DELETE'}</option>
				<option selected={verbToSelected('head', verb)}>{'HEAD'}</option>
				<option selected={verbToSelected('options', verb)}>{'OPTIONS'}</option>
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

function constructUri(node: RequestNode) {
	const {
		protocol,
		hostname,
		path: pathname,
		query,
		fragment,
	} = node.info.uri;

	const uri = url.format({
		protocol,
		hostname,
		pathname,
		query: query?.reduce((acc, val) => ({
			...acc,
			[val.name]: val.value,
		}), {}),
		hash: fragment,
	});

	return new URL(uri).toString();
}

function verbToSelected(current: string, verb: string) {
	if (current === verb)
		return true;

	return void 0;
}

export default UriPane;
