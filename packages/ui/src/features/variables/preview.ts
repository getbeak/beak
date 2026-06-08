import type { EditableVariable } from '@getbeak/extension-sdk';
import type { Context } from '@getbeak/types/values';

/**
 * Render a string preview for a variable's editor pane. Calls the
 * variable's `resolve` with `Sink: 'text'` and unwraps to a string.
 */
export async function previewValue<T extends Record<string, any>>(
	ctx: Context,
	rtv: EditableVariable<T>,
	item: any,
	state: T,
) {
	if (!rtv.editor) return 'Editor not available';

	const payload = rtv.editor.save ? await rtv.editor.save(ctx, item, state) : state;
	const resolved = await rtv.resolve({ variableContext: ctx, sink: { kind: 'text' }, depth: 0 }, payload);

	return resolved.kind === 'text' ? resolved.text : '';
}
