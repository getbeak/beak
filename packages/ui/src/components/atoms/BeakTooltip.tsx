import { Portal, Tooltip } from '@chakra-ui/react';
import * as React from 'react';

interface BeakTooltipProps {
	content: React.ReactNode;
	/** ms before the tooltip opens on hover. Default matches Chakra. */
	openDelay?: number;
	/** ms before the tooltip closes after the cursor leaves. */
	closeDelay?: number;
	/** When true, the tooltip is bypassed and `children` renders unchanged. */
	disabled?: boolean;
	children: React.ReactElement;
}

/**
 * Thin wrapper over Chakra v3's Tooltip namespace so call sites can use a
 * single `<BeakTooltip content="...">{trigger}</BeakTooltip>` instead of the
 * five-component Root/Trigger/Positioner/Content/Arrow incantation. No bespoke
 * CSS — the Chakra recipe defaults look better than the previous hand-rolled
 * react-tooltip styling and stay consistent with the rest of the design
 * system.
 */
const BeakTooltip: React.FC<BeakTooltipProps> = ({ content, openDelay = 200, closeDelay = 0, disabled, children }) => {
	if (disabled || content === null || content === undefined || content === '') return children;

	return (
		<Tooltip.Root openDelay={openDelay} closeDelay={closeDelay}>
			<Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
			<Portal>
				<Tooltip.Positioner>
					<Tooltip.Content>
						<Tooltip.Arrow>
							<Tooltip.ArrowTip />
						</Tooltip.Arrow>
						{content}
					</Tooltip.Content>
				</Tooltip.Positioner>
			</Portal>
		</Tooltip.Root>
	);
};

export default BeakTooltip;
