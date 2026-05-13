import { ipcWindowService } from '@beak/ui/lib/ipc';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { CloudLightning, Lightbulb } from 'lucide-react';

import React from 'react';
import styled from 'styled-components';

interface GraphQlErrorProps {
	error: Error;
}

const GraphQlError: React.FC<GraphQlErrorProps> = ({ error }) => (
	<Wrapper>
		<CloudLightning opacity={0.4} />
		<Title>{'Unable to fetch GraphQL schema'}</Title>
		<ErrorMessage>
			{'Error message: '}
			{error.message}
		</ErrorMessage>
		<Separator />
		<Body>
			{'You can try the troubleshooting points below, but if that fails to '}
			{'resolve the issue, you can view more details in the developer tools '}
			{'network tab.'}
		</Body>
		<UnstyledList>
			<ListItem>
				<Lightbulb opacity={0.6} />
				{' Check the URL is correct'}
			</ListItem>
			<ListItem>
				<Lightbulb opacity={0.6} />
				{' Check that any security headers are provided'}
			</ListItem>
			<ListItem>
				<Lightbulb opacity={0.6} />
				{' Check the HTTP method/verb is correct'}
			</ListItem>
			<ListItem>
				<Lightbulb opacity={0.6} />
				{` Toggle developer tools from the command search bar ${renderPlainTextDefinition('omni-bar.launch.commands')}`}
			</ListItem>
			<ListItem>
				<Lightbulb opacity={0.6} />
				{' Toggle developer tools by clicking '}
				<DevToolsToggle
					href={'#'}
					onClick={event => {
						event.preventDefault();
						event.stopPropagation();

						ipcWindowService.toggleDeveloperTools();
					}}
				>
					{'here'}
				</DevToolsToggle>
			</ListItem>
		</UnstyledList>
	</Wrapper>
);

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	text-align: center;
	padding: 60px 40px;
	height: calc(100% - 120px);
	max-width: 600px;
	margin: 0 auto;

	align-items: center;

	svg > path {
		fill: var(--beak-colors-fg-muted);
	}
`;

const Title = styled.div`
	font-size: 18px;
	margin: 10px 0;
	font-weight: 300;
	color: var(--beak-colors-fg-default);
`;

const ErrorMessage = styled.div`
	font-size: 13px;
	color: var(--beak-colors-fg-muted);
	overflow-wrap: anywhere;
`;

const Separator = styled.div`
	width: 250px;
	height: 1px;
	margin: 20px 0;
	background-color: var(--beak-colors-border-default);
`;

const Body = styled.div`
	font-size: 13px;
	color: var(--beak-colors-fg-muted);
`;

const UnstyledList = styled.ul`
	list-style: none;
`;

const ListItem = styled.li`
	font-size: 12px;
	margin: 6px;
	color: var(--beak-colors-fg-muted);
`;

const DevToolsToggle = styled.a`
	color: var(--beak-colors-accent-pink);
`;

export default GraphQlError;
