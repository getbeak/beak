
import React from 'react';
import styled from 'styled-components';
import { CloudLightning } from 'lucide-react';

interface ErrorViewProps {
	error: Error;
}

const ErrorView: React.FC<React.PropsWithChildren<ErrorViewProps>> = ({ error }) => (
	<Wrapper>
		<Content>
			<CloudLightning opacity={0.4} />
			<Title>{'There was an error executing this request'}</Title>
			<ErrorMessage>{error.message}</ErrorMessage>
		</Content>
	</Wrapper>
);

const Wrapper = styled.div`
	display: flex;
	text-align: center;
	padding: 20px 40px;
	height: calc(100% - 40px);

	align-items: center;
`;

const Content = styled.div`
	flex: 1;

	> svg > path {
		fill: var(--beak-colors-fg-muted);
	}
`;

const Title = styled.div`
	font-size: 23px;
	margin: 10px 0;
	font-weight: 300;
	color: var(--beak-colors-fg-default);
`;

const ErrorMessage = styled.div`
	font-size: 13px;
	color: var(--beak-colors-fg-muted);
	overflow-wrap: anywhere;
`;

export default ErrorView;
