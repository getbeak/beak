import React from 'react';

import BeakUserPreferences from '../lib/beak-hub/user-preferences';

const BeakUserPreferencesContext = React.createContext<BeakUserPreferences | null>(null);

export default BeakUserPreferencesContext;
