import type { ValueSections } from '@beak/ui/features/variables/values';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef } from 'react';

import { $populateFromValueSections, readValueSectionsFromEditor } from '../utils/value-sections-conversion';

interface ExternalValueSyncPluginProps {
	parts: ValueSections;
	lastUpstreamReportRef: React.MutableRefObject<number>;
}

/**
 * Mirror of the legacy "Update unmanaged state if the change comes in more
 * than 100ms after our last known write" logic. Stops upstream parts that
 * we just emitted from snapping the editor backwards mid-keystroke.
 */
const ExternalValueSyncPlugin: React.FC<ExternalValueSyncPluginProps> = ({ parts, lastUpstreamReportRef }) => {
	const [editor] = useLexicalComposerContext();
	const lastIncoming = useRef<string>('');

	useEffect(() => {
		const incoming = JSON.stringify(parts);
		if (incoming === lastIncoming.current) return;
		lastIncoming.current = incoming;

		if (lastUpstreamReportRef.current + 100 > Date.now()) return;

		const current = JSON.stringify(readValueSectionsFromEditor(editor));
		if (current === incoming) return;

		editor.update(() => {
			$populateFromValueSections(parts);
		});
	}, [parts, editor, lastUpstreamReportRef]);

	return null;
};

export default ExternalValueSyncPlugin;
