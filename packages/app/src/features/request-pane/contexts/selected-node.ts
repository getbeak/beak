import { ValidRequestNode } from '@beak/common/types/beak-project';
import React from 'react';

// @ts-expect-error
const SelectedNodeContext = React.createContext<ValidRequestNode>(null);

export default SelectedNodeContext;
