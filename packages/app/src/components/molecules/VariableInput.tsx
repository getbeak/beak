import { ValueParts, ValuePartVariableGroupItem } from '@beak/common/dist/types/beak-project';
import React, { useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';

import VariableSelector from './VariableSelector';

const querySelectorId = 'booyakasha';

export interface VariableInputProps {
	disabled?: boolean;
	parts: ValueParts;
	onChange: (parts: ValueParts) => void;
}

const VariableInput: React.FunctionComponent<VariableInputProps> = ({ disabled, parts, onChange }) => {
	const [query, setQuery] = useState('');
	const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(null);
	const ref = useRef<HTMLDivElement>(null);
	const [partIndex, setPartIndex] = useState<number>();
	const [queryOffset, setQueryOffset] = useState<number>();

	function closeSelector() {
		setSelectorPosition(null);
		setQuery('');
		setQueryOffset(void 0);
		setPartIndex(void 0);
	}

	function insertVariable(_variableGroupName: string, itemId: string) {
		if (selectorPosition === null || partIndex === void 0 || queryOffset === void 0)
			return;

		const lastPart = partIndex + 1 === parts.length;
		const newPart: ValuePartVariableGroupItem = {
			type: 'variable_group_item',
			payload: { itemId },
		};

		closeSelector();

		if (lastPart) {
			const newParts: ValueParts = [...parts, newPart];

			newParts[partIndex] = (parts[partIndex] as string).substring(0, queryOffset - 1);

			onChange(newParts);

			return;
		}

		const newParts: ValueParts = [...parts];

		newParts.splice(partIndex + 1, 0, newPart);
		newParts[partIndex] = (parts[partIndex] as string).substring(0, queryOffset - 1);

		onChange(newParts);
	}

	function change(event: React.FormEvent<HTMLDivElement>) {
		event.stopPropagation();
		event.preventDefault();

		// https://rawgit.com/w3c/input-events/v1/index.html#overview
		const delta = (event.nativeEvent as InputEvent).data as string | null;
		const inputType = (event.nativeEvent as InputEvent).inputType as string;

		const newParts = Array.from(ref.current!.childNodes)
			.map(n => {
				if (n.nodeName === '#text' || n.nodeName === 'SPAN')
					return n.textContent || '';

				if (n.nodeName !== 'DIV')
					return null;

				const elem = n as HTMLElement;
				const type = elem.dataset.type;

				if (type !== 'variable_group_item')
					return null;

				const itemId = elem.dataset.payloadItemId;

				return {
					type,
					payload: {
						itemId,
					},
				} as ValuePartVariableGroupItem;
			})
			.filter(f => f !== null) as ValueParts;

		onChange(newParts);

		const sel = window.getSelection()!;
		const curRange = sel.getRangeAt(0);
		const { startContainer, startOffset, endContainer, endOffset } = curRange;
		const range = document.createRange();
		const caretColorStore = ref.current!.style.caretColor;

		ref.current!.style.caretColor = 'transparent';

		window.setTimeout(() => {
			const properStart = getProperNode(ref.current!, startContainer);
			const properEnd = getProperNode(ref.current!, endContainer);

			// If there is nothing in the input box anymore
			if (properStart === null) {
				range.setStart(ref.current as Node, 0);
			} else {
				range.setStart(properStart, startOffset);
				range.setEnd(properEnd!, endOffset);
			}

			range.collapse(true);
			sel.removeAllRanges();
			sel.addRange(range);

			// This is getting crazy
			window.setTimeout(() => {
				ref.current!.style.caretColor = caretColorStore;
			}, 10);
		}, 0);

		// Check if we want to open variable selector
		if (delta === '{') {
			const sel = window.getSelection()!;
			const range = sel.getRangeAt(0);
			const elem = range.startContainer.parentElement! as HTMLElement;
			const rect = elem.getBoundingClientRect();
			const contentLength = (elem.textContent ?? '').length;
			const caretOffset = range.startOffset;
			const positionOffset = caretOffset / contentLength;
			const width = elem.offsetWidth;
			const offsetDelta = width * positionOffset;

			const partIndex = newParts.findIndex(p => p === elem.textContent);

			setPartIndex(partIndex);
			setQueryOffset(range.startOffset);
			setQuery(elem.textContent!.substr(range.startOffset));
			setSelectorPosition({
				left: (rect.left + offsetDelta) - 5,
				top: rect.top + elem.offsetHeight,
			});

			return;
		}

		// Scrub if the variable selector isn't open
		if (selectorPosition === null || partIndex === void 0 || queryOffset === void 0)
			return;

		const part = newParts[partIndex];

		if (typeof part !== 'string') {
			closeSelector();

			return;
		}

		const queryLength = part.length - queryOffset;

		if (queryLength === -1)
			closeSelector();
		else
			setQuery(part.substr(queryOffset));
	}

	function renderParts() {
		return renderToStaticMarkup(
			<React.Fragment>
				{parts.map((p, index) => {
					if (typeof p === 'string') {
						return (
							<span key={index}>
								{p}
							</span>
						);
					}

					if (typeof p !== 'object')
						throw new Error('unknown part');

					if (p.type !== 'variable_group_item')
						throw new Error('unknown part type');

					return (
						<div
							className={'bvs-blob'}
							contentEditable={false}
							data-type={p.type}
							data-payload-item-id={p.payload.itemId}
							key={index}
						>
							<strong>
								{'Environment'}
							</strong>
							{' '}
							{'(env)'}
						</div>
					);
				})}
			</React.Fragment>,
		);
	}

	return (
		<React.Fragment>
			<Input
				contentEditable={!disabled}
				key={Date() /* this looks weird but is intention and required */}
				ref={ref}
				suppressContentEditableWarning
				onBlur={event => {
					// event.
					// closeSelector();
				}}
				onInput={change}
				onKeyDown={event => {
					if (!['ArrowUp', 'ArrowDown'].includes(event.key))
						return;

					event.preventDefault();

					if (event.key === 'ArrowUp') {
						// do up thing
					} else if (event.key === 'ArrowDown') {
						// do down thing
					}
				}}
				dangerouslySetInnerHTML={{ __html: renderParts() }}
			/>
			{(ref.current && selectorPosition) && (
				<VariableSelector
					done={insertVariable}
					close={() => {
						closeSelector();
					}}
					query={query}
					parent={ref.current}
					position={selectorPosition}
				/>
			)}
		</React.Fragment>
	);
};

const Input = styled.article`
	font-size: 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	white-space: nowrap;
	overflow: hidden;

	&:focus {
		outline: 0;
		border: 1px solid ${p => p.theme.ui.primaryFill};
	}

	> * {
		display:inline;
		white-space:nowrap;
	}
`;

function getProperNode(elem: HTMLElement, container: Node) {
	for (const child of elem.childNodes) {
		if (child.textContent === container.textContent) {
			if (child.nodeName === '#text')
				return child;

			return child.childNodes[0] || null;
		}
	}

	return null;
}

export default VariableInput;
