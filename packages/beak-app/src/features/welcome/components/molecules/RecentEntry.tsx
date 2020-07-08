import React from 'react';
import styled from 'styled-components';

export interface RecentEntryProps {
	name: string;
	path: string;
	modifiedDate: string;
	type: 'local';
	onClick: () => void;
}

const RecentEntry: React.FunctionComponent<RecentEntryProps> = props => {
	return (
		<Wrapper>
			<Icon />
			<TextWrapper>
				<Name>{props.name}</Name>
				<Path>{props.path}</Path>
			</TextWrapper>
			{props.modifiedDate}
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 10px;
	display: flex;

	&:hover {
		background: ${props => props.theme.ui.secondarySurface};
	}

	&:active {
		background: ${props => props.theme.ui.background};
	}
`;

const TextWrapper = styled.div`

`;

const Name = styled.span`
	display: block;
`;

const Path = styled.span`
	display: block;
`;

const Icon = styled.div`
	width: 40px;
	height: auto;

	background-image: url('/static/images/tswift-square.jpg');
	background-position: center;
	background-repeat: no-repeat;
	background-size: contain;
`;

export default RecentEntry;
