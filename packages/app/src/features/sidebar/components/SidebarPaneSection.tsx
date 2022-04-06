import React, { useState } from 'react';
import styled from 'styled-components';

interface SidebarPaneSectionProps {
	title: string;
	collapseKey: string;
}

const SidebarPaneSection: React.FunctionComponent<SidebarPaneSectionProps> = props => {
	const { title, children } = props;
	const [expanded, setExpanded] = useState(true);

	return (
		<React.Fragment>
			<SectionHeader onClick={() => setExpanded(!expanded)}>
				{title}
			</SectionHeader>
			{expanded && children}
		</React.Fragment>
	);
};

const SectionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	padding: 6px 5px;

	text-transform: uppercase;
	font-size: 11px;
	font-weight: 600;

	cursor: pointer;
`;

export default SidebarPaneSection;
