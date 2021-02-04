import BeakRequestPreferences from '@beak/app/lib/beak-hub/request-preferences';
import React from 'react';

const RequestPreferencesContext = React.createContext<BeakRequestPreferences | null>(null);

export default RequestPreferencesContext;
