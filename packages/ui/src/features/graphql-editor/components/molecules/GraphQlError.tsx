import React from 'react';
import { ipcWindowService } from '@beak/ui/lib/ipc';
import { renderPlainTextDefinition } from '@beak/ui/utils/keyboard-rendering';
import { faCloudBolt, faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

interface GraphQlErrorProps {
	error: Error;
}

const GraphQlError: React.FC<GraphQlErrorProps> = ({ error }) => (
	<Wrapper>
		<FontAwesomeIcon
			icon={faCloudBolt}
			opacity={0.4}
			size={'4x'}
		/>
		<Title>{'Unable to fetch GraphQL schema'}</Title>
		<ErrorMessage>{'Error message: '}{error.message}</ErrorMessage>
		<Separator />
		<Body>
			{'You can try the troubleshooting points below, but if that fails to '}
			{'resolve the issue, you can view more details in the developer tools '}
			{'network tab.'}
		</Body>
		<UnstyledList>
			<ListItem>
				<FontAwesomeIcon
					icon={faLightbulb}
					opacity={0.6}
					size={'1x'}
				/>
				{' Check the URL is correct'}
			</ListItem>
			<ListItem>
				<FontAwesomeIcon
					icon={faLightbulb}
					opacity={0.6}
					size={'1x'}
				/>
				{' Check that any security headers are provided'}
			</ListItem>
			<ListItem>
				<FontAwesomeIcon
					icon={faLightbulb}
					opacity={0.6}
					size={'1x'}
				/>
				{' Check the HTTP method/verb is correct'}
			</ListItem>
			<ListItem>
				<FontAwesomeIcon
					icon={faLightbulb}
					opacity={0.6}
					size={'1x'}
				/>
				{` Toggle developer tools from the command search bar ${renderPlainTextDefinition('omni-bar.launch.commands')}`}
			</ListItem>
			<ListItem>
				<FontAwesomeIcon
					icon={faLightbulb}
					opacity={0.6}
					size={'1x'}
				/>
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
		fill: ${p => p.theme.ui.textMinor};
	}
`;

const Title = styled.div`
	font-size: 18px;
	margin: 10px 0;
	font-weight: 300;
	color: ${p => p.theme.ui.textOnSurfaceBackground};
`;

const ErrorMessage = styled.div`
	font-size: 13px;
	color: ${p => p.theme.ui.textMinor};
	overflow-wrap: anywhere;
`;

const Separator = styled.div`
	width: 250px;
	height: 1px;
	margin: 20px 0;
	background-color: ${p => p.theme.ui.backgroundBorderSeparator};
`;

const Body = styled.div`
	font-size: 13px;
	color: ${p => p.theme.ui.textMinor};
`;

const UnstyledList = styled.ul`
	list-style: none;
`;

const ListItem = styled.li`
	font-size: 12px;
	margin: 6px;
	color: ${p => p.theme.ui.textMinor};
`;

const DevToolsToggle = styled.a`
	color: ${p => p.theme.ui.secondaryAction};
`;

export default GraphQlError;
