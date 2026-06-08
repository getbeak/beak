import type { AttachedFileRtv } from '@beak/ui/features/variables/values';
import type { Variable } from '@getbeak/extension-sdk';

/**
 * Built-in RTV that produces binary content from an asset. Payload carries
 * an asset ref pointing into the project's `_assets/` store; resolution
 * routes per sink:
 *   - binary / stream → `{ kind: 'asset', ref }` (no bytes in renderer)
 *   - text            → a `[file <filename> sha:<prefix>]` placeholder
 *
 * The placeholder is intentional. UTF-8-decoding an image's bytes for a
 * text sink (a header value, a JSON property) would emit garbage; we'd
 * rather show the user a clear "binary in text context" hint than smuggle
 * mojibake onto the wire.
 *
 * Editing UX (file picker) lives in the multipart editor for now;
 * exposing this RTV in the general variable picker can come later.
 */
const definition: Variable<AttachedFileRtv> = {
	type: 'attached_file',
	name: 'Attached file',
	description: 'A file from the project asset store, attached via the file picker',
	sensitive: false,
	external: false,

	createDefaultPayload: async () => ({ assetRef: undefined, filename: undefined }),

	resolve: async (rctx, payload) => {
		if (!payload.assetRef) {
			return { kind: 'text', text: '' };
		}

		if (rctx.sink.kind === 'binary' || rctx.sink.kind === 'stream') {
			return { kind: 'asset', ref: payload.assetRef };
		}

		const label = payload.filename ?? `sha:${payload.assetRef.sha256.slice(0, 10)}`;
		return { kind: 'text', text: `[file ${label}]` };
	},

	getContextAwareName: payload => (payload.filename ? `File (${payload.filename})` : 'File'),

	attributes: {},
};

export default definition;
