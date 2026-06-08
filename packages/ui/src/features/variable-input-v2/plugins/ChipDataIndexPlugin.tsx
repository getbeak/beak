import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, $isTextNode, type LexicalNode } from 'lexical';
import { useEffect } from 'react';

import { $isVariableChipNode, type VariableChipNode } from '../nodes/VariableChipNode';

/**
 * The existing VariableEditor modal listens for `.bvs-blob` clicks on its
 * `editable` host and reads `data-index` to map back into a `ValueSections`
 * array index (where strings and chips alternate). Lexical doesn't track
 * that index naturally, so we replicate the `$readValueSections` walk after
 * every transaction and stamp the resulting partIndex onto each chip's DOM
 * node. That lets us mount VariableEditor unchanged.
 */
const ChipDataIndexPlugin: React.FC = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const sync = () => {
			editor.getEditorState().read(() => {
				const root = $getRoot();
				let partIndex = 0;
				let buffered = false;
				const chipPartIndexByKey = new Map<string, number>();

				const flush = () => {
					if (buffered) {
						partIndex += 1;
						buffered = false;
					}
				};

				const walk = (children: LexicalNode[]) => {
					for (const node of children) {
						if ($isVariableChipNode(node)) {
							flush();
							chipPartIndexByKey.set(node.getKey(), partIndex);
							partIndex += 1;
							continue;
						}

						if ($isTextNode(node)) {
							if (node.getTextContent().length > 0) buffered = true;
							continue;
						}

						if ($isElementNode(node)) walk(node.getChildren());
					}
				};

				walk(root.getChildren());
				flush();

				chipPartIndexByKey.forEach((idx, key) => {
					const dom = editor.getElementByKey(key);
					if (dom) dom.dataset.index = String(idx);
				});
			});
		};

		sync();
		return editor.registerUpdateListener(() => sync());
	}, [editor]);

	return null;
};

export default ChipDataIndexPlugin;

// re-export for caller files that import the type
export type { VariableChipNode };
