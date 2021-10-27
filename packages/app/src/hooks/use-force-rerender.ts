import React from 'react';

// https://stackoverflow.com/questions/53215285/how-can-i-force-a-component-to-re-render-with-hooks-in-react/58606536#58606536
export default function useForceReRender(): () => void {
	return React.useReducer(() => ({}), {})[1] as () => void;
}
