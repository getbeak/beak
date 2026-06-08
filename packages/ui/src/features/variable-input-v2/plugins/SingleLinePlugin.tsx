import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
	COMMAND_PRIORITY_LOW,
	INSERT_LINE_BREAK_COMMAND,
	INSERT_PARAGRAPH_COMMAND,
	KEY_ENTER_COMMAND,
	TextNode,
} from 'lexical';
import { useEffect } from 'react';

/**
 * Enforces the single-line constraint.
 *
 * - `KEY_ENTER_COMMAND` is consumed so Enter cannot insert a newline.
 *   `Cmd/Ctrl + Enter` (request execution) still works because the global
 *   keyboard-shortcut layer intercepts upstream.
 * - `INSERT_LINE_BREAK_COMMAND` and `INSERT_PARAGRAPH_COMMAND` are
 *   swallowed too — those are the commands the paste pipeline dispatches
 *   when clipboard content contains newlines. Without these, a paste of
 *   "line1\nline2" would render two visible lines even in PlainTextPlugin.
 * - A `TextNode` transform strips any literal `\n` / `\r` that slip
 *   through (e.g. programmatic inserts or IME composition products) so
 *   the editor's text content is always single-line.
 */
const SingleLinePlugin: React.FC = () => {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		const unregisterEnter = editor.registerCommand(
			KEY_ENTER_COMMAND,
			event => {
				event?.preventDefault();
				return true;
			},
			COMMAND_PRIORITY_LOW,
		);
		const unregisterLineBreak = editor.registerCommand(INSERT_LINE_BREAK_COMMAND, () => true, COMMAND_PRIORITY_LOW);
		const unregisterParagraph = editor.registerCommand(INSERT_PARAGRAPH_COMMAND, () => true, COMMAND_PRIORITY_LOW);
		const unregisterTextTransform = editor.registerNodeTransform(TextNode, node => {
			const text = node.getTextContent();
			if (text.includes('\n') || text.includes('\r')) node.setTextContent(text.replace(/[\r\n]+/g, ''));
		});

		return () => {
			unregisterEnter();
			unregisterLineBreak();
			unregisterParagraph();
			unregisterTextTransform();
		};
	}, [editor]);

	return null;
};

export default SingleLinePlugin;
