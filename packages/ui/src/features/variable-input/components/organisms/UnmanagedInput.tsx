import { Box } from '@chakra-ui/react';
import * as React from 'react';

interface UnmanagedInputProps {
	innerRef: React.MutableRefObject<HTMLDivElement | null>;
	placeholder?: string;
}

export default class UnmanagedInput extends React.Component<UnmanagedInputProps> {
	shouldComponentUpdate(nextProps: UnmanagedInputProps) {
		// Only re-render when the placeholder text changes. The actual editable
		// content is managed imperatively via innerHTML in VariableInput, so we
		// continue to skip re-renders triggered by upstream state churn.
		return nextProps.placeholder !== this.props.placeholder;
	}

	render() {
		const { placeholder } = this.props;
		return (
			<Box
				as='article'
				ref={this.props.innerRef as unknown as React.Ref<HTMLElement>}
				contentEditable
				spellCheck={false}
				suppressContentEditableWarning
				data-placeholder={placeholder ?? ''}
				fontSize='sm'
				borderWidth='1px'
				borderColor='border.subtle'
				whiteSpace='nowrap'
				overflow='hidden'
				style={{ caretColor: 'var(--beak-colors-accent-pink)' }}
				css={{
					// CSS-driven placeholder follows the host's padding naturally and
					// avoids the previous absolute-positioned overlay with hardcoded
					// `top: 7px / left: 9px` that broke when the URL field tightened.
					'&:empty::before': {
						content: 'attr(data-placeholder)',
						color: 'var(--beak-colors-fg-subtle)',
						fontStyle: 'italic',
						pointerEvents: 'none',
					},
					'&[disabled="true"]': {
						userSelect: 'text',
						cursor: 'text',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					},
					// Nested selectors MUST use `&` in Chakra v3's `css` prop, otherwise
					// emotion silently drops them. We use leading-`&` everywhere so the
					// blob, placeholder, and reset rules actually emit.
					'& > *': { display: 'inline', whiteSpace: 'nowrap', verticalAlign: 'baseline' },
					'& br': { display: 'none' },
					// Caret-landing anchors: the renderer drops zero-width sentinels
					// next to and between blobs so Chromium has something to draw the
					// caret against. They contribute no visible glyph; just enough box
					// for the caret to sit on.
					'& span[data-anchor]': {
						display: 'inline-block',
						verticalAlign: 'middle',
						width: '0px',
						minWidth: '1px',
						lineHeight: 'inherit',
					},
					// Base blob — used for generated/computed values (uuid, nonce, hash,
					// timestamp, …). The `--blob-accent` custom property is recoloured by
					// the category overrides further down for environment / sensitive /
					// missing variants. Everything else (gradient, shadow, hover lift)
					// derives from that variable so the visual language stays consistent.
					'& .bvs-blob': {
						'--blob-accent': 'var(--beak-colors-accent-pink)',
						display: 'inline-block',
						verticalAlign: 'middle',
						margin: '0 2px',
						marginBottom: '0px',
						padding: '1px 5px 1px 5px',
						borderRadius: '5px',
						fontSize: '10.5px',
						fontWeight: 500,
						letterSpacing: '0.005em',
						lineHeight: '15px',
						background:
							'linear-gradient(180deg, color-mix(in srgb, var(--blob-accent) 100%, white 8%) 0%, color-mix(in srgb, var(--blob-accent) 88%, transparent) 100%)',
						color: 'var(--beak-colors-fg-onAccent)',
						userSelect: 'text',
						boxShadow:
							'0 1px 2px color-mix(in srgb, var(--blob-accent) 30%, transparent), inset 0 1px 0 color-mix(in srgb, white 22%, transparent)',
						transition:
							'background .14s ease, transform .12s cubic-bezier(0.16, 1, 0.3, 1), box-shadow .14s ease, filter .14s ease',
					},
					'& .bvs-blob > strong': { fontWeight: 700, letterSpacing: '-0.005em' },
					'& .bvs-blob[data-editable="true"]': { cursor: 'pointer' },
					'& .bvs-blob[data-editable="true"]:hover': {
						filter: 'brightness(1.06)',
						transform: 'translateY(-1px)',
						boxShadow:
							'0 3px 8px color-mix(in srgb, var(--blob-accent) 42%, transparent), inset 0 1px 0 color-mix(in srgb, white 30%, transparent)',
					},
					'& .bvs-blob[data-editable="true"]:active': {
						transform: 'translateY(0px)',
						filter: 'brightness(0.95)',
					},
					// Environment values resolve per active variable-set; tint indigo so
					// the user can see at a glance which blobs swap with the environment.
					'& .bvs-blob[data-category="env"]': {
						'--blob-accent': 'var(--beak-colors-accent-indigo)',
					},
					// Sensitive values (secure, private) wear an amber-warning tint and a
					// lock-gradient hint so they don't blend with the regular values.
					'& .bvs-blob[data-sensitive="true"]': {
						'--blob-accent': 'var(--beak-colors-accent-warning)',
						color: 'var(--beak-colors-gray-950)',
						fontWeight: 600,
					},
					// Missing variables — extension uninstalled, type unknown. Loud red
					// fill, no hover lift since clicking won't do anything useful.
					'& .bvs-blob[data-missing="true"]': {
						'--blob-accent': 'var(--beak-colors-accent-alert)',
						color: 'var(--beak-colors-fg-onAccent)',
						fontWeight: 600,
						letterSpacing: '0.01em',
					},
					'& .bvs-blob[data-missing="true"]:hover': {
						transform: 'none',
						filter: 'brightness(1.02)',
					},
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
