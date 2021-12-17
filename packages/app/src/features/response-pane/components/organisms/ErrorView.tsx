import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

interface ErrorViewProps {
	error: Error;
}

const ErrorView: React.FunctionComponent<ErrorViewProps> = ({ error }) => (
	<Wrapper>
		<Content>
			<FontAwesomeIcon
				icon={faTriangleExclamation}
				opacity={0.4}
				size={'4x'}
			/>
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
		fill: ${p => p.theme.ui.textMinor};
	}
`;

const Title = styled.div`
	font-size: 25px;
	margin-top: 15px;
	color: ${p => p.theme.ui.textMinor};
	opacity: 0.6;
`;

const ErrorMessage = styled.div`
	margin-top: 15px;
	font-size: 16px;
	color: ${p => p.theme.ui.textMinor};
`;

export default ErrorView;
