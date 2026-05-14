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
];

// Beak's tooltip chrome. react-tooltip ships a basic dark/light pill — the
// override below brings tooltips inline with the rest of the app's frosted-
// glass aesthetic: translucent surface, accent-pink edge, soft shadow, and
// a `font-size:11px / line-height:1.35` body that reads at desktop density.
// Injected once at module load (the CSS rules are global anyway).
if (typeof document !== 'undefined' && !document.getElementById('beak-tooltip-styles')) {
	const styleEl = document.createElement('style');
	styleEl.id = 'beak-tooltip-styles';
	styleEl.textContent = `
		:root {
			--rt-opacity: 1;
			--rt-transition-show-delay: 0.12s;
			--rt-transition-closing-delay: 0.1s;
		}
		.beak-tooltip {
			z-index: 1000;
			max-width: 280px;
			padding: 6px 9px !important;
			font-size: 11px !important;
			font-weight: 500;
			line-height: 1.35;
			letter-spacing: 0.005em;
			color: var(--beak-colors-fg-default) !important;
			background: color-mix(in srgb, var(--beak-colors-bg-surface) 78%, transparent) !important;
			border: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-default)) !important;
			border-radius: 6px !important;
			-webkit-backdrop-filter: blur(18px) saturate(180%);
			backdrop-filter: blur(18px) saturate(180%);
			box-shadow:
				0 12px 32px rgba(0, 0, 0, 0.30),
				0 4px 10px color-mix(in srgb, var(--beak-colors-accent-pink) 14%, rgba(0, 0, 0, 0.12)),
				inset 0 1px 0 color-mix(in srgb, white 18%, transparent);
		}
		.beak-tooltip .react-tooltip-arrow,
		.beak-tooltip > [class*='styles-module_arrow'] {
			background: color-mix(in srgb, var(--beak-colors-bg-surface) 80%, transparent) !important;
			border-right: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-default));
			border-bottom: 1px solid color-mix(in srgb, var(--beak-colors-accent-pink) 22%, var(--beak-colors-border-default));
		}
		/* Fallback when backdrop-filter is unavailable (Linux without compositor). */
		@supports not (backdrop-filter: blur(8px)) {
			.beak-tooltip {
				background: var(--beak-colors-bg-surface) !important;
			}
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
