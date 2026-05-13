/**
 * Prompt the user for an OpenAPI spec file using the platform file picker.
 * Returns `null` if the user cancelled. The file content is read as text
 * so the JSON/YAML sniffer in `parse-spec-source` can run on it.
 *
 * Web and electron renderer both support the browser File API, so we use it
 * uniformly and skip plumbing a `dialog:show_open_file` IPC channel for now.
 * If we later need OS-native sandboxing or large-file streaming, an IPC
 * fallback can drop in behind this same signature.
 */
export interface PickedSpec {
	filename: string;
	source: string;
}

export function pickSpecFile(): Promise<PickedSpec | null> {
	if (typeof document === 'undefined') {
		return Promise.resolve(null);
	}
	return new Promise(resolve => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json,application/json,.yaml,.yml';
		// Hidden — the picker UI is the OS's, not ours.
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
				.text()
				.then(source => {
					settled = true;
					cleanup();
					resolve({ filename: file.name, source });
				})
				.catch(() => {
					settled = true;
					cleanup();
					resolve(null);
				});
		});

		// If the picker is dismissed without choosing, the change event never
		// fires. Detect cancel via the `cancel` event (Chrome 109+) and a
		// focus-window fallback for older browsers.
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
