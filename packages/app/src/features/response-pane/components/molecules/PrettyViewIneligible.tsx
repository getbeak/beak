import React from 'react';
import { faPersonCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import { NotEligible } from '../../hooks/use-flight-body-info';

const reasons: Record<NotEligible, Reason> = {
	request_invalid_body: {
		title: 'The request body brok',
		description: 'The internal request body is in an invalid format. Report this as a bug.',
	},
	request_no_body: {
		title: 'This request had no body (to love)',
		description: 'The request had no body, so you don\'t need to be looking here',
	},
	response_no_body: {
		title: 'This response had no body',
		description: 'The response had no body, so you don\'t need to be looking here',
	},
};

interface Reason {
	title: string;
	description: string;
}

interface PrettyViewIneligibleProps {
	eligibility: NotEligible;
}

const PrettyViewIneligible: React.FunctionComponent<React.PropsWithChildren<PrettyViewIneligibleProps>> = ({ eligibility }) => {
	const reason = reasons[eligibility];

	return (
		<Container>
			<ErrorInformation>
				<FontAwesomeIcon
					icon={faPersonCircleQuestion}
					opacity={0.4}
					size={'4x'}
				/>
				<Title>{reason.title}</Title>
				<Description>{reason.description}</Description>
			</ErrorInformation>
		</Container>
	);
};

const Container = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 0 40px;
`;

const ErrorInformation = styled.div`
	text-align: center;
`;

const Title = styled.div`
	font-size: 23px;
	margin: 10px 0;
	font-weight: 300;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;
const Description = styled.div`
	font-size: 13px;
	color: ${p => p.theme.ui.textMinor};
`;

export default PrettyViewIneligible;
