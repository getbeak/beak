import type { PreviewReferencedFileRes } from '@beak/common/ipc/fs';
import { pickAndAttachAsset } from '@beak/ui/features/asset-attachment/pick-and-attach';
import { ipcFsService } from '@beak/ui/lib/ipc';
import { requestBodyAssetChanged, requestBodyFileChanged } from '@beak/ui/store/project/actions';
import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ValidRequestNode } from '@getbeak/types/nodes';
import type { RequestBodyFile } from '@getbeak/types/request';
import mime from 'mime-types';
import prettyBytes from 'pretty-bytes';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
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
		dispatch(
			requestBodyFileChanged({
				requestId: node.id,
				fileReferenceId: void 0,
				contentType: void 0,
			}),
		);
	}

	async function openPreview(fileReferenceId: string | undefined) {
		if (!fileReferenceId) return;

		const preview = await ipcFsService.previewReferencedFile(fileReferenceId);

		if (!preview) {
			setPreview(void 0);
			dispatch(
				requestBodyFileChanged({
					requestId: node.id,
					fileReferenceId: void 0,
					contentType: void 0,
				}),
			);

			return;
		}

		setPreview(preview);
		dispatch(
			requestBodyFileChanged({
				requestId: node.id,
				fileReferenceId,
				contentType: mime.lookup(preview.fileExtension) || '',
			}),
		);
	}

	async function openFile() {
		const response = await ipcFsService.openReferenceFile();

		if (!response) return;

		await openPreview(response.fileReferenceId);
	}

	const assetRef = body.payload.assetRef;

	async function attachAsAsset(event: React.MouseEvent) {
		event.stopPropagation();
		const outcome = await pickAndAttachAsset();
		if (!outcome || !outcome.ok) return;
		dispatch(
			requestBodyAssetChanged({
				requestId: node.id,
				assetRef: outcome.ref,
			}),
		);
	}

	function clearAssetRef(event: React.MouseEvent) {
		event.stopPropagation();
		dispatch(requestBodyAssetChanged({ requestId: node.id, assetRef: void 0 }));
	}

	return (
		<Container>
			<FileBlob onClick={openFile}>
				{!preview && !assetRef && 'No file selected...'}
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
			{assetRef && (
				<AssetBlob>
					<ClearFile onClick={clearAssetRef}>
						<FontAwesomeIcon icon={faClose} />
					</ClearFile>
					<FileName>{`sha256:${assetRef.sha256.slice(0, 8)}…${assetRef.sha256.slice(-4)}`}</FileName>
					<FileSize>{prettyBytes(assetRef.size)}</FileSize>
				</AssetBlob>
			)}
			<AttachAssetButton type='button' onClick={attachAsAsset}>
				{assetRef ? 'Replace asset…' : 'Attach as asset…'}
			</AttachAssetButton>
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
	border: 1px solid var(--beak-colors-border-subtle);
	background: var(--beak-colors-bg-surface-emphasized);
	color: var(--beak-colors-fg-muted);
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

const AssetBlob = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3px;
	width: 200px;
	padding: 10px;
	border-radius: 8px;
	border: 1px dashed var(--beak-colors-border-subtle);
	background: var(--beak-colors-bg-surface-emphasized);
	color: var(--beak-colors-fg-muted);
	font-size: 11px;
	font-family: monospace;
`;

const AttachAssetButton = styled.button`
	background: transparent;
	border: 1px solid var(--beak-colors-border-subtle);
	color: var(--beak-colors-fg-default);
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 12px;
	cursor: pointer;

	&:hover {
		background: var(--beak-colors-bg-surface-emphasized);
	}
`;

export default FileUploadView;
