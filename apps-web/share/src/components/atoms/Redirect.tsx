import React from 'react';

const Redirect: React.FC<React.PropsWithChildren<unknown>> = () => {
	window.location.href = 'https://getbeak.app';

	return null;
};

export default Redirect;
