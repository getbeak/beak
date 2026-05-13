import * as React from 'react';
import { ReflexSplitter as RS, type ReflexSplitterProps as RSP } from 'react-reflex';

// react-reflex applies inline styles on its own root element, so we layer
// our own inline style on top and rely on a tiny module-level <style>
// injection for the :hover state (since inline style can't express :hover).
// Colours come from the Chakra CSS variables so the splitter follows the
// active theme.

export interface ReflexSplitterProps extends RSP {
	orientation: 'horizontal' | 'vertical';
	hideVisualIndicator?: boolean;
	$disabled?: boolean;
	$customChildren?: boolean;
}

const splitterStyle = (
	orientation: 'horizontal' | 'vertical',
	customChildren: boolean,
	disabled: boolean,
): React.CSSProperties => ({
	width: orientation === 'vertical' ? '2px' : 'auto',
	height: customChildren ? 'auto' : orientation === 'horizontal' ? '2px' : 'auto',
	backgroundColor: 'var(--beak-colors-border-default)',
	border: 'none',
	transition: 'background .2s, box-shadow .2s',
	display: disabled ? 'none' : undefined,
	pointerEvents: disabled ? 'none' : undefined,
	cursor: disabled ? 'default' : undefined,
});

const ReflexSplitter: React.FC<ReflexSplitterProps> = ({
	orientation,
	$disabled,
	$customChildren,
	style,
	...rest
}) => {
	// `orientation` lives on RSP but RS's own typed surface omits it; we pass
	// everything through via cast so the runtime gets what react-reflex needs.
	const splitterProps = {
		...rest,
		orientation,
		className: `beak-reflex-splitter ${rest.className ?? ''}`,
		style: { ...splitterStyle(orientation, !!$customChildren, !!$disabled), ...(style as React.CSSProperties) },
	} as unknown as React.ComponentProps<typeof RS>;

	return <RS {...splitterProps} />;
};

export interface HorizontalContextualReflexSplitterProps extends RSP {
	orientation: 'horizontal';
	children: React.ReactElement;
}

export const HorizontalContextualReflexSplitter: React.FC<HorizontalContextualReflexSplitterProps> = ({
	style,
	...rest
}) => (
	<RS
		{...rest}
		className={`beak-reflex-splitter-ctx ${rest.className ?? ''}`}
		style={{
			width: 'auto',
			height: 'auto',
			backgroundColor: 'var(--beak-colors-border-default)',
			border: 'none',
			...(style as React.CSSProperties),
		}}
	/>
);

if (typeof document !== 'undefined' && !document.getElementById('beak-reflex-splitter-styles')) {
	const styleEl = document.createElement('style');
	styleEl.id = 'beak-reflex-splitter-styles';
	styleEl.textContent = `
		.beak-reflex-splitter:hover {
			background-color: var(--beak-colors-accent-pink) !important;
			box-shadow: 0px 0px 0px 1px var(--beak-colors-accent-pink) !important;
		}
	`;
	document.head.appendChild(styleEl);
}

export default ReflexSplitter;
