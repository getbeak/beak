import React from 'react';
import EditorView from '@beak/app/components/atoms/EditorView';
import Dialog from '@beak/app/components/molecules/Dialog';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import Squawk from '@beak/common/utils/squawk';
import styled from 'styled-components';

interface ViewExtensionErrorProps {
	error: Squawk;
	assumedName: string;
	filePath: string;
	onClose: () => void;
}

const ViewExtensionError: React.FC<React.PropsWithChildren<ViewExtensionErrorProps>> = props => (
	<Dialog onClose={() => props.onClose()}>
		<Container>
			<Title>{'Unable to load extension'}</Title>
			<Description>
				{'There was an issue while trying to load one of the installed extensions.'}
			</Description>

			<List>
				<li>
					{'Assumed extension name: '}
					<b>{props.assumedName}</b>
				</li>
				<li>
					{'Extension file path: '}
					<FilePathButton onClick={() => ipcExplorerService.revealFile(props.filePath)}>
						{props.filePath}
					</FilePathButton>
				</li>
			</List>

			<EditorView
				height={'200px'}
				language={'json'}
				value={JSON.stringify(props.error, null, '\t')}
				options={{ readOnly: true, lineNumbers: false }}
			/>
		</Container>
	</Dialog>
);

const Container = styled.div`
	width: 500px;

	padding: 15px;
	font-size: 14px;
`;

const Title = styled.div`
	font-size: 24px;
	font-weight: 300;
`;
const Description = styled.p`
	font-size: 12px;
	/* margin: 5px 0; */
	color: ${p => p.theme.ui.textMinor};
`;
const List = styled.ul`
	font-size: 12px;
	/* margin: 5px 0; */
	color: ${p => p.theme.ui.textMinor};
`;
const FilePathButton = styled.button`
	background: none;
	border: none;
	border-bottom: 1px dashed ${p => p.theme.ui.primaryFill};
	display: contents;
	font-weight: 500;
	font-size: 12px;
	padding: 0;
	overflow: hidden;
	color: ${p => p.theme.ui.textHighlight};
	cursor: pointer;
	text-decoration: dashed;
`;

export default ViewExtensionError;
