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

	&:disabled {
		user-select: text;
	}

	.bvs-blob {
		display: inline-block;
		user-select: text;
		margin: 0;
		padding: 1px 3px;
		border-radius: 4px;
		font-size: 11px;
		line-height: 12px;
		background: ${p => p.theme.ui.primaryFill};
		color: ${p => p.theme.ui.textOnAction};

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
