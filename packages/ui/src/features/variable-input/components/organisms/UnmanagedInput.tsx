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
				borderColor='border.subtle'
				whiteSpace='nowrap'
				overflow='hidden'
				style={{ caretColor: 'var(--beak-colors-accent-pink)' }}
				css={{
					'&[disabled="true"]': {
						userSelect: 'text',
						cursor: 'text',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					},
					'.bvs-blob': {
						display: 'inline-block',
						margin: '0 2px',
						marginBottom: '-1px',
						padding: '0 4px',
						borderRadius: '4px',
						fontSize: '11px',
						fontWeight: 500,
						lineHeight: '15px',
						background: 'color-mix(in srgb, var(--beak-colors-accent-pink) 88%, transparent)',
						color: 'var(--beak-colors-fg-onAccent)',
						userSelect: 'text',
						boxShadow: '0 1px 2px color-mix(in srgb, var(--beak-colors-accent-pink) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
						transition: 'background-color .12s ease, transform .08s ease',
					},
					'.bvs-blob > strong': { fontWeight: 700, letterSpacing: '-0.005em' },
					'.bvs-blob[data-editable="true"]': { cursor: 'pointer' },
					'.bvs-blob[data-editable="true"]:hover': {
						background: 'var(--beak-colors-accent-pink)',
						transform: 'translateY(-1px)',
					},
					'.bvs-blob[data-missing="true"]': {
						background: 'color-mix(in srgb, var(--beak-colors-accent-alert) 82%, transparent)',
						color: '#ffffff',
						fontWeight: 600,
						letterSpacing: '0.01em',
						boxShadow: '0 1px 2px color-mix(in srgb, var(--beak-colors-accent-alert) 32%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
					},
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
