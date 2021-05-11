import { format, parseISO } from 'date-fns';
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
	const date = parseISO(props.modifiedDate);

	return (
		<Wrapper onClick={() => props.onClick()}>
			<Icon />
			<TextWrapper>
				<Name>{props.name}</Name>
				<Path>{props.path}</Path>
			</TextWrapper>
			<ModifiedDate>{format(date, 'MM/dd/yyyy')}</ModifiedDate>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 10px;
	display: flex;
	transition: transform .1s ease;

	&:hover {
		background: ${props => props.theme.ui.secondarySurface};
		cursor: pointer;
	}

	&:active {
		background: ${props => props.theme.ui.background};
		transform: scale(0.99);
	}
`;

const Icon = styled.div`
	width: 40px;
	height: auto;

	background-image: url('./images/tswift-square.jpg');
	background-position: center;
	background-repeat: no-repeat;
	background-size: contain;
`;

const TextWrapper = styled.div`
	flex-grow: 2;
	margin-left: 10px;
`;

const Name = styled.span`
	display: block;
	font-size: 16px;
	font-weight: 500;
`;

const Path = styled.span`
	display: block;
	font-size: 12px;
	color: ${props => props.theme.ui.textMinor};
	
	/* white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis; */
`;

const ModifiedDate = styled.div`
	font-size: 12px;
	color: ${props => props.theme.ui.textMinor};
`;

export default RecentEntry;
