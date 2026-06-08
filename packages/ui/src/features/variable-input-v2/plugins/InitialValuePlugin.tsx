import type { ValueSections } from '@beak/ui/features/variables/values';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

import { $populateFromValueSections } from '../utils/value-sections-conversion';

interface InitialValuePluginProps {
	parts: ValueSections;
}

/**
 * Seeds the editor with the incoming ValueSections exactly once per mount.
 * External re-seeding (when the upstream `parts` prop changes while the
 * editor is mounted) is handled by ExternalValueSyncPlugin so we don't
 * blow away in-progress edits on every render.
 */
const InitialValuePlugin: React.FC<InitialValuePluginProps> = ({ parts }) => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editor.update(() => {
			$populateFromValueSections(parts);
		});
		// Intentionally one-shot — re-seeding on every `parts` change is the
		// responsibility of ExternalValueSyncPlugin, which knows about the
		// "did we just emit this upstream" debounce.
	}, [editor]);

	return null;
};

export default InitialValuePlugin;
