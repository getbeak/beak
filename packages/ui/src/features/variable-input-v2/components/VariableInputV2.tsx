import type { VariableInputProps } from '@beak/ui/features/variable-input/components/VariableInput';
import VariableEditor from '@beak/ui/features/variables-editor/components/VariableEditor';
import { checkShortcut } from '@beak/ui/lib/keyboard-shortcuts';
import { requestFlight } from '@beak/ui/store/flight/actions';
import { Box } from '@chakra-ui/react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import type { EditorState, LexicalEditor, LexicalNode } from 'lexical';
import { $getRoot, $isElementNode, $isTextNode } from 'lexical';
import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { $isVariableChipNode, VariableChipNode } from '../nodes/VariableChipNode';
import ChipDataIndexPlugin from '../plugins/ChipDataIndexPlugin';
import ExternalValueSyncPlugin from '../plugins/ExternalValueSyncPlugin';
import InitialValuePlugin from '../plugins/InitialValuePlugin';
import SingleLinePlugin from '../plugins/SingleLinePlugin';
import VariableTriggerPlugin from '../plugins/VariableTriggerPlugin';
import { $readValueSections } from '../utils/value-sections-conversion';

interface EditorMountProps extends VariableInputProps {
	editorRef: React.MutableRefObject<LexicalEditor | null>;
	rootElement: HTMLDivElement | null;
	setRootElement: (elem: HTMLDivElement | null) => void;
}

const EditorMount: React.FC<EditorMountProps> = props => {
	const {
		disabled,
		readOnly,
		placeholder,
		mask,
		requestId,
		parts,
		onChange,
		onUrlQueryStringDetection,
		editorRef,
		rootElement,
		setRootElement,
	} = props;
	const dispatch = useDispatch();
	const lastUpstreamReportRef = useRef<number>(0);
	const debounceRef = useRef<number | undefined>(undefined);

	const flushChange = useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const next = $readValueSections();
				lastUpstreamReportRef.current = Date.now();
				onChange(next);
			});
		},
		[onChange],
	);

	const handleChange = useCallback(
		(editorState: EditorState, _editor: LexicalEditor) => {
			if (debounceRef.current) window.clearTimeout(debounceRef.current);
			debounceRef.current = window.setTimeout(() => flushChange(editorState), 50);
		},
		[flushChange],
	);

	// Detect `?` typed in plain text — legacy URL-query-string handshake.
	useEffect(() => {
		if (!onUrlQueryStringDetection) return;
		const editor = editorRef.current;
		if (!editor) return;

		return editor.registerTextContentListener(text => {
			if (text.includes('?')) onUrlQueryStringDetection();
		});
	}, [editorRef, onUrlQueryStringDetection]);

	const handleEditorSave = useCallback(
		(partIndex: number, type: string, item: unknown) => {
			const editor = editorRef.current;
			if (!editor) return;

			editor.update(() => {
				const root = $getRoot();
				let visited = 0;
				let buffered = false;

				const flush = () => {
					if (buffered) {
						visited += 1;
						buffered = false;
					}
				};

				const walk = (children: LexicalNode[]): boolean => {
					for (const node of children) {
						if ($isVariableChipNode(node)) {
							flush();
							if (visited === partIndex && node.getVariableType() === type) {
								node.setPayload(item);
								return true;
							}
							visited += 1;
							continue;
						}
						if ($isTextNode(node)) {
							if (node.getTextContent().length > 0) buffered = true;
							continue;
						}
						if ($isElementNode(node) && walk(node.getChildren())) return true;
					}
					return false;
				};

				walk(root.getChildren());
			});
		},
		[editorRef],
	);

	useEffect(() => {
		const elem = rootElement;
		if (!elem) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (checkShortcut('global.execute-request', event)) {
				event.stopPropagation();
				const editor = editorRef.current;
				if (editor) flushChange(editor.getEditorState());
				window.setTimeout(() => dispatch(requestFlight()), 0);
			}
		};
		elem.addEventListener('keydown', onKeyDown);
		return () => elem.removeEventListener('keydown', onKeyDown);
	}, [rootElement, dispatch, editorRef, flushChange]);

	return (
		<React.Fragment>
			<InitialValuePlugin parts={parts} />
			<ExternalValueSyncPlugin parts={parts} lastUpstreamReportRef={lastUpstreamReportRef} />
			<SingleLinePlugin />
			<ChipDataIndexPlugin />
			<VariableTriggerPlugin requestId={requestId} />
			<HistoryPlugin />
			<OnChangePlugin onChange={handleChange} ignoreSelectionChange />
			<PlainTextPlugin
				contentEditable={
					<ContentEditable
						ref={setRootElement}
						aria-label='Variable input'
						spellCheck={false}
						disabled={disabled}
						readOnly={readOnly}
						data-placeholder={placeholder ?? ''}
						data-masked={mask ? 'true' : undefined}
						className='bvs-editor'
						style={{
							caretColor: 'var(--beak-colors-accent-pink)',
							outline: 'none',
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							// biome-ignore lint/style/useNamingConvention: CSS vendor-prefixed property
							...(mask ? ({ WebkitTextSecurity: 'disc', textSecurity: 'disc' } as React.CSSProperties) : {}),
						}}
					/>
				}
				placeholder={null}
				ErrorBoundary={LexicalErrorBoundary}
			/>
			{rootElement && <VariableEditor requestId={requestId} editable={rootElement} onSave={handleEditorSave} />}
		</React.Fragment>
	);
};

const editorTheme = {
	// Empty theme: we rely on the chip node's DOM/CSS contract (the same
	// `.bvs-blob` class the legacy renderer uses) rather than Lexical's
	// theming layer.
	text: {},
};

// Chakra `css={}` rules for the editor host. Kept as a constant so the
// JSX body stays readable; lifted verbatim from the legacy
// `UnmanagedInput` so chips look identical between the two
// implementations during the side-by-side phase. The cutover PR is the
// natural moment to consolidate this with the chip's own CSS.
const editorHostCss = {
	'& .bvs-editor': {
		fontSize: 'var(--beak-fontSizes-sm)',
		borderWidth: '1px',
		borderColor: 'var(--beak-colors-border-subtle)',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
	},
	'& .bvs-editor:empty::before, & .bvs-editor p:empty::before': {
		content: 'attr(data-placeholder)',
		color: 'var(--beak-colors-fg-subtle)',
		fontStyle: 'italic',
		pointerEvents: 'none',
	},
	'& .bvs-editor p': {
		margin: 0,
		display: 'inline',
		whiteSpace: 'nowrap',
	},
	'& .bvs-editor br': { display: 'none' },
	'& .bvs-blob': {
		'--blob-accent': 'var(--beak-colors-accent-pink)',
		display: 'inline-block',
		verticalAlign: 'middle',
		margin: '0 2px',
		padding: '1px 5px',
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
		transition: 'background .14s ease, box-shadow .14s ease, filter .14s ease',
	},
	'& .bvs-blob > strong': { fontWeight: 700, letterSpacing: '-0.005em' },
	'& .bvs-blob[data-editable="true"]': { cursor: 'pointer' },
	'& .bvs-blob[data-editable="true"]:hover': {
		filter: 'brightness(1.06)',
		boxShadow:
			'0 3px 8px color-mix(in srgb, var(--blob-accent) 42%, transparent), inset 0 1px 0 color-mix(in srgb, white 30%, transparent)',
	},
	'& .bvs-blob[data-editable="true"]:active': { filter: 'brightness(0.95)' },
	'& .bvs-blob[data-category="env"]': { '--blob-accent': 'var(--beak-colors-accent-indigo)' },
	'& .bvs-blob[data-sensitive="true"]': {
		'--blob-accent': 'var(--beak-colors-accent-warning)',
		color: 'var(--beak-colors-gray-950)',
		fontWeight: 600,
	},
	'& .bvs-blob[data-missing="true"]': {
		'--blob-accent': 'var(--beak-colors-accent-alert)',
		color: 'var(--beak-colors-fg-onAccent)',
		fontWeight: 600,
		letterSpacing: '0.01em',
	},
};

const VariableInputV2 = React.forwardRef<HTMLElement, VariableInputProps>((props, forwardedRef) => {
	const editorRef = useRef<LexicalEditor | null>(null);
	const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);

	useImperativeHandle(forwardedRef, () => rootElement as unknown as HTMLElement, [rootElement]);

	const initialConfig = useMemo(
		() => ({
			namespace: 'beak-variable-input-v2',
			editable: !props.readOnly && !props.disabled,
			theme: editorTheme,
			onError: (error: Error) => {
				console.error('[variable-input-v2]', error);
			},
			nodes: [VariableChipNode],
			editorState: undefined,
		}),
		// Recreating LexicalComposer on every edit is expensive; only rebuild
		// when read/write capability flips. Parts changes are handled by
		// ExternalValueSyncPlugin against a stable editor.
		[props.readOnly, props.disabled],
	);

	return (
		<Box position='relative' data-beak-variable-input-v2 css={editorHostCss}>
			<LexicalComposer initialConfig={initialConfig}>
				<EditorRefCapture editorRef={editorRef} />
				<EditorMount {...props} editorRef={editorRef} rootElement={rootElement} setRootElement={setRootElement} />
			</LexicalComposer>
		</Box>
	);
});

// Bridges the LexicalComposer's internal editor instance up to the outer
// ref so we can issue commands (insert, edit-save) from outside the tree.
const EditorRefCapture: React.FC<{ editorRef: React.MutableRefObject<LexicalEditor | null> }> = ({ editorRef }) => {
	const [editor] = useLexicalComposerContext();
	useEffect(() => {
		editorRef.current = editor;
		return () => {
			if (editorRef.current === editor) editorRef.current = null;
		};
	}, [editor, editorRef]);
	return null;
};

export default VariableInputV2;
