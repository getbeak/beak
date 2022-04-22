import React from 'react';

const Redirect: React.FunctionComponent<React.PropsWithChildren<unknown>> = () => {
	window.location.href = 'https://getbeak.app';

	return null;
};

export default Redirect;
