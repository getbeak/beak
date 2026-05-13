import * as React from 'react';
import { ReflexElement as RE, type ReflexElementProps as REP } from 'react-reflex';

export interface ReflexElementProps extends REP {
	$forcedWidth?: number;
}

const ReflexElement: React.FC<ReflexElementProps> = ({ $forcedWidth, minSize, style, ...rest }) => {
	const forced = $forcedWidth !== void 0;
	return (
		<RE
			minSize={minSize}
			{...rest}
			style={{
				...(forced
					? { width: `${$forcedWidth}px`, minWidth: `${$forcedWidth}px`, maxWidth: `${$forcedWidth}px` }
					: minSize
						? { minWidth: `${minSize}px` }
						: {}),
				...(style as React.CSSProperties),
			}}
		/>
	);
};

export default ReflexElement;
