// Static CSS for react-reflex panes. The component returns a <style> tag
// rather than going through styled-components' createGlobalStyle.

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

	.reflex-container > .reflex-splitter {
		background-color: #eeeeee;
		z-index: 100;
	}

	.reflex-container > .reflex-splitter.active,
	.reflex-container > .reflex-splitter:hover {
		background-color: #c6c6c6;
		transition: all 1s ease;
	}

	.horizontal > .reflex-splitter {
		border-bottom: 1px solid #c6c6c6;
		border-top: 1px solid #c6c6c6;
		cursor: row-resize;
		width: 100%;
		height: 2px;
	}

	.reflex-element.horizontal .reflex-handle { cursor: row-resize; user-select: none; }

	.reflex-container.horizontal > .reflex-splitter:hover,
	.reflex-container.horizontal > .reflex-splitter.active {
		border-bottom: 1px solid #eeeeee;
		border-top: 1px solid #eeeeee;
	}

	.reflex-container.vertical > .reflex-splitter {
		border-right: 1px solid #c6c6c6;
		border-left: 1px solid #c6c6c6;
		cursor: col-resize;
		height: 100%;
		width: 2px;
	}

	.reflex-element.vertical .reflex-handle { cursor: col-resize; user-select: none; }

	.reflex-container.vertical > .reflex-splitter:hover,
	.reflex-container.vertical > .reflex-splitter.active {
		border-right: 1px solid #eeeeee;
		border-left: 1px solid #eeeeee;
	}

	.reflex-container > .reflex-splitter.reflex-thin {
		box-sizing: border-box;
		background-clip: padding-box;
		opacity: 0.2;
		z-index: 100;
	}

	.reflex-container > .reflex-splitter.reflex-thin.active
	.reflex-container > .reflex-splitter.reflex-thin:hover {
		transition: all 1.5s ease;
		opacity: 0.5;
	}

	.reflex-container.horizontal > .reflex-splitter.reflex-thin {
		border-bottom: 8px solid rgba(255, 255, 255, 0);
		border-top: 8px solid rgba(255, 255, 255, 0);
		height: 17px !important;
		cursor: row-resize;
		margin: -8px 0;
		width: 100%;
	}

	.reflex-container.horizontal > .reflex-splitter.reflex-thin.active,
	.reflex-container.horizontal > .reflex-splitter.reflex-thin:hover {
		border-bottom: 8px solid #e4e4e4;
		border-top: 8px solid #e4e4e4;
	}

	.reflex-container.vertical > .reflex-splitter.reflex-thin {
		border-right: 8px solid rgba(255, 255, 255, 0);
		border-left: 8px solid rgba(255, 255, 255, 0);
		width: 17px !important;
		cursor: col-resize;
		margin: 0 -8px;
		height: 100%;
	}

	.reflex-container.vertical > .reflex-splitter.reflex-thin.active,
	.reflex-container.vertical > .reflex-splitter.reflex-thin:hover {
		border-right: 8px solid #e4e4e4;
		border-left: 8px solid #e4e4e4;
	}
`;

const ReflexStyles: React.FC = () => <style>{REFLEX_CSS}</style>;

export default ReflexStyles;
