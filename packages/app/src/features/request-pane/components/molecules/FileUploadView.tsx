import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ipcFsService } from '@beak/app/lib/ipc';
import { requestBodyFileChanged } from '@beak/app/store/project/actions';
import { PreviewReferencedFileRes } from '@beak/common/ipc/fs';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ValidRequestNode } from '@getbeak/types/nodes';
import mime from 'mime-types';
import { RequestBodyFile } from 'packages/types/request';
import prettyBytes from 'pretty-bytes';
import styled from 'styled-components';

export interface FileUploadViewProps {
	node: ValidRequestNode;
}

const FileUploadView: React.FC<FileUploadViewProps> = props => {
	const { node } = props;
	const dispatch = useDispatch();
	const body = node.info.body as RequestBodyFile;
	const [preview, setPreview] = useState<PreviewReferencedFileRes>();

	useEffect(() => {
		openPreview(body.payload.fileReferenceId);
	}, [body.payload.fileReferenceId]);

	async function clearFile(event: React.MouseEvent) {
		event.stopPropagation();

		setPreview(void 0);
		dispatch(requestBodyFileChanged({
			requestId: node.id,
			fileReferenceId: void 0,
			contentType: void 0,
		}));
	}

	async function openPreview(fileReferenceId: string | undefined) {
		if (!fileReferenceId)
			return;

		const preview = await ipcFsService.previewReferencedFile(fileReferenceId);

		if (!preview) {
			setPreview(void 0);
			dispatch(requestBodyFileChanged({
				requestId: node.id,
				fileReferenceId: void 0,
				contentType: void 0,
			}));

			return;
		}

		setPreview(preview);
		dispatch(requestBodyFileChanged({
			requestId: node.id,
			fileReferenceId,
			contentType: mime.lookup(preview.fileExtension) || '',
		}));
	}

	async function openFile() {
		const response = await ipcFsService.openReferenceFile();

		if (!response)
			return;

		await openPreview(response.fileReferenceId);
	}

	return (
		<Container>
			<FileBlob onClick={openFile}>
				{!preview && 'No file selected...'}
				{preview && (
					<React.Fragment>
						<ClearFile onClick={clearFile}>
							<FontAwesomeIcon icon={faClose} />
						</ClearFile>
						<FileName>{preview.fileName}</FileName>
						<FileSize>{prettyBytes(preview.fileSize)}</FileSize>
					</React.Fragment>
				)}
			</FileBlob>
		</Container>
	);
};

const Container = styled.div`
	padding: 20px 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
`;

const FileBlob = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	gap: 3px;
	width: 200px;
	height: 110px;
	border-radius: 8px;
	border: 1px solid ${p => p.theme.ui.surfaceBorderSeparator};
	background: ${p => p.theme.ui.secondarySurface};
	color: ${p => p.theme.ui.textMinor};
	font-size: 12px;
`;

const ClearFile = styled.div`
	position: absolute;
	right: 5px;
	top: 3px;
	background: transparent;
	padding: 4px;
`;
const FileName = styled.div``;
const FileSize = styled.div``;

export default FileUploadView;
