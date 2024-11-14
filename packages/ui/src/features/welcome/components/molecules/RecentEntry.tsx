import React from 'react';
import { toHexAlpha } from '@beak/design-system/utils';
import { faDiagramProject } from '@fortawesome/free-solid-svg-icons/faDiagramProject';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format, parseISO } from 'date-fns';
import styled from 'styled-components';

export interface RecentEntryProps {
	name: string;
	path: string;
	modifiedDate: string;
	type: 'local';
	onClick: () => void;
}

const RecentEntry: React.FC<React.PropsWithChildren<RecentEntryProps>> = props => {
	const date = parseISO(props.modifiedDate);
	const pathIsGoingToBeAnAsshole = props.path.startsWith('/');
	const path = pathIsGoingToBeAnAsshole ? props.path.substring(1) : props.path;

	return (
		<Wrapper
			onClick={() => props.onClick()}
			onKeyDown={event => {
				if (event.key === 'Enter')
					props.onClick();
			}}
			tabIndex={0}
		>
			<Icon>
				<FontAwesomeIcon
					size={'1x'}
					icon={faDiagramProject}
				/>
			</Icon>
			<TextWrapper>
				{/* The "&lrm;" char is a requirement of using RTL to trim the end vs start of the string */}
				<Name>{props.name}&lrm;</Name>
				<Path $asshole={pathIsGoingToBeAnAsshole}>
					{path}
				</Path>
			</TextWrapper>
			<ModifiedDate>{format(date, 'MM/dd/yyyy')}</ModifiedDate>
		</Wrapper>
	);
};

const Wrapper = styled.div`
	padding: 10px;
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr) auto;
	gap: 10px;
	transition: transform .1s ease;
	border-radius: 5px;

	&:hover {
		background: ${props => toHexAlpha(props.theme.ui.surfaceHighlight, 0.6)};
		cursor: pointer;
	}

	&:active, &:focus {
		background: ${props => toHexAlpha(props.theme.ui.surfaceHighlight, 0.8)};
		transform: scale(0.99);
		outline: 0;
	}
`;

const Icon = styled.div`
	width: 40px;
	text-align: center;
	line-height: 35px;
`;

const TextWrapper = styled.div``;

const Name = styled.span`
	display: block;
	font-size: 16px;
	font-weight: 500;

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	direction: rtl;
	text-align: left;
`;

const Path = styled.span<{ $asshole: boolean }>`
	display: block;
	font-size: 12px;
	color: ${props => props.theme.ui.textMinor};

	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	direction: rtl;
	text-align: left;

	&:after {
		display: inline-block;
		content: '${p => p.$asshole ? '/' : ''}';
	}
`;

const ModifiedDate = styled.div`
	font-size: 12px;
	color: ${props => props.theme.ui.textMinor};
`;

export default RecentEntry;
