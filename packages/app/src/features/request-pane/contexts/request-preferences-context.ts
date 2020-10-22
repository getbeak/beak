import { RequestPreference } from '@beak/common/types/beak-project';
import React from 'react';

const RequestPreferencesContext = React.createContext<RequestPreference | null>(null);

export default RequestPreferencesContext;
