import type { ValuePart, ValueSections } from '@beak/ui/features/variables/values';
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	$isElementNode,
	$isTextNode,
	type LexicalEditor,
	type LexicalNode,
} from 'lexical';

import { $createVariableChipNode, $isVariableChipNode } from '../nodes/VariableChipNode';

// Lexical-convention `$`-prefixed functions must run inside an `editor.update`
// or `editor.read` context; the prefix is the framework's signal for that, not
// a naming-style choice.
// biome-ignore lint/style/useNamingConvention: lexical convention
export function $populateFromValueSections(parts: ValueSections): void {
	const root = $getRoot();
	root.clear();

	const paragraph = $createParagraphNode();

	for (const part of parts) {
		if (typeof part === 'string') {
			if (part.length > 0) paragraph.append($createTextNode(part));
		} else if (part && typeof part === 'object') {
			paragraph.append($createVariableChipNode(part.type, part.payload));
		}
	}

	root.append(paragraph);
}

// biome-ignore lint/style/useNamingConvention: lexical convention
export function $readValueSections(): ValueSections {
	const root = $getRoot();
	const parts: ValueSections = [];
	let bufferedText = '';

	const flush = () => {
		if (bufferedText.length > 0) {
			parts.push(bufferedText);
			bufferedText = '';
		}
	};

	const walk = (children: LexicalNode[]) => {
		for (const node of children) {
			if ($isVariableChipNode(node)) {
				flush();
				const part: ValuePart = { type: node.getVariableType(), payload: node.getPayload() };
				parts.push(part);
				continue;
			}

			if ($isTextNode(node)) {
				const text = node.getTextContent();
				if (text) bufferedText += text;
				continue;
			}

			if ($isElementNode(node)) walk(node.getChildren());
		}
	};

	walk(root.getChildren());
	flush();

	// Match the legacy sanitiser shape: collapse a fully empty section to []
	if (parts.length === 1 && parts[0] === '') return [];

	return parts;
}

export function readValueSectionsFromEditor(editor: LexicalEditor): ValueSections {
	let result: ValueSections = [];
	editor.getEditorState().read(() => {
		result = $readValueSections();
	});
	return result;
}
