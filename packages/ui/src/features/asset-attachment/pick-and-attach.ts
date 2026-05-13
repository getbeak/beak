import { attachFile, type AttachFileOutcome } from './attach-file';

/**
 * Open the platform file picker, read the chosen file as bytes, and persist
 * it via the asset IPC. Returns the {@link AttachFileOutcome} so the
 * caller can update the request body / display a preview.
 *
 * `null` means the user cancelled the picker.
 */
export async function pickAndAttachAsset(accept?: string): Promise<AttachFileOutcome | null> {
	const picked = await pickFile(accept);
	if (!picked) return null;
	return attachFile({ file: picked });
}

interface PickedFile {
	name: string;
	type: string;
	bytes: Uint8Array;
}

function pickFile(accept?: string): Promise<PickedFile | null> {
	if (typeof document === 'undefined') return Promise.resolve(null);
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		if (accept) input.accept = accept;
		input.style.display = 'none';
		document.body.appendChild(input);

		let settled = false;
		const cleanup = () => {
			if (input.parentNode) input.parentNode.removeChild(input);
		};

		input.addEventListener('change', () => {
			const file = input.files?.[0];
			if (!file) {
				if (!settled) {
					settled = true;
					cleanup();
					resolve(null);
				}
				return;
			}
			file
				.arrayBuffer()
				.then(buffer => {
					settled = true;
					cleanup();
					resolve({
						name: file.name,
						type: file.type,
						bytes: new Uint8Array(buffer),
					});
				})
				.catch(() => {
					settled = true;
					cleanup();
					resolve(null);
				});
		});

		input.addEventListener('cancel', () => {
			if (!settled) {
				settled = true;
				cleanup();
				resolve(null);
			}
		});

		input.click();
	});
}
