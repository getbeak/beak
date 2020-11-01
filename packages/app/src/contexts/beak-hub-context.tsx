import React from 'react';

import BeakHub from '../lib/beak-hub';

const BeakHubContext = React.createContext<BeakHub | null>(null);

export default BeakHubContext;
