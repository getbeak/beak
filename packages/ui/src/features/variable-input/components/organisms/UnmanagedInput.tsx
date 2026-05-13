import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface UnmanagedInputProps {
	innerRef: React.MutableRefObject<HTMLDivElement | null>;
}

export default class UnmanagedInput extends React.Component<UnmanagedInputProps> {
	shouldComponentUpdate() {
		return false;
	}

	render() {
		return (
			<Box
				as='article'
				ref={this.props.innerRef as unknown as React.Ref<HTMLElement>}
				contentEditable
				spellCheck={false}
				suppressContentEditableWarning
				fontSize='sm'
				borderWidth='1px'
				borderColor='border.default'
				whiteSpace='nowrap'
				overflow='hidden'
				css={{
					'&[disabled="true"]': {
						userSelect: 'text',
						cursor: 'text',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					},
					'.bvs-blob': {
						display: 'inline-block',
						margin: '0 1px',
						marginBottom: '-1px',
						borderRadius: '4px',
						fontSize: '11px',
						lineHeight: '15px',
						background: 'var(--beak-colors-accent-pink)',
						color: 'var(--beak-colors-fg-onAccent)',
						userSelect: 'text',
					},
					'.bvs-blob > strong': { fontWeight: 600 },
					'.bvs-blob[data-editable="true"]': { cursor: 'pointer' },
					'> *': { display: 'inline', whiteSpace: 'nowrap' },
					br: { display: 'none' },
				}}
				onDoubleClick={(event: React.MouseEvent<HTMLElement>) => {
					const disabled = event.currentTarget.getAttribute('disabled') === 'true';
					if (!disabled) return;
					window.getSelection()?.selectAllChildren(event.currentTarget);
					event.preventDefault();
				}}
			/>
		);
	}
}
