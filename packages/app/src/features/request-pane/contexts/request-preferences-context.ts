import { RequestPreference } from '@beak/common/beak-hub/types';
import React from 'react';

const RequestPreferencesContext = React.createContext<RequestPreference | null>(null);

export default RequestPreferencesContext;
