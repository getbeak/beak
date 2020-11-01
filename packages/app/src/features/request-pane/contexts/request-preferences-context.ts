import { RequestPreference } from '@beak/common/dist/types/beak-hub';
import React from 'react';

const RequestPreferencesContext = React.createContext<RequestPreference | null>(null);

export default RequestPreferencesContext;
