import React from 'react';
import { PlacesType, Tooltip } from 'react-tooltip';

import 'react-tooltip/dist/react-tooltip.css';

interface TooltipDefinition {
	anchor: string;
	placement?: PlacesType;
	content?: string;
}

const tooltips: TooltipDefinition[] = [{
	anchor: '#tt-action-bar-encryption-button',
	placement: 'bottom',
	content: 'View project encryption',
}, {
	anchor: '#tt-action-bar-previous-flight-history',
	placement: 'bottom',
	content: 'Go to previous item in flight history',
}, {
	anchor: '#tt-action-bar-next-flight-history',
	placement: 'bottom',
	content: 'Go to next item in flight history',
}, {
	anchor: '#tt-action-bar-alert-button',
	placement: 'bottom',
	content: 'Shows possible errors with your project',
}, {
	anchor: '#tt-action-bar-flight-status-pending',
	placement: 'bottom',
	content: 'Awaiting flight...',
}, {
	anchor: '#tt-action-bar-flight-status-failed',
	placement: 'bottom',
	content: 'Flight failed',
}, {
	anchor: '#tt-action-bar-flight-status-success',
	placement: 'bottom',
	content: 'Flight complete',
}, {
	anchor: '#tt-action-bar-flight-status-server-failed',
	placement: 'bottom',
	content: 'Flight complete',
}, {
	anchor: '#tt-action-bar-flight-status-active',
	placement: 'bottom',
	content: 'Flight in progress',
}, {
	anchor: '#tt-preferences-notifications-information-requests',
	placement: 'bottom',
	content: 'Requests where the HTTP status code is in the information range (100-199) or in the redirection range (300-399).',
}, {
	anchor: '#tt-variable-input-extension',
	content: 'This value is an extension',
}, {
	anchor: '#tt-request-preview-copy',
	content: 'Copy request preview',
}, {
	anchor: '#tt-request-preview-share',
	content: 'Create request share link',
}, {
	anchor: 'tt-response-header-url-bar',
}, {
	anchor: 'tt-action-bar-omni-search',
}, {
	anchor: 'tt-omni-bar-finder-request-uri',
}, {
	anchor: 'tt-realtime-values-renderer-extension-missing',
}, {
	anchor: 'tt-sidebar-menu-item',
}];

export const Tooltips: React.FC = () => (
	<React.Fragment>
		{tooltips.map(t => {
			if (t.content === void 0) {
				return (
					<Tooltip
						id={t.anchor}
						key={t.anchor}
						place={t.placement}
					/>
				);
			}

			return (
				<Tooltip
					anchorSelect={t.anchor}
					key={t.anchor}
					place={t.placement}
				>
					{t.content}
				</Tooltip>
			);
		})}
	</React.Fragment>
);

export default Tooltips;
