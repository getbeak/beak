import React from 'react';
import { ValidRequestNode } from '@beak/common/types/beak-project';

// @ts-expect-error
const SelectedNodeContext = React.createContext<ValidRequestNode>(null);

export default SelectedNodeContext;
