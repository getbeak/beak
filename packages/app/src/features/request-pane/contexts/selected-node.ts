import { RequestNode } from '@beak/common/types/beak-project';
import React from 'react';

// @ts-expect-error
const SelectedNodeContext = React.createContext<RequestNode>(null);

export default SelectedNodeContext;
