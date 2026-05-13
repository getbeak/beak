// Static CSS for react-reflex panes. The component returns a <style> tag
// rather than going through styled-components' createGlobalStyle.
//
// Visual styling for the splitter element (background, hover, glow) lives
// in `ReflexSplitter` so it can resolve through Chakra tokens at runtime.
// This file only sets up the structural and cursor-related rules.

import * as React from 'react';

const REFLEX_CSS = `
	body.reflex-col-resize { cursor: col-resize; }
	body.reflex-row-resize { cursor: row-resize; }

	.reflex-container {
		justify-content: flex-start;
		align-items: stretch;
		align-content: stretch;
		display: flex;
		position: relative;
		height: 100%;
		width: 100%;
	}

	.reflex-container.horizontal { flex-direction: column; min-height: 1px; }
	.reflex-container.vertical { flex-direction: row; min-width: 1px; }

	.reflex-container > .reflex-element { position: relative; overflow: auto; height: 100%; width: 100%; }

	.reflex-container.reflex-resizing > .reflex-element {
		pointer-events: none;
		user-select: none;
	}

	.reflex-container > .reflex-element > .reflex-size-aware { height: 100%; width: 100%; }

	.horizontal > .reflex-splitter {
		cursor: row-resize;
		width: 100%;
	}

	.reflex-element.horizontal .reflex-handle { cursor: row-resize; user-select: none; }

	.reflex-container.vertical > .reflex-splitter {
		cursor: col-resize;
		height: 100%;
	}

	.reflex-element.vertical .reflex-handle { cursor: col-resize; user-select: none; }
`;

const ReflexStyles: React.FC = () => <style>{REFLEX_CSS}</style>;

export default ReflexStyles;
