import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { ApplicationState } from '.';

export const useAppSelector: TypedUseSelectorHook<ApplicationState> = useSelector;
