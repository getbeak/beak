import React from 'react';
import styled from 'styled-components';

interface ScrollTargetProps {
	target: string;
}

const ScrollTarget: React.FunctionComponent<React.PropsWithChildren<ScrollTargetProps>> = ({ target }) => (
	<Wrapper>
		<Target id={target} />
	</Wrapper>
);

const Wrapper = styled.div`
	position: relative;
`;

const Target = styled.div`
	position: absolute;
	top: -150px;
`;

export default ScrollTarget;
