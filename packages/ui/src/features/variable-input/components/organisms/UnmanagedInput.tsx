import React from 'react';
import styled from 'styled-components';

interface UnmanagedInputProps {
	innerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export default class UnmanagedInput extends React.Component<UnmanagedInputProps> {
	shouldComponentUpdate() {
		return false;
	}

	render() {
		return (
			<Input
				contentEditable
				spellCheck={false}
				suppressContentEditableWarning
				onDoubleClick={event => {
					const disabled = event.currentTarget.getAttribute('disabled') === 'true';

					if (!disabled)
						return;

					window.getSelection()?.selectAllChildren(event.currentTarget);
					event.preventDefault();
				}}
				ref={this.props.innerRef}
			/>
		);
	}
}

const Input = styled.article`
	font-size: 12px;
	border: 1px solid ${p => p.theme.ui.backgroundBorderSeparator};
	white-space: nowrap;
	overflow: hidden;

	&[disabled="true"] {
		user-select: text;
		cursor: text;

		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bvs-blob {
		display: inline-block;
		margin: 0 1px;
		margin-bottom: -1px;
		border-radius: 4px;
		font-size: 11px;
		line-height: 15px;
		background: ${p => p.theme.ui.primaryFill};
		color: ${p => p.theme.ui.textOnAction};
		user-select: text;

		> strong {
			font-weight: 600;
		}

		&[data-editable='true'] {
			cursor: pointer;
		}
	}

	> * {
		display:inline;
		white-space:nowrap;
	}

	br {
		display: none;
	}
`;
