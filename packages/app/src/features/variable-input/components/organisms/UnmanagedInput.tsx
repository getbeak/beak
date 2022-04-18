import React from 'react';
import styled from 'styled-components';

interface UnmanagedInputProps {
	innerRef: React.ForwardedRef<HTMLDivElement | null>;
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
	user-select: text;

	> * {
		display:inline;
		white-space:nowrap;
	}

	br {
		display: none;
	}
`;
