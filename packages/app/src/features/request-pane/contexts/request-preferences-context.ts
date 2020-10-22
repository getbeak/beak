import { RequestPreference } from '@beak/common/dist/beak-project/types';
import React from 'react';

const RequestPreferencesContext = React.createContext<RequestPreference | null>(null);

export default RequestPreferencesContext;
