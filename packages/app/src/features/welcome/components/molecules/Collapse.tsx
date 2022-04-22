import React, { useState } from 'react';
import styled, { css } from 'styled-components';

export interface CollapseProps {
	startOpen: boolean;
	title: string;
}

const Collapse: React.FunctionComponent<React.PropsWithChildren<CollapseProps>> = props => {
	const { children, startOpen, title } = props;
	const [show, setShow] = useState(startOpen);

	return (
		<Wrapper>
			<ActionBar
				onClick={() => {
					setShow(!show);
				}}
			>
				<ArrowWrapper>
					<Arrow direction={show ? 'down' : 'right'} />
				</ArrowWrapper>
				<Title>{title}</Title>
			</ActionBar>
			{show && (
				<ChildrenWrapper>
					{children}
				</ChildrenWrapper>
			)}
		</Wrapper>
	);
};

const Wrapper = styled.div`

`;

const ActionBar = styled.div`
	cursor: pointer;
`;

const ArrowWrapper = styled.div`
	display: inline-flex;
	justify-content: center;

	width: 20px;
`;

const Arrow = styled.div<{ direction: 'right' | 'down' }>`
	display: inline-block;
	width: 0;
	height: 0;

	border-top: 5px solid transparent;
	border-bottom: 5px solid transparent;
	border-left: 5px solid ${props => props.theme.ui.blankFill};

	${({ direction }) => direction === 'down' ? css`transform: rotate(90deg);` : ''};
`;

const Title = styled.span`
	font-size: 14px;
	font-weight: 500;
`;

const ChildrenWrapper = styled.div`
	margin-left: 5px;
	margin-right: 5px;
`;

export default Collapse;
