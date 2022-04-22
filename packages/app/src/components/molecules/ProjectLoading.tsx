import React from 'react';
import { faAtom } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

const ProjectLoading: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => (
	<Wrapper>
		<TextContainer>
			<LoadingTitle>
				{'Loading up your project...'}
			</LoadingTitle>
			<LoadingSubTitle>
				{'We\'ll be ready to play soon'}
			</LoadingSubTitle>
		</TextContainer>

		<Spinner>
			<FontAwesomeIcon
				icon={faAtom}
				spin
			/>
		</Spinner>
	</Wrapper>
);

const Wrapper = styled.div`
	position: absolute;
	top: 0; bottom: 0; left: 0; right: 0;
	z-index: 100;

	background: ${p => p.theme.ui.background};
`;

const TextContainer = styled.div`
	margin-top: 5vh;
	margin-left: 3vw;
`;

const LoadingTitle = styled.div`
	font-size: max(8vh, 30px);
	font-weight: 200;
`;

const LoadingSubTitle = styled.div`
	font-size: max(4vh, 25px);
	font-weight: 400;
	color: ${p => p.theme.ui.textHighlight};
`;

const Spinner = styled.div`
	position: absolute;
	bottom: calc(-45vw / 3); right: calc(-45vw / 3);
	opacity: .2;

	> svg {
		height: 45vw;
	}
`;

export default ProjectLoading;
