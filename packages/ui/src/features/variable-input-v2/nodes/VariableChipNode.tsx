import { VariableManager } from '@beak/ui/features/variables';
import { getVariableSetItemName } from '@beak/ui/features/variables/values/variable-set-item';
import { useAppSelector } from '@beak/ui/store/redux';
import {
	$applyNodeReplacement,
	DecoratorNode,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from 'lexical';
import React from 'react';

export type SerializedVariableChipNode = Spread<
	{
		variableType: string;
		// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
		payload: any;
	},
	SerializedLexicalNode
>;

interface ChipBodyProps {
	variableType: string;
	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
	payload: any;
}

const ChipBody: React.FC<ChipBodyProps> = ({ variableType, payload }) => {
	const { variableSets } = useAppSelector(s => s.global.variableSets);
	const rtv = VariableManager.getVariable(variableType);

	if (!rtv) {
		return <span data-tooltip-content={`Missing extension: ${variableType}`}>{'⚠ extension missing'}</span>;
	}

	let name: string;
	if (variableType === 'variable_set_item') name = getVariableSetItemName(payload as { itemId: string }, variableSets);
	else if (rtv.getContextAwareName !== undefined) name = rtv.getContextAwareName(payload);
	else name = rtv.name;

	return <strong>{name}</strong>;
};

export class VariableChipNode extends DecoratorNode<React.ReactElement> {
	__variableType: string;
	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
	__payload: any;

	static getType(): string {
		return 'beak-variable-chip';
	}

	static clone(node: VariableChipNode): VariableChipNode {
		return new VariableChipNode(node.__variableType, node.__payload, node.__key);
	}

	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
	constructor(variableType: string, payload: any, key?: NodeKey) {
		super(key);
		this.__variableType = variableType;
		this.__payload = payload;
	}

	getVariableType(): string {
		return this.__variableType;
	}

	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
	getPayload(): any {
		return this.__payload;
	}

	// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
	setPayload(payload: any): void {
		const writable = this.getWritable();
		writable.__payload = payload;
	}

	isInline(): boolean {
		return true;
	}

	isKeyboardSelectable(): boolean {
		return true;
	}

	getTextContent(): string {
		// Used by Lexical's clipboard machinery when serialising a selection
		// to `text/plain`. Default `DecoratorNode.getTextContent()` returns
		// '', so a copy that includes the chip would otherwise drop the
		// variable from the plaintext output entirely. Returning the display
		// name keeps the chip visible to non-Beak paste targets and matches
		// the spec scenario "Copy a chip into a plain-text consumer yields
		// the variable's display name". For Beak-to-Beak round-trips, the
		// structured `application/x-lexical-editor` MIME carries the chip's
		// real payload — this fallback is only for foreign consumers.
		const rtv = VariableManager.getVariable(this.__variableType);
		return rtv?.name ?? this.__variableType;
	}

	createDOM(_config: EditorConfig): HTMLElement {
		// `span` (not `div`) because Lexical mounts inline decorators inside a
		// `<p>`, and `<div>` inside `<p>` is invalid HTML — the browser
		// auto-closes the paragraph and re-parents the chip, which breaks
		// selection across adjacent chips. The CSS uses `display: inline-block`
		// so the `.bvs-blob` visual is identical.
		const element = document.createElement('span');
		element.className = 'bvs-blob';
		element.contentEditable = 'false';
		this.applyDataAttributes(element);
		return element;
	}

	updateDOM(prevNode: VariableChipNode, dom: HTMLElement, _config: EditorConfig): boolean {
		if (prevNode.__variableType !== this.__variableType || prevNode.__payload !== this.__payload)
			this.applyDataAttributes(dom);
		return false;
	}

	private applyDataAttributes(element: HTMLElement): void {
		const rtv = VariableManager.getVariable(this.__variableType);
		element.dataset.type = this.__variableType;
		if (this.__payload != null) element.dataset.payload = JSON.stringify(this.__payload);
		else delete element.dataset.payload;

		if (!rtv) {
			element.dataset.editable = 'false';
			element.dataset.missing = 'true';
			delete element.dataset.category;
			delete element.dataset.sensitive;
			return;
		}

		const editable = 'editor' in rtv;
		element.dataset.editable = String(editable);
		const category = this.__variableType === 'variable_set_item' ? 'env' : rtv.external ? 'extension' : 'builtin';
		element.dataset.category = category;
		if (rtv.sensitive) element.dataset.sensitive = 'true';
		else delete element.dataset.sensitive;
		delete element.dataset.missing;
	}

	decorate(_editor: LexicalEditor, _config: EditorConfig): React.ReactElement {
		return (
			<React.Fragment>
				&nbsp;
				<ChipBody variableType={this.__variableType} payload={this.__payload} />
				&nbsp;
			</React.Fragment>
		);
	}

	exportJSON(): SerializedVariableChipNode {
		return {
			type: VariableChipNode.getType(),
			version: 1,
			variableType: this.__variableType,
			payload: this.__payload,
		};
	}

	static importJSON(json: SerializedVariableChipNode): VariableChipNode {
		return $createVariableChipNode(json.variableType, json.payload);
	}

	exportDOM(): DOMExportOutput {
		const element = document.createElement('span');
		element.setAttribute('data-beak-variable-chip', 'true');
		element.setAttribute('data-type', this.__variableType);
		if (this.__payload != null) element.setAttribute('data-payload', JSON.stringify(this.__payload));
		// Fallback text for plaintext consumers — humans pasting a chip into a
		// non-Beak surface will see the variable's name rather than a void blob.
		const rtv = VariableManager.getVariable(this.__variableType);
		element.textContent = rtv?.name ?? this.__variableType;
		return { element };
	}

	static importDOM(): DOMConversionMap | null {
		const convertFromDataAttributes = (el: HTMLElement): DOMConversionOutput => {
			const type = el.getAttribute('data-type') ?? 'unknown';
			const rawPayload = el.getAttribute('data-payload');
			let payload: unknown;
			try {
				payload = rawPayload != null ? JSON.parse(rawPayload) : undefined;
			} catch {
				payload = undefined;
			}
			return { node: $createVariableChipNode(type, payload) };
		};

		return {
			span: (element: HTMLElement) => {
				if (element.getAttribute('data-beak-variable-chip') !== 'true') return null;
				return { conversion: convertFromDataAttributes, priority: 1 };
			},
			// Legacy clipboard shape — divs with class "bvs-blob" coming from the old
			// VariableInput. Honouring this lets users paste old → new without losing
			// chip data while both implementations coexist.
			div: (element: HTMLElement) => {
				if (!element.classList.contains('bvs-blob')) return null;
				return { conversion: convertFromDataAttributes, priority: 1 };
			},
		};
	}
}

// biome-ignore lint/suspicious/noExplicitAny: payload schema is owned by each variable definition
// biome-ignore lint/style/useNamingConvention: lexical convention
export function $createVariableChipNode(variableType: string, payload: any): VariableChipNode {
	return $applyNodeReplacement(new VariableChipNode(variableType, payload));
}

// biome-ignore lint/style/useNamingConvention: lexical convention
export function $isVariableChipNode(node: LexicalNode | null | undefined): node is VariableChipNode {
	return node instanceof VariableChipNode;
}
