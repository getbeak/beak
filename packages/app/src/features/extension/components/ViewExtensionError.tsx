import React from 'react';
import Dialog from '@beak/app/components/molecules/Dialog';
import { ipcExplorerService } from '@beak/app/lib/ipc';
import { createDefaultOptions } from '@beak/app/utils/monaco';
import Squawk from '@beak/common/utils/squawk';
import Editor from '@monaco-editor/react';
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

			<Editor
				height={'200px'}
				width={'100%'}
				language={'json'}
				theme={'vs-dark'}
				value={JSON.stringify(props.error, null, '\t')}
				options={{
					...createDefaultOptions(),
					lineNumbers: false,
					readOnly: true,
				}}
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
