import React from 'react';
import { type PlacesType, Tooltip } from 'react-tooltip';

import 'react-tooltip/dist/react-tooltip.css';

interface TooltipDefinition {
	anchor: string;
	placement?: PlacesType;
	content?: string;
}

const tooltips: TooltipDefinition[] = [
	{
		anchor: '#tt-action-bar-encryption-button',
		placement: 'bottom',
		content: 'View project encryption',
	},
	{
		anchor: '#tt-action-bar-previous-flight-history',
		placement: 'bottom',
		content: 'Go to previous item in flight history',
	},
	{
		anchor: '#tt-action-bar-next-flight-history',
		placement: 'bottom-end',
		content: 'Go to next item in flight history',
	},
	{
		anchor: '#tt-action-bar-alert-button',
		placement: 'bottom-end',
		content: 'Shows possible errors with your project',
	},
	{
		anchor: '#tt-action-bar-flight-status-pending',
		placement: 'bottom',
		content: 'Awaiting flight…',
	},
	{
		anchor: '#tt-action-bar-flight-status-failed',
		placement: 'bottom',
		content: 'Flight failed — request could not be sent',
	},
	{
		anchor: '#tt-action-bar-flight-status-success',
		placement: 'bottom',
		content: 'Flight complete',
	},
	{
		anchor: '#tt-action-bar-flight-status-server-failed',
		placement: 'bottom',
		content: 'Server returned an error response',
	},
	{
		anchor: '#tt-action-bar-flight-status-active',
		placement: 'bottom',
		content: 'Flight in progress',
	},
	{
		anchor: 'tt-variable-input-extension',
	},
	{
		anchor: 'tt-response-header-url-bar',
	},
	{
		anchor: 'tt-action-bar-omni-search',
		placement: 'bottom-end',
	},
	{
		anchor: 'tt-omni-bar-finder-request-uri',
	},
	{
		anchor: 'tt-variables-renderer-extension-missing',
	},
	{
		anchor: 'tt-sidebar-menu-item',
	},
	{
		anchor: 'tt-schema-row-description',
	},
];

// Beak's tooltip chrome — inverted surface so it always reads with high
// contrast against the chrome behind it (dark tooltip in light theme, light
// tooltip in dark theme — same pattern macOS / Linear / Notion use).
// Injected once at module load.
if (typeof document !== 'undefined' && !document.getElementById('beak-tooltip-styles')) {
	const styleEl = document.createElement('style');
	styleEl.id = 'beak-tooltip-styles';
	styleEl.textContent = `
		:root {
			--rt-opacity: 1;
			--rt-transition-show-delay: 0.15s;
			--rt-transition-closing-delay: 0.05s;
			--beak-tt-bg: var(--beak-colors-gray-900);
			--beak-tt-fg: var(--beak-colors-gray-50);
			--beak-tt-border: var(--beak-colors-gray-700);
		}
		html.dark {
			--beak-tt-bg: var(--beak-colors-gray-100);
			--beak-tt-fg: var(--beak-colors-gray-950);
			--beak-tt-border: var(--beak-colors-gray-300);
		}
		.beak-tooltip {
			z-index: 1000;
			max-width: 280px;
			padding: 5px 9px !important;
			font-size: 12px !important;
			font-weight: 400;
			line-height: 1.4;
			color: var(--beak-tt-fg) !important;
			background: var(--beak-tt-bg) !important;
			border: 1px solid var(--beak-tt-border) !important;
			border-radius: 4px !important;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
		}
		.beak-tooltip .react-tooltip-arrow,
		.beak-tooltip > [class*='styles-module_arrow'] {
			background: var(--beak-tt-bg) !important;
			border-right: 1px solid var(--beak-tt-border);
			border-bottom: 1px solid var(--beak-tt-border);
		}
	`;
	document.head.appendChild(styleEl);
}

export const Tooltips: React.FC = () => (
	<React.Fragment>
		{tooltips.map(t => {
			if (t.content === void 0) {
				return <Tooltip id={t.anchor} key={t.anchor} place={t.placement} className='beak-tooltip' />;
			}

			return (
				<Tooltip anchorSelect={t.anchor} key={t.anchor} place={t.placement} className='beak-tooltip'>
					{t.content}
				</Tooltip>
			);
		})}
	</React.Fragment>
);

export default Tooltips;
