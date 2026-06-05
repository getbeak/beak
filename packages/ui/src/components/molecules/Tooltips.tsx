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

// Beak's tooltip chrome. Goal: feel like Linear/Raycast/Vercel — small,
// dark, no border, soft shadow, brief delay. Same dark surface in light
// and dark themes (modern apps deliberately don't invert tooltips — it
// keeps the brand voice consistent and tooltips are recognizably
// "tooltip-shaped" regardless of theme). Injected (or refreshed) at
// module load so HMR picks up edits to this block instead of leaving the
// previous tooltip CSS sitting in the DOM.
if (typeof document !== 'undefined') {
	let styleEl = document.getElementById('beak-tooltip-styles') as HTMLStyleElement | null;
	if (!styleEl) {
		styleEl = document.createElement('style');
		styleEl.id = 'beak-tooltip-styles';
		document.head.appendChild(styleEl);
	}
	styleEl.textContent = `
		:root {
			--rt-opacity: 1;
			--rt-transition-show-delay: 0.18s;
			--rt-transition-closing-delay: 0s;
		}
		.beak-tooltip {
			/* Above modal dialogs (101) and portal popups (102–110). */
			z-index: 1500 !important;
			max-width: 220px !important;
			padding: 2px 6px !important;
			font-size: 10.5px !important;
			font-weight: 500 !important;
			line-height: 1.3 !important;
			letter-spacing: 0 !important;
			color: rgba(255, 255, 255, 0.92) !important;
			background: rgba(24, 26, 33, 0.94) !important;
			border: 0 !important;
			border-radius: 3px !important;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14), 0 3px 8px rgba(0, 0, 0, 0.12) !important;
			pointer-events: none;
			-webkit-backdrop-filter: blur(8px);
			backdrop-filter: blur(8px);
		}
		.beak-tooltip .react-tooltip-arrow,
		.beak-tooltip > [class*='styles-module_arrow'] {
			width: 5px !important;
			height: 5px !important;
			background: rgba(24, 26, 33, 0.94) !important;
			border: 0 !important;
		}
	`;
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
