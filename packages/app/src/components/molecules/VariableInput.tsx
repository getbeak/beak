import { ValueParts, ValuePartVariableGroupItem } from '@beak/common/dist/types/beak-project';
import React, { useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';

import VariableSelector from './VariableSelector';

export interface VariableInputProps {
	disabled?: boolean;
	parts: ValueParts;
	onChange: (parts: ValueParts) => void;
}

const VariableInput: React.FunctionComponent<VariableInputProps> = ({ disabled, parts, onChange }) => {
	const [query, setQuery] = useState('');
	const [selectorPosition, setSelectorPosition] = useState<{ top: number; left: number } | null>(null);
	const ref = useRef<HTMLDivElement>(null);

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
			}, 1);
		}, 0);

		// // Check if we want to open variable selector
		// if (delta === '{') {
		// 	const sel = window.getSelection()!;
		// 	const range = sel.getRangeAt(0);
		// 	const elem = range.startContainer.parentElement! as HTMLElement;
		// 	const rect = elem.getBoundingClientRect();
		// 	const contentLength = (elem.textContent ?? '').length;
		// 	const caretOffset = range.startOffset;
		// 	const positionOffset = caretOffset / contentLength;
		// 	const width = elem.offsetWidth;
		// 	const offsetDelta = width * positionOffset;

		// 	setSelectorPosition({
		// 		left: (rect.left + offsetDelta) - 5,
		// 		top: rect.top + elem.offsetHeight,
		// 	});

		// 	return;
		// }

		// // Update selector query if selector is being shown
		// if (selectorPosition === null)
		// 	return;

		// if (delta === null)
		// 	setQuery(query.slice(0, -1));
		// else
		// 	setQuery(`${query}${delta}`);
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
				onBlur={() => {
					setSelectorPosition(null);
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
					done={(vgName, itemId) => { }}
					close={() => {
						setSelectorPosition(null);
						setQuery('');
					}}
					query={query}
					parent={ref.current!}
					position={selectorPosition}
				/>
			)}
		</React.Fragment>
	);
};

const Input = styled.div`
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
