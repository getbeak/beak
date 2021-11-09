import { faDiagramProject } from '@fortawesome/free-solid-svg-icons/faDiagramProject';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
			<Icon>
				<FontAwesomeIcon
					size={'1x'}
					icon={faDiagramProject}
				/>
			</Icon>
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
	text-align: center;
	line-height: 35px;
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
`;

const ModifiedDate = styled.div`
	font-size: 12px;
	color: ${props => props.theme.ui.textMinor};
`;

export default RecentEntry;
